/**
 * clientError のノイズ判定（本番 Functions の実行時正本）。
 * 同期先: .agents/skills/gcp-logging-error-analysis/scripts/parse_logs.py
 *   CLIENT_ERROR_NOISE_PATTERNS / CLIENT_ERROR_ACTIONABLE_PATTERNS
 * 変更時は error-patterns.md も更新すること。
 */

const CLIENT_ERROR_ACTIONABLE_PATTERNS = [
  'storage/unauthorized',
  'missing or insufficient permissions',
  'zoderror',
  'invalid_enum_value',
] as const

const CLIENT_ERROR_NOISE_PATTERNS = [
  'serviceworker',
  'service worker',
  'failed to fetch dynamically imported module',
  'connection failed.',
  'load failed',
  'failed to register a serviceworker',
] as const

function matchesPattern(message: string, patterns: readonly string[]): boolean {
  const lower = message.toLowerCase()
  return patterns.some((pattern) => lower.includes(pattern))
}

/** ServiceWorker 登録失敗時の単体メッセージ。部分一致 `rejected` は正当 ERROR を誤除外するため使わない。 */
function isServiceWorkerStandaloneRejected(message: string): boolean {
  return message.trim().toLowerCase() === 'rejected'
}

/** Fetch API のネットワーク瞬断（単体メッセージ）。dynamic import 失敗は別パターンで除外する。 */
function isStandaloneFailedToFetch(message: string): boolean {
  return message.trim().toLowerCase() === 'failed to fetch'
}

/**
 * Cloud Logging ERROR ではなく WARN 格下げすべき clientError か。
 * ZodError と actionable パターンは常に false（ERROR 維持）。
 */
export function isClientErrorNoise(message: string, errorType?: string): boolean {
  if (errorType === 'ZodError') {
    return false
  }

  if (matchesPattern(message, CLIENT_ERROR_ACTIONABLE_PATTERNS)) {
    return false
  }

  if (isServiceWorkerStandaloneRejected(message)) {
    return true
  }

  if (isStandaloneFailedToFetch(message)) {
    return true
  }

  if (matchesPattern(message, CLIENT_ERROR_NOISE_PATTERNS)) {
    return true
  }

  return false
}
