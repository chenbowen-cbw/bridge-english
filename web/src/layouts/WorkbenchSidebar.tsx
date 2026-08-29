import type { Ref } from 'react'
import { Link, NavLink, useLocation, useSearchParams } from 'react-router-dom'
import { AccountMenu } from '../components/AccountMenu'
import { useAuth } from '../features/auth'
import { planTierLabel } from '../lib/planTier'
import type { LocalFootprint, PlanTier } from '../lib/supabase'

const NAV = [
  { to: '/app', end: true, label: '今日' },
  { to: '/app/plan', end: false, label: '计划' },
  { to: '/app/footprints', end: false, label: '足迹' },
  { to: '/app/review', end: false, label: '复盘' },
] as const

const SESSION_LIMIT = 12

function formatSessionDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

type Props = {
  open: boolean
  drawerHidden: boolean
  sidebarRef?: Ref<HTMLElement>
  tier: PlanTier
  sessions: LocalFootprint[]
  onNavigate: () => void
}

export function WorkbenchSidebar({
  open,
  drawerHidden,
  sidebarRef,
  tier,
  sessions,
  onNavigate,
}: Props) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [params] = useSearchParams()
  const focusId = params.get('id')
  const recent = sessions.slice(0, SESSION_LIMIT)
  const loginNext = `${location.pathname}${location.search}` || '/app'

  return (
    <aside
      ref={sidebarRef}
      className={`app-sidebar${open ? ' open' : ''}`}
      id="app-sidebar"
      aria-label="工作台侧栏"
      inert={drawerHidden || undefined}
      aria-hidden={drawerHidden || undefined}
    >
      <Link className="wordmark app-sidebar-brand" to="/app" onClick={onNavigate}>
        bridge.
        <span>WORKBENCH</span>
      </Link>

      <nav className="app-sidebar-nav" aria-label="功能">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'on' : undefined)}
            onClick={onNavigate}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="app-sidebar-sessions">
        <p className="app-sidebar-label">最近练习</p>
        {recent.length ? (
          <ul>
            {recent.map((fp) => (
              <li key={fp.id}>
                <Link
                  to={`/app/footprints?id=${encodeURIComponent(fp.id)}`}
                  className={focusId === fp.id ? 'on' : undefined}
                  onClick={onNavigate}
                >
                  <span className="app-session-title">{fp.title || '未命名任务'}</span>
                  <span className="app-session-date">{formatSessionDate(fp.date)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="app-sidebar-empty">完成一张任务后会出现在这里</p>
        )}
      </div>

      <div className="app-sidebar-foot">
        <p className="app-sidebar-tier" title="订阅档位只读，支付未接">
          当前：{planTierLabel(tier)}
        </p>
        {user ? (
          <AccountMenu
            className="app-sidebar-account"
            email={user.email}
            showHome
            placement="up"
            onSignOut={signOut}
          />
        ) : (
          <div className="app-sidebar-anon">
            <Link
              className="nav-text"
              to={'/login?next=' + encodeURIComponent(loginNext)}
              onClick={onNavigate}
            >
              登录
            </Link>
            <Link className="nav-text" to="/" onClick={onNavigate}>
              回到首页
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
