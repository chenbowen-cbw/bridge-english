import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { maskAccountIdentity } from '../lib/accountLabel'

type Props = {
  email?: string | null
  /** Product shell: way back to the marketing homepage. */
  showHome?: boolean
  /** Sidebar footer opens upward so the menu stays on screen. */
  placement?: 'down' | 'up'
  onSignOut?: () => void | Promise<void>
}

export function AccountMenu({ email, showHome = false, placement = 'down', onSignOut }: Props) {
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
    <div className="account-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="account-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        账户
      </button>
      {open ? (
        <div
          className={`account-menu-panel${placement === 'up' ? ' account-menu-panel--up' : ''}`}
          id={panelId}
          role="menu"
        >
          {identity ? <p className="account-menu-id">{identity}</p> : null}
          {showHome ? (
            <Link role="menuitem" to="/" onClick={() => setOpen(false)}>
              回到首页
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
              退出
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
