import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import type { LocalFootprint } from '../../lib/supabase'
import { listFootprints } from '../footprints/api'

export type ReviewDims = {
  done: string
  quality: string
  keep: string
  migrateNote: string
  migrateLive: boolean
}

export type WeeklyReviewPayload = {
  week_key: string
  answers: { dims: ReviewDims }
  focus_next: string
  footprint_ids: string[]
}

export function weekKey(d = new Date()): string {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  const day = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - day)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${y}-W${m}${dd}`
}

export function weekRangeLabel(d = new Date()): string {
  const now = new Date(d)
  now.setHours(0, 0, 0, 0)
  const day = (now.getDay() + 6) % 7
  const mon = new Date(now)
  mon.setDate(now.getDate() - day)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const fmt = (x: Date) => `${x.getMonth() + 1}/${x.getDate()}`
  return `${fmt(mon)} – ${fmt(sun)}`
}

export function startOfWeek(d = new Date()): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const day = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - day)
  return x
}

export function pickWeekFootprints(all: LocalFootprint[], max = 3): LocalFootprint[] {
  if (!all.length) return []
  const wk = startOfWeek().getTime()
  const thisWeek = all.filter((e) => new Date(e.date).getTime() >= wk)
  const pool = thisWeek.length ? [...thisWeek, ...all.filter((e) => !thisWeek.includes(e))] : all
  const out: LocalFootprint[] = []
  const seen = new Set<string>()
  for (const e of pool) {
    if (seen.has(e.id)) continue
    seen.add(e.id)
    out.push(e)
    if (out.length >= max) break
  }
  return out
}

export async function loadReviewContext(userId?: string | null): Promise<{
  footprints: LocalFootprint[]
  picks: LocalFootprint[]
  existing: WeeklyReviewPayload | null
}> {
  const listed = await listFootprints(userId)
  const picks = pickWeekFootprints(listed.items)
  let existing: WeeklyReviewPayload | null = null

  if (userId && supabase && isSupabaseConfigured) {
    const key = weekKey()
    const { data } = await supabase
      .from('weekly_reviews')
      .select('*')
      .eq('user_id', userId)
      .eq('week_key', key)
      .maybeSingle()
    if (data) {
      existing = {
        week_key: data.week_key,
        answers: data.answers as WeeklyReviewPayload['answers'],
        focus_next: data.focus_next ?? '',
        footprint_ids: (data.footprint_ids as string[]) ?? [],
      }
    }
  }

  return { footprints: listed.items, picks, existing }
}

export async function saveWeeklyReview(
  userId: string,
  payload: WeeklyReviewPayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { ok: false, error: 'Supabase 未配置' }
  }

  const { error } = await supabase.from('weekly_reviews').upsert(
    {
      user_id: userId,
      week_key: payload.week_key,
      answers: payload.answers,
      focus_next: payload.focus_next,
      footprint_ids: payload.footprint_ids,
    },
    { onConflict: 'user_id,week_key' },
  )

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
