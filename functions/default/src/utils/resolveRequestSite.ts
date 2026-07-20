import { https } from 'firebase-functions/v2'
import { isAllowedRequestHostname, parseRequestHostname } from './allowedPublicHost.js'
import { getEventHost } from './urls.js'

const normalizeHeaderValue = (value: string | undefined): string | undefined => {
  if (value == null || value === '') {
    return undefined
  }
  const first = value.split(',')[0]?.trim()
  return first === '' ? undefined : first
}

const PUBLIC_SITE_PROTOCOL = 'https'

const resolveRequestHostname = (req: https.Request): string | undefined => {
  const forwardedHost = req.headers['x-forwarded-host']
  const rawHost =
    typeof forwardedHost === 'string'
      ? normalizeHeaderValue(forwardedHost)
      : Array.isArray(forwardedHost)
        ? normalizeHeaderValue(forwardedHost[0])
        : normalizeHeaderValue(req.get('host') ?? undefined)
  if (rawHost == null) {
    return undefined
  }
  const hostname = parseRequestHostname(rawHost)
  if (hostname == null) {
    return undefined
  }
  if (!isAllowedRequestHostname(hostname, getEventHost())) {
    return undefined
  }
  return hostname
}

/**
 * Hosting リクエストから公開 site URL（protocol + host）を解決する。
 * allowlist 外の host（SSRF 踏み台防止）は undefined を返す。
 */
export const resolveRequestSite = (req: https.Request): string | undefined => {
  const hostname = resolveRequestHostname(req)
  if (hostname == null) {
    return undefined
  }
  return `${PUBLIC_SITE_PROTOCOL}://${hostname}`
}
