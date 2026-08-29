export type PlanTier = 'free' | 'daily' | 'deep'

export type Profile = {
  user_id: string
  display_name: string | null
  plan_tier: PlanTier
  plan_focus: { one?: string; why?: string; at?: string } | null
  locale: string
  created_at: string
  updated_at: string
}

export type FootprintMode = 'text' | 'voice'

/** DB row */
export type FootprintRow = {
  id: string
  user_id: string
  plan_id: string | null
  client_id: string | null
  scene: string
  title: string
  body: string
  criteria_met: boolean
  self_rating: string | null
  migrated: boolean
  mode: FootprintMode
  created_at: string
  updated_at: string
}

/** localStorage shape from index.html prototype */
export type LocalFootprint = {
  id: string
  scene: string
  title: string
  date: string
  raw: string
  stdChecked: boolean
  migrateChecked: boolean
  selfRate: string | null
  mode: FootprintMode
  /** Local-only / unsynced with cloud. Kept when listFootprints merges a successful cloud payload. */
  pending?: boolean
}

export type NewFootprintInput = {
  scene: string
  title: string
  body: string
  criteria_met?: boolean
  self_rating?: string | null
  migrated?: boolean
  mode?: FootprintMode
  client_id?: string | null
  plan_id?: string | null
}

export type CoachTip = { tag: string; text: string }

export type CoachResponse = {
  tips: CoachTip[]
  source: 'mock' | 'model'
  meta: {
    userId: string
    taskTitle: string | null
    rewritten: false
    boundary: string
  }
}

export function rowToLocal(row: FootprintRow): LocalFootprint {
  return {
    id: row.client_id ?? row.id,
    scene: row.scene,
    title: row.title,
    date: row.created_at,
    raw: row.body,
    stdChecked: row.criteria_met,
    migrateChecked: row.migrated,
    selfRate: row.self_rating,
    mode: row.mode,
  }
}

export function localToInsert(entry: LocalFootprint, userId: string) {
  return {
    user_id: userId,
    client_id: entry.id,
    scene: entry.scene,
    title: entry.title,
    body: entry.raw,
    criteria_met: !!entry.stdChecked,
    self_rating: entry.selfRate,
    migrated: !!entry.migrateChecked,
    mode: (entry.mode === 'voice' ? 'voice' : 'text') as FootprintMode,
    created_at: entry.date || new Date().toISOString(),
    plan_id: null as string | null,
  }
}
