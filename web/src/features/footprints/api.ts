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

export function hasAnonFootprints(): boolean {
  return loadLocalFootprints(null).length > 0
}

function sortByDateDesc(items: LocalFootprint[]): LocalFootprint[] {
  return [...items].sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0))
}

function upsertLocal(item: LocalFootprint, userId?: string | null) {
  const list = loadLocalFootprints(userId)
  const i = list.findIndex((e) => e.id === item.id)
  if (i >= 0) list[i] = item
  else list.unshift(item)
  saveLocalFootprints(list, userId)
}

/** Union by id / client_id: cloud success (incl. []) must not drop local pending / unsynced rows. */
export function mergeCloudAndLocal(
  cloud: LocalFootprint[],
  local: LocalFootprint[],
): LocalFootprint[] {
  const byId = new Map<string, LocalFootprint>()
  for (const c of cloud) {
    byId.set(c.id, { ...c, pending: false })
  }
  for (const l of local) {
    const hit = byId.get(l.id)
    if (!hit) {
      byId.set(l.id, { ...l, pending: true })
    } else if (l.pending) {
      byId.set(l.id, { ...hit, ...l, pending: true })
    }
  }
  return sortByDateDesc(Array.from(byId.values()))
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
      const cloud = (data as FootprintRow[]).map(rowToLocal)
      const merged = mergeCloudAndLocal(cloud, loadLocalFootprints(userId))
      saveLocalFootprints(merged, userId)
      return { items: merged, source: 'supabase' }
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
  const expectCloud = Boolean(userId && supabase && isSupabaseConfigured)
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
    pending: expectCloud,
  }

  const list = loadLocalFootprints(userId)
  list.unshift(local)
  saveLocalFootprints(list, userId)

  if (!expectCloud) {
    const saved = { ...local, pending: false }
    upsertLocal(saved, userId)
    return { item: saved, cloud: 'skipped' }
  }

  const payload = {
    ...localToInsert(local, userId!),
    plan_id: input.plan_id ?? null,
  }
  const { data, error } = await supabase!
    .from('footprints')
    .insert(payload)
    .select('*')
    .single()

  if (!error && data) {
    const item = { ...rowToLocal(data as FootprintRow), pending: false }
    upsertLocal(item, userId)
    return { item, cloud: 'ok' }
  }

  console.warn('[footprints] supabase insert failed, kept local', error)
  const pendingItem = { ...local, pending: true }
  upsertLocal(pendingItem, userId)
  return {
    item: pendingItem,
    cloud: 'failed',
    cloudError: error?.message ?? '没能存到网上',
  }
}

export type UpdateFootprintInput = {
  scene?: string
  title?: string
  body?: string
  criteria_met?: boolean
  self_rating?: string | null
  migrated?: boolean
  mode?: LocalFootprint['mode']
}

export async function updateFootprint(
  id: string,
  input: UpdateFootprintInput,
  userId?: string | null,
): Promise<CreateFootprintResult> {
  const list = loadLocalFootprints(userId)
  const current = list.find((e) => e.id === id)
  if (!current) {
    return {
      item: {
        id,
        scene: input.scene ?? '',
        title: input.title ?? '',
        date: new Date().toISOString(),
        raw: input.body ?? '',
        stdChecked: input.criteria_met ?? false,
        migrateChecked: input.migrated ?? false,
        selfRate: input.self_rating ?? null,
        mode: input.mode ?? 'text',
        pending: true,
      },
      cloud: 'failed',
      cloudError: '找不到这条练习',
    }
  }

  const expectCloud = Boolean(userId && supabase && isSupabaseConfigured)
  const next: LocalFootprint = {
    ...current,
    scene: input.scene ?? current.scene,
    title: input.title ?? current.title,
    raw: input.body ?? current.raw,
    stdChecked: input.criteria_met ?? current.stdChecked,
    migrateChecked: input.migrated ?? current.migrateChecked,
    selfRate: input.self_rating !== undefined ? input.self_rating : current.selfRate,
    mode: input.mode ?? current.mode,
    pending: expectCloud,
  }

  saveLocalFootprints(
    list.map((e) => (e.id === id ? next : e)),
    userId,
  )

  if (!expectCloud) {
    const saved = { ...next, pending: false }
    upsertLocal(saved, userId)
    return { item: saved, cloud: 'skipped' }
  }

  const patch = {
    scene: next.scene,
    title: next.title,
    body: next.raw,
    criteria_met: next.stdChecked,
    self_rating: next.selfRate,
    migrated: next.migrateChecked,
    mode: next.mode,
  }

  const { data, error } = await supabase!
    .from('footprints')
    .update(patch)
    .or(`id.eq.${id},client_id.eq.${id}`)
    .eq('user_id', userId!)
    .select('*')
    .maybeSingle()

  if (!error && data) {
    const item = { ...rowToLocal(data as FootprintRow), pending: false }
    upsertLocal(item, userId)
    return { item, cloud: 'ok' }
  }

  if (!data) {
    const { data: inserted, error: insertError } = await supabase!
      .from('footprints')
      .insert(localToInsert(next, userId!))
      .select('*')
      .single()
    if (!insertError && inserted) {
      const item = { ...rowToLocal(inserted as FootprintRow), pending: false }
      upsertLocal(item, userId)
      return { item, cloud: 'ok' }
    }
  }

  console.warn('[footprints] supabase update failed, kept local', error)
  const pendingItem = { ...next, pending: true }
  upsertLocal(pendingItem, userId)
  return {
    item: pendingItem,
    cloud: 'failed',
    cloudError: error?.message ?? '没能把改动存到网上',
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
 * Confirmed by the learner: push anon-bucket entries into this user's cloud + bucket.
 * Do not call from onAuthStateChange without an explicit confirm.
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

  const listed = await listFootprints(userId)
  saveLocalFootprints(listed.items, userId)
  writeJson(FP_ANON_KEY, [])
  return missing.length
}
