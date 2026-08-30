import { useEffect, useState } from 'react'
import { useAuth } from '../auth'
import { getActivePlan } from './api'

/** Logged-in marketing CTA: active plan → /app, else /app/plan. */
export function useWorkbenchPath() {
  const { user } = useAuth()
  const [path, setPath] = useState('/app')

  useEffect(() => {
    if (!user) return
    let cancelled = false
    void getActivePlan(user.id).then((res) => {
      if (cancelled) return
      // Fetch failure is not “no plan” — stay on today, which can retry.
      if (!res.ok) {
        setPath('/app')
        return
      }
      setPath(res.plan ? '/app' : '/app/plan')
    })
    return () => {
      cancelled = true
    }
  }, [user])

  return user ? path : '/app'
}
