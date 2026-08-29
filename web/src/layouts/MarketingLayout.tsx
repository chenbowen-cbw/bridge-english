import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { AccountMenu } from '../components/AccountMenu'
import { BridgeButton } from '../components/BridgeButton'
import { useAuth } from '../features/auth'
import { useWorkbenchPath } from '../features/plans'

const NAV = [
  { to: '/method', label: '方法' },
  { to: '/pricing', label: '定价' },
] as const

function safeNext(raw: string | null): string | null {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw
  return null
}

export function MarketingLayout() {
  const { user, configured, signOut } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [navOpen, setNavOpen] = useState(false)
  const workbenchPath = useWorkbenchPath()

  const loginTo = `/login?next=${encodeURIComponent(safeNext(params.get('next')) ?? '/app')}`

  function goPlan() {
    setNavOpen(false)
    navigate('/login?next=' + encodeURIComponent('/app/plan'))
  }

  function goWorkbench() {
    setNavOpen(false)
    navigate(workbenchPath)
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
                <AccountMenu email={user.email} onSignOut={signOut} />
                <BridgeButton variant="nav" arrow="none" onClick={goWorkbench}>
                  进入工作台
                </BridgeButton>
              </>
            ) : (
              <>
                <Link className="nav-text" to={loginTo} onClick={() => setNavOpen(false)}>
                  登录
                </Link>
                <BridgeButton variant="nav" arrow="none" onClick={goPlan}>
                  定制计划
                </BridgeButton>
              </>
            )}
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
            {user ? (
              <>
                <button type="button" className="mobile-cta" onClick={goWorkbench}>
                  进入工作台
                </button>
                <button type="button" onClick={() => void signOut()}>
                  退出
                </button>
              </>
            ) : (
              <>
                <Link to={loginTo} onClick={() => setNavOpen(false)}>
                  登录
                </Link>
                <button type="button" className="mobile-cta" onClick={goPlan}>
                  定制计划
                </button>
              </>
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

      <Outlet />

      <p className="proto-note">Bridge · 营销站与产品工作台同域分离 · 原型见 prototype/</p>
    </div>
  )
}
