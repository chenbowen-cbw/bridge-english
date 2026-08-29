import type { PlanTier } from './supabase'

/** Marketing notebook names — display only; never write plan_tier from client. */
export const PLAN_TIER_LABEL: Record<PlanTier, string> = {
  free: '草稿本',
  daily: '日常本',
  deep: '深练本',
}

export function planTierLabel(tier: PlanTier | null | undefined): string {
  return PLAN_TIER_LABEL[tier ?? 'free']
}
