export const DEFAULT_DOCUMENT_TITLE = '食事でつながる「shokujii」'
export const SITE_NAME_SUFFIX = 'shokujii'

export const formatDocumentTitle = (pageName: string): string => `${pageName} | ${SITE_NAME_SUFFIX}`

const EVENT_PATH_PATTERN = /^\/c\/[^/]+\/e\/([^/]+)/
const COMMUNITY_PATH_PATTERN = /^\/c\/([^/]+)$/

export const parseEventIdFromPath = (path: string): string | null => {
  const match = path.match(EVENT_PATH_PATTERN)
  return match?.[1] ?? null
}

export const parseCommunityAccountFromPath = (path: string): string | null => {
  const match = path.match(COMMUNITY_PATH_PATTERN)
  return match?.[1] ?? null
}

export const parseErrorCodeFromRoute = (path: string, errorParam: unknown): string | null => {
  if (path === '/404' || path === '/520') {
    return path.slice(1)
  }
  if (errorParam == null || errorParam === '') {
    return null
  }
  const segments = Array.isArray(errorParam) ? errorParam : [errorParam]
  if (segments.length === 0) {
    return null
  }
  const last = segments[segments.length - 1]
  if (typeof last === 'string' && /^\d{3}$/.test(last)) {
    return last
  }
  return '404'
}
