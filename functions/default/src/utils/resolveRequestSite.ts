import { https } from 'firebase-functions/v2'

const normalizeHostHeader = (value: string | undefined): string | undefined => {
  if (value == null || value === '') {
    return undefined
  }
  const first = value.split(',')[0]?.trim()
  return first === '' ? undefined : first
}

/** Hosting リクエストから公開 site URL（protocol + host）を解決する。 */
export const resolveRequestSite = (req: https.Request): string | undefined => {
  const forwardedHost = req.headers['x-forwarded-host']
  const host =
    typeof forwardedHost === 'string'
      ? normalizeHostHeader(forwardedHost)
      : Array.isArray(forwardedHost)
        ? normalizeHostHeader(forwardedHost[0])
        : normalizeHostHeader(req.get('host') ?? undefined)
  if (host == null) {
    return undefined
  }
  return `${req.protocol}://${host}`
}
