const ALLOWED_EXACT_HOSTS = new Set(['shokujii.jp', 'www.shokujii.jp'])

const ALLOWED_HOST_SUFFIXES = ['.web.app', '.firebaseapp.com'] as const

const BLOCKED_EXACT_HOSTS = new Set(['localhost', 'metadata', 'metadata.google.internal'])

/** x-forwarded-host / Host ヘッダ値から hostname を抽出する（port 除去・小文字化）。 */
export const parseRequestHostname = (raw: string): string | null => {
  const trimmed = raw.trim()
  if (trimmed === '') {
    return null
  }
  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `http://${trimmed}`)
    const hostname = url.hostname.toLowerCase()
    return hostname === '' ? null : hostname
  } catch {
    return null
  }
}

const isIpv4Literal = (hostname: string): boolean => /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)

/** SSRF 対策: IP リテラル・localhost 等を拒否する。 */
export const isBlockedPublicHostname = (hostname: string): boolean => {
  const host = hostname.toLowerCase()
  if (BLOCKED_EXACT_HOSTS.has(host)) {
    return true
  }
  if (host.endsWith('.localhost') || host.endsWith('.internal')) {
    return true
  }
  if (isIpv4Literal(host)) {
    return true
  }
  if (host.includes(':')) {
    return true
  }
  return false
}

/** 公開 user Hosting 向け host か（EVENT_HOST + 既知ドメイン suffix）。 */
export const isAllowedPublicHostname = (hostname: string, configuredEventHost: string): boolean => {
  const host = hostname.toLowerCase()
  const configured = configuredEventHost.trim().toLowerCase()
  if (configured !== '' && host === configured) {
    return true
  }
  if (ALLOWED_EXACT_HOSTS.has(host)) {
    return true
  }
  return ALLOWED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
}

export const isAllowedRequestHostname = (hostname: string, configuredEventHost: string): boolean => {
  if (isBlockedPublicHostname(hostname)) {
    return false
  }
  return isAllowedPublicHostname(hostname, configuredEventHost)
}
