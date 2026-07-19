import { https } from 'firebase-functions/v2'

const normalizeHeaderValue = (value: string | undefined): string | undefined => {
  if (value == null || value === '') {
    return undefined
  }
  const first = value.split(',')[0]?.trim()
  return first === '' ? undefined : first
}

const resolveProtocol = (req: https.Request): string => {
  const forwardedProto = req.headers['x-forwarded-proto']
  const raw =
    typeof forwardedProto === 'string'
      ? normalizeHeaderValue(forwardedProto)
      : Array.isArray(forwardedProto)
        ? normalizeHeaderValue(forwardedProto[0])
        : undefined
  if (raw === 'http' || raw === 'https') {
    return raw
  }
  return req.protocol
}

/** Hosting リクエストから公開 site URL（protocol + host）を解決する。 */
export const resolveRequestSite = (req: https.Request): string | undefined => {
  const forwardedHost = req.headers['x-forwarded-host']
  const host =
    typeof forwardedHost === 'string'
      ? normalizeHeaderValue(forwardedHost)
      : Array.isArray(forwardedHost)
        ? normalizeHeaderValue(forwardedHost[0])
        : normalizeHeaderValue(req.get('host') ?? undefined)
  if (host == null) {
    return undefined
  }
  return `${resolveProtocol(req)}://${host}`
}
