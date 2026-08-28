/** Per-user localStorage buckets — never mix accounts. */

export const FP_ANON_KEY = 'bridge-footprints:anon'
/** Legacy unscoped key from earlier builds / prototype */
export const FP_LEGACY_KEY = 'bridge-footprints'

export function footprintsStorageKey(userId?: string | null): string {
  return userId ? `bridge-footprints:${userId}` : FP_ANON_KEY
}

export function readJsonArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const list = JSON.parse(raw) as unknown
    return Array.isArray(list) ? (list as T[]) : []
  } catch {
    return []
  }
}

export function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

/** One-time: move legacy `bridge-footprints` into anon bucket if anon empty. */
export function adoptLegacyAnonBucket() {
  try {
    const anon = localStorage.getItem(FP_ANON_KEY)
    const legacy = localStorage.getItem(FP_LEGACY_KEY)
    if ((!anon || anon === '[]') && legacy) {
      localStorage.setItem(FP_ANON_KEY, legacy)
      localStorage.removeItem(FP_LEGACY_KEY)
    }
  } catch {
    /* ignore */
  }
}
