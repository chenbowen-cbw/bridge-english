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

export async function saveLearningPlan(
  userId: string,
  answers: PlanAnswers,
  built: BuiltPlan,
): Promise<{ ok: true; plan: LearningPlanRow } | { ok: false; error: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { ok: false, error: 'Supabase 未配置' }
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

export async function getActivePlan(
  userId: string,
): Promise<LearningPlanRow | null> {
  if (!supabase || !isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('learning_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return data as LearningPlanRow
}
