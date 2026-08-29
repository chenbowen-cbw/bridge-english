import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BridgeButton } from '../components/BridgeButton'
import { useAuth } from '../features/auth'

const NAV = [
  { to: '/method', label: '方法' },
  { to: '/pricing', label: '定价' },
] as const

export function MarketingLayout() {
  const { user, configured, signOut } = useAuth()
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(false)

  function goPlan() {
    setNavOpen(false)
    if (user) navigate('/app/plan')
    else navigate('/login?next=' + encodeURIComponent('/app/plan'))
  }

  useEffect(() => {
    if (!navOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  return (
    <div className="page page--marketing">
      <header className="top">
        <div className="wrap nav">
          <Link className="wordmark" to="/" onClick={() => setNavOpen(false)}>
            bridge.
            <span>ENGLISH</span>
          </Link>
          <nav className="links" aria-label="营销导航">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'on' : undefined)}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-right">
            <button type="button" className="lang">
              中文
            </button>
            {user ? (
              <>
                <Link className="nav-user" to="/app" title={user.email ?? ''}>
                  {user.email?.split('@')[0]}
                </Link>
                <BridgeButton variant="ghost" arrow="none" onClick={() => void signOut()}>
                  退出
                </BridgeButton>
              </>
            ) : (
              <BridgeButton variant="nav" arrow="none" onClick={() => navigate('/login')}>
                登录
              </BridgeButton>
            )}
            <BridgeButton variant="nav" arrow="none" onClick={goPlan}>
              定制计划
            </BridgeButton>
            <button
              type="button"
              className={`nav-burger${navOpen ? ' on' : ''}`}
              aria-expanded={navOpen}
              aria-controls="mobile-nav"
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
          <nav className="mobile-nav" id="mobile-nav" aria-label="移动导航">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setNavOpen(false)}>
                {item.label}
              </Link>
            ))}
            {!user ? (
              <button
                type="button"
                onClick={() => {
                  setNavOpen(false)
                  navigate('/login')
                }}
              >
                登录
              </button>
            ) : (
              <>
                <Link to="/app" onClick={() => setNavOpen(false)}>
                  进入工作台
                </Link>
                <button type="button" onClick={() => void signOut()}>
                  退出
                </button>
              </>
            )}
            <button type="button" className="mobile-cta" onClick={goPlan}>
              定制计划
            </button>
          </nav>
        ) : null}
      </header>

      {!configured ? (
        <p className="env-banner" role="status">
          未检测到 <code>VITE_SUPABASE_*</code>。复制 <code>web/.env.example</code> →{' '}
          <code>web/.env</code> 后重启 <code>npm run dev</code>。
        </p>
      ) : null}

      <Outlet />

      <p className="proto-note">Bridge · 营销站与产品工作台同域分离 · 原型见 prototype/</p>
    </div>
  )
}
