import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth'
import { AnonMigrateBanner, FOOTPRINTS_CHANGED, listFootprints } from '../features/footprints'
import { getProfilePlanTier } from '../features/profile/api'
import type { LocalFootprint, PlanTier } from '../lib/supabase'
import { WorkbenchSidebar } from './WorkbenchSidebar'

const PAGE_TITLE: Record<string, string> = {
  '/app': '今日',
  '/app/plan': '计划',
  '/app/footprints': '练习',
  '/app/review': '复盘',
}

const DRAWER_MQ = '(max-width: 860px)'

export function AppLayout() {
  const { user, configured, loading } = useAuth()
  const location = useLocation()
  const burgerRef = useRef<HTMLButtonElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const wasDrawerOpen = useRef(false)
  const [navOpen, setNavOpen] = useState(false)
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(DRAWER_MQ).matches : false,
  )
  const [tier, setTier] = useState<PlanTier>('free')
  const [sessions, setSessions] = useState<LocalFootprint[]>([])
  const displayTier = user ? tier : 'free'
  const pageTitle = PAGE_TITLE[location.pathname] ?? '工作台'
  const drawerHidden = isNarrow && !navOpen

  useEffect(() => {
    const mq = window.matchMedia(DRAWER_MQ)
    const sync = () => setIsNarrow(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

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

  useEffect(() => {
    if (!isNarrow) {
      wasDrawerOpen.current = false
      return
    }
    if (navOpen) {
      const first = sidebarRef.current?.querySelector<HTMLElement>(
        'a, button, [href], [tabindex]:not([tabindex="-1"])',
      )
      first?.focus()
      wasDrawerOpen.current = true
      return
    }
    if (wasDrawerOpen.current) {
      burgerRef.current?.focus()
      wasDrawerOpen.current = false
    }
  }, [navOpen, isNarrow])

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
        drawerHidden={drawerHidden}
        sidebarRef={sidebarRef}
        tier={displayTier}
        sessions={sessions}
        onNavigate={() => setNavOpen(false)}
      />

      <div className="app-workspace">
        <header className="app-thinbar">
          <button
            ref={burgerRef}
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

        <AnonMigrateBanner />

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
