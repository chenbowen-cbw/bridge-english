/** Per-user first-run flag — never mix accounts. Prefix is `bridge-onboard:`. */

export function onboardStorageKey(userId?: string | null): string {
  return userId ? `bridge-onboard:${userId}` : 'bridge-onboard:anon'
}

export function isOnboardDone(userId?: string | null): boolean {
  try {
    return localStorage.getItem(onboardStorageKey(userId)) === 'done'
  } catch {
    return false
  }
}

export function markOnboardDone(userId?: string | null): void {
  try {
    localStorage.setItem(onboardStorageKey(userId), 'done')
  } catch {
    /* ignore quota / private mode */
  }
}

export const ONBOARD_REPLAY = 'bridge-onboard-replay'

export function requestOnboardReplay(): void {
  window.dispatchEvent(new Event(ONBOARD_REPLAY))
}
