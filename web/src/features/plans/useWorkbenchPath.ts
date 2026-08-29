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
    void getActivePlan(user.id).then((plan) => {
      if (!cancelled) setPath(plan ? '/app' : '/app/plan')
    })
    return () => {
      cancelled = true
    }
  }, [user])

  return user ? path : '/app'
}
