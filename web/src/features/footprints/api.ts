import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import type { FootprintRow, LocalFootprint, NewFootprintInput } from '../../lib/supabase'
import { localToInsert, rowToLocal } from '../../lib/supabase'

const FP_KEY = 'bridge-footprints'

export function loadLocalFootprints(): LocalFootprint[] {
  try {
    const raw = localStorage.getItem(FP_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as unknown
    return Array.isArray(list) ? (list as LocalFootprint[]) : []
  } catch {
    return []
  }
}

export function saveLocalFootprints(list: LocalFootprint[]) {
  localStorage.setItem(FP_KEY, JSON.stringify(list))
}

/** Dual-write: always update localStorage; sync to Supabase when session exists. */
export async function listFootprints(userId?: string | null): Promise<{
  items: LocalFootprint[]
  source: 'supabase' | 'local'
}> {
  if (userId && supabase && isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('footprints')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const items = (data as FootprintRow[]).map(rowToLocal)
      saveLocalFootprints(items)
      return { items, source: 'supabase' }
    }
  }
  return { items: loadLocalFootprints(), source: 'local' }
}

export async function createFootprint(
  input: NewFootprintInput,
  userId?: string | null,
): Promise<LocalFootprint> {
  const clientId =
    input.client_id ?? `fp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const local: LocalFootprint = {
    id: clientId,
    scene: input.scene,
    title: input.title,
    date: new Date().toISOString(),
    raw: input.body,
    stdChecked: input.criteria_met ?? false,
    migrateChecked: input.migrated ?? false,
    selfRate: input.self_rating ?? null,
    mode: input.mode ?? 'text',
  }

  const list = loadLocalFootprints()
  list.unshift(local)
  saveLocalFootprints(list)

  if (userId && supabase && isSupabaseConfigured) {
    const payload = {
      ...localToInsert(local, userId),
      plan_id: input.plan_id ?? null,
    }
    const { data, error } = await supabase
      .from('footprints')
      .insert(payload)
      .select('*')
      .single()

    if (!error && data) {
      return rowToLocal(data as FootprintRow)
    }
    console.warn('[footprints] supabase insert failed, kept local', error)
  }

  return local
}

export async function updateFootprintMigrated(
  id: string,
  migrated: boolean,
  userId?: string | null,
): Promise<void> {
  const list = loadLocalFootprints()
  saveLocalFootprints(
    list.map((e) => (e.id === id ? { ...e, migrateChecked: migrated } : e)),
  )

  if (userId && supabase && isSupabaseConfigured) {
    const { error } = await supabase
      .from('footprints')
      .update({ migrated })
      .or(`id.eq.${id},client_id.eq.${id}`)
      .eq('user_id', userId)
    if (error) console.warn('[footprints] supabase update failed', error)
  }
}

export async function deleteFootprint(
  id: string,
  userId?: string | null,
): Promise<void> {
  saveLocalFootprints(loadLocalFootprints().filter((e) => e.id !== id))

  if (userId && supabase && isSupabaseConfigured) {
    const { error } = await supabase
      .from('footprints')
      .delete()
      .or(`id.eq.${id},client_id.eq.${id}`)
      .eq('user_id', userId)
    if (error) console.warn('[footprints] supabase delete failed', error)
  }
}

/** Push local-only entries after login. */
export async function migrateLocalFootprintsToCloud(userId: string): Promise<number> {
  if (!supabase || !isSupabaseConfigured) return 0
  const local = loadLocalFootprints()
  if (!local.length) return 0

  const { data: existing } = await supabase
    .from('footprints')
    .select('client_id')
    .eq('user_id', userId)

  const have = new Set(
    (existing ?? [])
      .map((r: { client_id: string | null }) => r.client_id)
      .filter(Boolean) as string[],
  )

  const missing = local.filter((e) => !have.has(e.id))
  if (!missing.length) return 0

  const { error } = await supabase
    .from('footprints')
    .insert(missing.map((e) => localToInsert(e, userId)))
  if (error) {
    console.warn('[footprints] migrate failed', error)
    return 0
  }
  return missing.length
}
