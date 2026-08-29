import { getActivePlan } from '../plans/api'

/** After login: honor `next`, else active plan → /app, else /app/plan. */
export async function resolvePostLoginPath(
  userId: string,
  nextParam: string | null,
): Promise<string> {
  if (nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')) {
    return nextParam
  }
  const plan = await getActivePlan(userId)
  return plan ? '/app' : '/app/plan'
}
