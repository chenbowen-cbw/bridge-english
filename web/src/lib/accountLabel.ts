/** Mask email / phone-as-email for the account menu. Never show the raw local part in the bar. */
export function maskAccountIdentity(email: string | null | undefined): string {
  if (!email) return ''
  const [local, domain] = email.split('@')
  if (/^\d{11}$/.test(local)) {
    return `${local.slice(0, 3)}****${local.slice(7)}`
  }
  if (domain) {
    const shown = local.length <= 2 ? local : `${local.slice(0, 2)}…`
    return `${shown}@${domain}`
  }
  return local.length <= 4 ? local : `${local.slice(0, 2)}…`
}
