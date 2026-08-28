import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import type { FootprintRow, LocalFootprint, NewFootprintInput } from '../../lib/supabase'
import { localToInsert, rowToLocal } from '../../lib/supabase'
import {
  adoptLegacyAnonBucket,
  footprintsStorageKey,
  FP_ANON_KEY,
  readJsonArray,
  writeJson,
} from './storage'

adoptLegacyAnonBucket()

export function loadLocalFootprints(userId?: string | null): LocalFootprint[] {
  return readJsonArray<LocalFootprint>(footprintsStorageKey(userId))
}

export function saveLocalFootprints(list: LocalFootprint[], userId?: string | null) {
  writeJson(footprintsStorageKey(userId), list)
}

/** Dual-write: update the active user (or anon) bucket; sync to Supabase when session exists. */
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
      saveLocalFootprints(items, userId)
      return { items, source: 'supabase' }
    }
  }
  return { items: loadLocalFootprints(userId), source: 'local' }
}

export type CreateFootprintResult = {
  item: LocalFootprint
  cloud: 'ok' | 'skipped' | 'failed'
  cloudError?: string
}

export async function createFootprint(
  input: NewFootprintInput,
  userId?: string | null,
): Promise<CreateFootprintResult> {
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

  const list = loadLocalFootprints(userId)
  list.unshift(local)
  saveLocalFootprints(list, userId)

  if (!userId || !supabase || !isSupabaseConfigured) {
    return { item: local, cloud: 'skipped' }
  }

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
    return { item: rowToLocal(data as FootprintRow), cloud: 'ok' }
  }

  console.warn('[footprints] supabase insert failed, kept local', error)
  return {
    item: local,
    cloud: 'failed',
    cloudError: error?.message ?? '云端写入失败',
  }
}

export async function updateFootprintMigrated(
  id: string,
  migrated: boolean,
  userId?: string | null,
): Promise<void> {
  const list = loadLocalFootprints(userId)
  saveLocalFootprints(
    list.map((e) => (e.id === id ? { ...e, migrateChecked: migrated } : e)),
    userId,
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
  saveLocalFootprints(
    loadLocalFootprints(userId).filter((e) => e.id !== id),
    userId,
  )

  if (userId && supabase && isSupabaseConfigured) {
    const { error } = await supabase
      .from('footprints')
      .delete()
      .or(`id.eq.${id},client_id.eq.${id}`)
      .eq('user_id', userId)
    if (error) console.warn('[footprints] supabase delete failed', error)
  }
}

/**
 * After login: push anon-bucket entries (not another user's) into this user's cloud + bucket.
 * Does not merge foreign `bridge-footprints:<otherUserId>` keys.
 */
export async function migrateLocalFootprintsToCloud(userId: string): Promise<number> {
  if (!supabase || !isSupabaseConfigured) return 0

  const anon = loadLocalFootprints(null)
  const userLocal = loadLocalFootprints(userId)
  const byId = new Map<string, LocalFootprint>()
  for (const e of [...userLocal, ...anon]) byId.set(e.id, e)
  const merged = Array.from(byId.values())

  if (!merged.length) {
    saveLocalFootprints([], userId)
    return 0
  }

  const { data: existing } = await supabase
    .from('footprints')
    .select('client_id')
    .eq('user_id', userId)

  const have = new Set(
    (existing ?? [])
      .map((r: { client_id: string | null }) => r.client_id)
      .filter(Boolean) as string[],
  )

  const missing = merged.filter((e) => !have.has(e.id))
  if (missing.length) {
    const { error } = await supabase
      .from('footprints')
      .insert(missing.map((e) => localToInsert(e, userId)))
    if (error) {
      console.warn('[footprints] migrate failed', error)
      saveLocalFootprints(merged, userId)
      return 0
    }
  }

  // Refresh from cloud into user bucket; clear anon so next anonymous session is clean.
  const listed = await listFootprints(userId)
  saveLocalFootprints(listed.items, userId)
  writeJson(FP_ANON_KEY, [])
  return missing.length
}
