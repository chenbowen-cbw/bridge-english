import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BridgeButton } from '../components/BridgeButton'
import { useAuth } from '../features/auth'
import { getProfilePlanTier } from '../features/profile/api'
import { planTierLabel } from '../lib/planTier'
import type { PlanTier } from '../lib/supabase'

const NAV = [
  { to: '/app', end: true, label: '今日' },
  { to: '/app/plan', end: false, label: '计划' },
  { to: '/app/footprints', end: false, label: '足迹' },
  { to: '/app/review', end: false, label: '复盘' },
] as const

export function AppLayout() {
  const { user, configured, signOut, loading } = useAuth()
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(false)
  const [tier, setTier] = useState<PlanTier>('free')

  useEffect(() => {
    if (!user) {
      setTier('free')
      return
    }
    let cancelled = false
    void getProfilePlanTier(user.id).then((t) => {
      if (!cancelled) setTier(t)
    })
    return () => {
      cancelled = true
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
      <header className="top top--app">
        <div className="wrap nav">
          <Link className="wordmark" to="/app" onClick={() => setNavOpen(false)}>
            bridge.
            <span>WORKBENCH</span>
          </Link>
          <nav className="links" aria-label="产品导航">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'on' : undefined)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-right">
            <p className="nav-tier" title="订阅档位只读，支付未接">
              当前：{planTierLabel(tier)}
            </p>
            {user ? (
              <>
                <span className="nav-user" title={user.email ?? ''}>
                  {user.email?.split('@')[0]}
                </span>
                <BridgeButton variant="ghost" arrow="none" onClick={() => void signOut()}>
                  退出
                </BridgeButton>
              </>
            ) : (
              <BridgeButton
                variant="nav"
                arrow="none"
                onClick={() => navigate('/login?next=' + encodeURIComponent('/app'))}
              >
                登录
              </BridgeButton>
            )}
            <Link className="nav-site" to="/">
              官网
            </Link>
            <button
              type="button"
              className={`nav-burger${navOpen ? ' on' : ''}`}
              aria-expanded={navOpen}
              aria-controls="app-mobile-nav"
              aria-label={navOpen ? '关闭菜单' : '打开菜单'}
              onClick={() => setNavOpen((o) => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
        {navOpen ? (
          <nav className="mobile-nav" id="app-mobile-nav" aria-label="移动导航">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setNavOpen(false)}>
                {item.label}
              </Link>
            ))}
            <p className="mobile-tier">当前：{planTierLabel(tier)}</p>
            <Link to="/" onClick={() => setNavOpen(false)}>
              官网
            </Link>
            {!user ? (
              <button
                type="button"
                onClick={() => {
                  setNavOpen(false)
                  navigate('/login?next=' + encodeURIComponent('/app'))
                }}
              >
                登录
              </button>
            ) : (
              <button type="button" onClick={() => void signOut()}>
                退出
              </button>
            )}
          </nav>
        ) : null}
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
  )
}
