import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { maskAccountIdentity } from '../lib/accountLabel'

type Props = {
  email?: string | null
  className?: string
  /** Product shell: way back to the marketing homepage. */
  showHome?: boolean
  /** Sidebar footer opens upward so the menu stays on screen. */
  placement?: 'down' | 'up'
  onReplayGuide?: () => void
  onSignOut?: () => void | Promise<void>
}

export function AccountMenu({
  email,
  className,
  showHome = false,
  placement = 'down',
  onReplayGuide,
  onSignOut,
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const identity = maskAccountIdentity(email)

  useEffect(() => {
    if (!open) return

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    function onPointer(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div className={['account-menu', className].filter(Boolean).join(' ')} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="account-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        你的账号
      </button>
      {open ? (
        <div
          className={`account-menu-panel${placement === 'up' ? ' account-menu-panel--up' : ''}`}
          id={panelId}
          role="menu"
        >
          {identity ? <p className="account-menu-id">{identity}</p> : null}
          {onReplayGuide ? (
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false)
                onReplayGuide()
              }}
            >
              再看一遍怎么用
            </button>
          ) : null}
          {showHome ? (
            <Link role="menuitem" to="/" onClick={() => setOpen(false)}>
              回到官网首页
            </Link>
          ) : null}
          {onSignOut ? (
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false)
                void onSignOut()
              }}
            >
              退出登录
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
