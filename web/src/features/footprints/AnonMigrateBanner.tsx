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
    <div className="app-migrate-banner" role="dialog" aria-label="同步本机草稿">
      <p>把本机草稿同步到这个账号？取消则留在匿名本，不会并入当前用户。</p>
      <div className="app-migrate-actions">
        <BridgeButton type="button" variant="primary" arrow="none" disabled={busy} onClick={() => void accept()}>
          {busy ? '同步中…' : '同步到这个账号'}
        </BridgeButton>
        <BridgeButton type="button" variant="ghost" arrow="none" disabled={busy} onClick={decline}>
          暂不
        </BridgeButton>
      </div>
    </div>
  )
}
