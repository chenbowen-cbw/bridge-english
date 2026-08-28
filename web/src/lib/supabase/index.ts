export { supabase, isSupabaseConfigured } from './client'
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
