const DEDUP_TTL_MS = 5 * 60 * 1000
const MAX_DEDUP_CACHE_SIZE = 1000

export type DedupCache = Map<string, number>

/** TTL 超過エントリを Map から削除する */
export function pruneExpiredEntries(cache: DedupCache, now: number): void {
  for (const [key, lastReportedAt] of cache) {
    if (now - lastReportedAt >= DEDUP_TTL_MS) {
      cache.delete(key)
    }
  }
}

function evictOldestEntries(cache: DedupCache, maxSize: number): void {
  while (cache.size > maxSize) {
    let oldestKey: string | undefined
    let oldestTime = Number.POSITIVE_INFINITY
    for (const [key, lastReportedAt] of cache) {
      if (lastReportedAt < oldestTime) {
        oldestTime = lastReportedAt
        oldestKey = key
      }
    }
    if (oldestKey == null) {
      break
    }
    cache.delete(oldestKey)
  }
}

/**
 * fingerprint が直近 TTL 内に報告済みか判定する。
 * 報告すべき場合は cache を更新して true、重複の場合は false を返す。
 */
export function shouldReportClientError(fingerprint: string, now: number, cache: DedupCache): boolean {
  pruneExpiredEntries(cache, now)

  const lastReportedAt = cache.get(fingerprint)
  if (lastReportedAt != null && now - lastReportedAt < DEDUP_TTL_MS) {
    return false
  }
  cache.set(fingerprint, now)
  evictOldestEntries(cache, MAX_DEDUP_CACHE_SIZE)
  return true
}

export const CLIENT_ERROR_DEDUP_TTL_MS = DEDUP_TTL_MS
export const CLIENT_ERROR_DEDUP_MAX_CACHE_SIZE = MAX_DEDUP_CACHE_SIZE
