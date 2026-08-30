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

/** 「稍后再说」：不要 history.back。练习浅试回工作台路径，其余回首页。 */
export function resolveLoginDismissPath(nextParam: string | null): string {
  if (nextParam && nextParam.startsWith('/app/footprints') && !nextParam.startsWith('//')) {
    return nextParam
  }
  if (nextParam && nextParam.startsWith('/app') && !nextParam.startsWith('//')) {
    return '/app'
  }
  return '/'
}
