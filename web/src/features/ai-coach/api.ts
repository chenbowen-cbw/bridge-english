import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import type { CoachResponse } from '../../lib/supabase'

export type CoachRequest = {
  draft: string
  taskTitle?: string
  criteria?: string
  scene?: string
}

/**
 * Calls Edge Function `ai-coach`. Requires session.
 * Hard client guard: empty draft never sent (server also rejects).
 */
export async function requestCoachTips(
  input: CoachRequest,
): Promise<{ ok: true; data: CoachResponse } | { ok: false; error: string }> {
  const draft = input.draft.trim()
  if (!draft) {
    return { ok: false, error: '需要先有独立稿，才能请求陪练（不会代写终稿）。' }
  }
  if (!supabase || !isSupabaseConfigured) {
    return { ok: false, error: 'Supabase 未配置' }
  }

  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    return { ok: false, error: '请先登录' }
  }

  const { data, error } = await supabase.functions.invoke<CoachResponse>('ai-coach', {
    body: {
      draft,
      taskTitle: input.taskTitle,
      criteria: input.criteria,
      scene: input.scene,
    },
  })

  if (error) {
    return { ok: false, error: error.message }
  }
  if (!data?.tips) {
    return { ok: false, error: '陪练返回为空' }
  }
  return { ok: true, data }
}
