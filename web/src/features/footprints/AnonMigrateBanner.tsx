import { useState } from 'react'
import { BridgeButton } from '../../components/BridgeButton'
import { useAuth } from '../auth'
import { hasAnonFootprints, migrateLocalFootprintsToCloud } from './api'
import { notifyFootprintsChanged } from './events'

function skipKey(userId: string) {
  return `bridge-fp-migrate-skip:${userId}`
}

function declinedThisSession(userId: string) {
  try {
    return Boolean(sessionStorage.getItem(skipKey(userId)))
  } catch {
    return false
  }
}

/** After login: ask before merging the anon local bucket into this account. */
export function AnonMigrateBanner() {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [hidden, setHidden] = useState(false)

  const show = Boolean(
    user && !hidden && !declinedThisSession(user.id) && hasAnonFootprints(),
  )

  if (!show || !user) return null

  async function accept() {
    if (!user) return
    setBusy(true)
    await migrateLocalFootprintsToCloud(user.id)
    notifyFootprintsChanged()
    setHidden(true)
    setBusy(false)
  }

  function decline() {
    if (!user) return
    try {
      sessionStorage.setItem(skipKey(user.id), '1')
    } catch {
      /* ignore */
    }
    setHidden(true)
  }

  return (
    <div className="app-migrate-banner" role="dialog" aria-label="把登录前的草稿收到这个账号">
      <p>
        登录前写过一条草稿。要把它收到这个账号里吗？点「先留在这台电脑」的话，草稿还在未登录时的本子里，不会并进现在这个账号。
      </p>
      <div className="app-migrate-actions">
        <BridgeButton type="button" variant="primary" arrow="none" disabled={busy} onClick={() => void accept()}>
          {busy ? '正在收进来…' : '收到这个账号里'}
        </BridgeButton>
        <BridgeButton type="button" variant="ghost" arrow="none" disabled={busy} onClick={decline}>
          先留在这台电脑
        </BridgeButton>
      </div>
    </div>
  )
}
