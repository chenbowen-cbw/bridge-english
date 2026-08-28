import { useState, type FormEvent } from 'react'
import { BridgeButton } from '../../components/BridgeButton'
import { useAuth } from './AuthProvider'
import './auth.css'

type Mode = 'signin' | 'signup'

type Props = {
  onClose?: () => void
  onSuccess?: () => void
}

export function AuthPanel({ onClose, onSuccess }: Props) {
  const { configured, signIn, signUp, user, signOut, loading } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    setBusy(true)
    const result =
      mode === 'signin'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, displayName.trim() || undefined)
    setBusy(false)
    if (result.error) {
      setMessage(result.error)
      return
    }
    setMessage(mode === 'signup' ? '注册成功。若开启邮箱确认，请查收邮件。' : '已登录')
    onSuccess?.()
  }

  if (loading) {
    return (
      <section className="auth-panel" aria-busy="true">
        <p className="auth-muted">正在读取会话…</p>
      </section>
    )
  }

  if (user) {
    return (
      <section className="auth-panel">
        <p className="kicker">账户</p>
        <h2>已登录</h2>
        <p className="auth-lead">{user.email}</p>
        <div className="auth-actions">
          <BridgeButton variant="ghost" arrow="none" onClick={() => void signOut()}>
            退出登录
          </BridgeButton>
          {onClose ? (
            <BridgeButton variant="primary" arrow="none" onClick={onClose}>
              回到页面
            </BridgeButton>
          ) : null}
        </div>
      </section>
    )
  }

  return (
    <section className="auth-panel" id="auth">
      <p className="kicker">账户</p>
      <h2>{mode === 'signin' ? '登录 Bridge' : '注册 Bridge'}</h2>
      <p className="auth-lead">
        邮箱 + 密码。首页与订阅可匿名浏览；计划、足迹、复盘需登录后持久化。
      </p>
      {!configured ? (
        <p className="auth-banner" role="status">
          尚未配置 <code>VITE_SUPABASE_URL</code> / <code>VITE_SUPABASE_ANON_KEY</code>
          。复制 <code>web/.env.example</code> → <code>web/.env</code> 后重启 dev。
        </p>
      ) : null}
      <div className="auth-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signin'}
          className={mode === 'signin' ? 'on' : undefined}
          onClick={() => {
            setMode('signin')
            setMessage(null)
          }}
        >
          登录
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signup'}
          className={mode === 'signup' ? 'on' : undefined}
          onClick={() => {
            setMode('signup')
            setMessage(null)
          }}
        >
          注册
        </button>
      </div>
      <form className="auth-form" onSubmit={(e) => void onSubmit(e)}>
        {mode === 'signup' ? (
          <label>
            显示名（可选）
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="nickname"
              placeholder="怎么称呼你"
            />
          </label>
        ) : null}
        <label>
          邮箱
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        <label>
          密码
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder="至少 6 位"
          />
        </label>
        {message ? (
          <p className="auth-msg" role="status">
            {message}
          </p>
        ) : null}
        <div className="auth-actions">
          <BridgeButton type="submit" variant="primary" arrow="right" disabled={busy || !configured}>
            {busy ? '请稍候…' : mode === 'signin' ? '登录' : '注册并开始'}
          </BridgeButton>
          {onClose ? (
            <BridgeButton type="button" variant="ghost" arrow="none" onClick={onClose}>
              稍后再说
            </BridgeButton>
          ) : null}
        </div>
      </form>
    </section>
  )
}
