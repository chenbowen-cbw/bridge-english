export { supabase, isSupabaseConfigured } from './client'
export type { Database, Json } from './database'
export type {
  PlanTier,
  Profile,
  FootprintMode,
  FootprintRow,
  LocalFootprint,
  NewFootprintInput,
  CoachTip,
  CoachResponse,
} from './types'
export { rowToLocal, localToInsert } from './types'
