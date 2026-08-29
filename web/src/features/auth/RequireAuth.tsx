import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './AuthProvider'

type Props = {
  children: ReactNode
}

/** Redirects anonymous visitors to /login with next= current path. */
export function RequireAuth({ children }: Props) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <p className="app-loading" role="status">
        正在读取会话…
      </p>
    )
  }

  if (!user) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }

  return children
}
