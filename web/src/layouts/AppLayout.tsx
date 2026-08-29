import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth'
import { FOOTPRINTS_CHANGED, listFootprints } from '../features/footprints'
import { getProfilePlanTier } from '../features/profile/api'
import type { LocalFootprint, PlanTier } from '../lib/supabase'
import { WorkbenchSidebar } from './WorkbenchSidebar'

const PAGE_TITLE: Record<string, string> = {
  '/app': '今日',
  '/app/plan': '计划',
  '/app/footprints': '足迹',
  '/app/review': '复盘',
}

export function AppLayout() {
  const { user, configured, loading } = useAuth()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  const [tier, setTier] = useState<PlanTier>('free')
  const [sessions, setSessions] = useState<LocalFootprint[]>([])
  const displayTier = user ? tier : 'free'
  const pageTitle = PAGE_TITLE[location.pathname] ?? '工作台'

  useEffect(() => {
    if (!user) return
    let cancelled = false
    void getProfilePlanTier(user.id).then((t) => {
      if (!cancelled) setTier(t)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    let cancelled = false
    function load() {
      void listFootprints(user?.id).then((res) => {
        if (!cancelled) setSessions(res.items)
      })
    }
    load()
    window.addEventListener(FOOTPRINTS_CHANGED, load)
    return () => {
      cancelled = true
      window.removeEventListener(FOOTPRINTS_CHANGED, load)
    }
  }, [user?.id])

  useEffect(() => {
    if (!navOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  return (
    <div className="page page--app">
      {navOpen ? (
        <button
          type="button"
          className="app-sidebar-backdrop"
          aria-label="关闭侧栏"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <WorkbenchSidebar
        open={navOpen}
        tier={displayTier}
        sessions={sessions}
        onNavigate={() => setNavOpen(false)}
      />

      <div className="app-workspace">
        <header className="app-thinbar">
          <button
            type="button"
            className={`nav-burger${navOpen ? ' on' : ''}`}
            aria-expanded={navOpen}
            aria-controls="app-sidebar"
            aria-label={navOpen ? '关闭菜单' : '打开菜单'}
            onClick={() => setNavOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
          <p className="app-thinbar-title">{pageTitle}</p>
        </header>

        {!configured ? (
          <p className="env-banner" role="status">
            未检测到 <code>VITE_SUPABASE_*</code>。复制 <code>web/.env.example</code> →{' '}
            <code>web/.env</code> 后重启 <code>npm run dev</code>。
          </p>
        ) : null}

        <main className="app-main">
          {loading ? (
            <p className="app-loading" role="status">
              正在读取会话…
            </p>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  )
}
