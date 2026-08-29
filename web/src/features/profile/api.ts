import { isSupabaseConfigured, supabase, type PlanTier } from '../../lib/supabase'

export async function getProfilePlanTier(userId: string): Promise<PlanTier> {
  if (!supabase || !isSupabaseConfigured) return 'free'
  const { data, error } = await supabase
    .from('profiles')
    .select('plan_tier')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data?.plan_tier) return 'free'
  return data.plan_tier as PlanTier
}
