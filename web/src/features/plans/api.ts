import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import type { BuiltPlan } from './buildPlan'
import type { PlanAnswers } from './questions'

export type LearningPlanRow = {
  id: string
  user_id: string
  status: string
  questionnaire: PlanAnswers
  goal_sentence: string | null
  week_focus: string | null
  retest_at: string | null
  tasks_progress: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type PlanQueryResult =
  | { ok: true; plan: LearningPlanRow | null }
  | { ok: false; error: string }

export type PlanListResult =
  | { ok: true; plans: LearningPlanRow[] }
  | { ok: false; error: string }

export type PlanFirstTask = {
  title: string | null
  templateId: string | null
  criteria: string | null
}

const UNREACHABLE = '暂时读不到计划，请稍后重试。'

export function planFirstTask(plan: LearningPlanRow): PlanFirstTask {
  const progress = plan.tasks_progress ?? {}
  return {
    title: typeof progress.firstTaskTitle === 'string' ? progress.firstTaskTitle : null,
    templateId: typeof progress.firstTemplateId === 'string' ? progress.firstTemplateId : null,
    criteria: typeof progress.firstTaskCriteria === 'string' ? progress.firstTaskCriteria : null,
  }
}

export function formatPlanDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export async function saveLearningPlan(
  userId: string,
  answers: PlanAnswers,
  built: BuiltPlan,
): Promise<{ ok: true; plan: LearningPlanRow } | { ok: false; error: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { ok: false, error: '还没连上保存服务，计划先留在这一页。' }
  }

  // Archive prior active plans (soft)
  await supabase
    .from('learning_plans')
    .update({ status: 'archived' })
    .eq('user_id', userId)
    .eq('status', 'active')

  const retest = new Date()
  retest.setDate(retest.getDate() + 7)

  const { data, error } = await supabase
    .from('learning_plans')
    .insert({
      user_id: userId,
      status: 'active',
      questionnaire: answers,
      goal_sentence: built.goalSentence,
      week_focus: built.weekFocus,
      retest_at: retest.toISOString().slice(0, 10),
      tasks_progress: {
        firstTemplateId: built.firstTemplateId,
        firstTaskTitle: built.firstTaskTitle,
        firstTaskCriteria: built.firstTaskCriteria,
      },
    })
    .select('*')
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? '写入计划失败' }
  }

  // Mirror focus onto profile.plan_focus (plan_tier untouched)
  await supabase
    .from('profiles')
    .update({
      plan_focus: {
        one: built.focus.one,
        why: built.focus.why,
        at: new Date().toISOString(),
      },
    })
    .eq('user_id', userId)

  return { ok: true, plan: data as LearningPlanRow }
}

export async function getActivePlan(userId: string): Promise<PlanQueryResult> {
  if (!supabase || !isSupabaseConfigured) {
    return { ok: false, error: UNREACHABLE }
  }
  const { data, error } = await supabase
    .from('learning_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return { ok: false, error: UNREACHABLE }
  return { ok: true, plan: (data as LearningPlanRow | null) ?? null }
}

export async function listArchivedPlans(userId: string): Promise<PlanListResult> {
  if (!supabase || !isSupabaseConfigured) {
    return { ok: false, error: UNREACHABLE }
  }
  const { data, error } = await supabase
    .from('learning_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'archived')
    .order('updated_at', { ascending: false })
  if (error) return { ok: false, error: UNREACHABLE }
  return { ok: true, plans: (data as LearningPlanRow[]) ?? [] }
}

export async function getPlanById(userId: string, planId: string): Promise<PlanQueryResult> {
  if (!supabase || !isSupabaseConfigured) {
    return { ok: false, error: UNREACHABLE }
  }
  const { data, error } = await supabase
    .from('learning_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('id', planId)
    .maybeSingle()
  if (error) return { ok: false, error: UNREACHABLE }
  return { ok: true, plan: (data as LearningPlanRow | null) ?? null }
}
