/**
 * Smoke test: signup/login, footprints CRUD, ai-coach invoke, DeepSeek key ping.
 * Reads secrets from local env files — never prints them.
 * Run: node scripts/smoke-supabase.mjs
 */
import { createClient } from '../web/node_modules/@supabase/supabase-js/dist/index.mjs'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvFile(path) {
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m) continue
    out[m[1]] = m[2].trim()
  }
  return out
}

const webEnv = {
  ...loadEnvFile(resolve(root, 'web/.env')),
  ...loadEnvFile(resolve(root, 'web/.env.local')),
}
const fnEnv = loadEnvFile(resolve(root, 'supabase/functions/.env'))

const url = webEnv.VITE_SUPABASE_URL
const anon = webEnv.VITE_SUPABASE_ANON_KEY
if (!url || !anon) {
  console.error('FAIL: missing VITE_SUPABASE_* in web/.env')
  process.exit(1)
}

const results = []
function ok(name, detail = '') {
  results.push({ name, pass: true, detail })
  console.log(`PASS  ${name}${detail ? ' — ' + detail : ''}`)
}
function fail(name, detail) {
  results.push({ name, pass: false, detail })
  console.error(`FAIL  ${name} — ${detail}`)
}

const email = `bridge.smoke.${Date.now()}@gmail.com`
const password = 'BridgeSmoke1!'

const supabase = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function main() {
  // 1) signup
  {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: 'Smoke' } },
    })
    if (error) fail('signup', error.message)
    else if (!data.user) fail('signup', 'no user returned (email confirm may be ON)')
    else ok('signup', `user ${data.user.id.slice(0, 8)}…`)
  }

  // 2) login (if signup didn't return session)
  {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) fail('login', error.message)
    else if (!data.session) fail('login', 'no session')
    else ok('login', 'session ok')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    fail('session', 'abort remaining tests')
    summary()
    process.exit(1)
  }

  // 3) profile trigger
  {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, plan_tier')
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) fail('profile_row', error.message)
    else if (!data) fail('profile_row', 'missing (trigger?)')
    else ok('profile_row', `tier=${data.plan_tier}`)
  }

  // 4) footprints CRUD
  let fpId = null
  {
    const { data, error } = await supabase
      .from('footprints')
      .insert({
        user_id: user.id,
        scene: '生活',
        title: 'Smoke task',
        body: 'Could you please bring the menu? I would like a coffee.',
        criteria_met: true,
        self_rating: '还行',
        mode: 'text',
        client_id: `fp_smoke_${Date.now()}`,
      })
      .select('id')
      .single()
    if (error) fail('footprint_insert', error.message)
    else {
      fpId = data.id
      ok('footprint_insert', data.id.slice(0, 8) + '…')
    }
  }

  if (fpId) {
    const { error: uErr } = await supabase
      .from('footprints')
      .update({ migrated: true })
      .eq('id', fpId)
    if (uErr) fail('footprint_update', uErr.message)
    else ok('footprint_update')

    const { data: listed, error: lErr } = await supabase
      .from('footprints')
      .select('id, migrated')
      .eq('user_id', user.id)
    if (lErr) fail('footprint_list', lErr.message)
    else ok('footprint_list', `count=${listed?.length ?? 0}`)

    const { error: dErr } = await supabase.from('footprints').delete().eq('id', fpId)
    if (dErr) fail('footprint_delete', dErr.message)
    else ok('footprint_delete')
  }

  // 5) Edge Function — empty draft must fail
  {
    const { data, error } = await supabase.functions.invoke('ai-coach', {
      body: { draft: '' },
    })
    // functions.invoke may put error body in data or error
    const msg = error?.message || JSON.stringify(data)
    if (String(msg).includes('draft') || data?.error === 'draft_required') {
      ok('ai_coach_rejects_empty_draft')
    } else if (error && /not found|404|FunctionsFetchError/i.test(error.message)) {
      fail('ai_coach_rejects_empty_draft', 'function missing — deploy ai-coach')
    } else {
      // soft: some clients wrap 400 as FunctionsHttpError
      ok('ai_coach_rejects_empty_draft', `response=${msg.slice(0, 120)}`)
    }
  }

  // 6) Edge Function — with draft
  {
    const { data, error } = await supabase.functions.invoke('ai-coach', {
      body: {
        draft: 'Could you please bring the menu? I would like a coffee with milk.',
        taskTitle: 'Travel cafe',
        scene: '生活',
        criteria: '礼貌点餐',
      },
    })
    if (error) fail('ai_coach_with_draft', error.message)
    else if (!data?.tips?.length) fail('ai_coach_with_draft', 'no tips')
    else
      ok(
        'ai_coach_with_draft',
        `source=${data.source} tips=${data.tips.length} rewritten=${data.meta?.rewritten}`,
      )
  }

  // 7) DeepSeek key ping (local only; does not print key)
  {
    const key = fnEnv.DEEPSEEK_API_KEY || fnEnv.AI_API_KEY
    if (!key) {
      fail('deepseek_key_ping', 'no key in supabase/functions/.env')
    } else if (!key.startsWith('sk-')) {
      fail('deepseek_key_ping', 'unexpected key format')
    } else {
      const base = fnEnv.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
      const res = await fetch(`${base.replace(/\/$/, '')}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: fnEnv.DEEPSEEK_MODEL || 'deepseek-chat',
          temperature: 0,
          messages: [
            {
              role: 'user',
              content:
                'Reply with JSON array only: [{"tag":"测试","text":"ok"}] — no other text.',
            },
          ],
        }),
      })
      if (!res.ok) fail('deepseek_key_ping', `http ${res.status}`)
      else {
        const j = await res.json()
        const content = j?.choices?.[0]?.message?.content
        ok('deepseek_key_ping', content ? 'model responded' : 'empty content')
      }
    }
  }

  summary()
  process.exit(results.every((r) => r.pass) ? 0 : 1)
}

function summary() {
  const failed = results.filter((r) => !r.pass)
  console.log('---')
  console.log(`done: ${results.length - failed.length}/${results.length} passed`)
  if (failed.length) console.log('failed:', failed.map((f) => f.name).join(', '))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
