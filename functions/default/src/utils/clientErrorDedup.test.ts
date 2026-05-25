import { describe, expect, it } from 'vitest'
import {
  CLIENT_ERROR_DEDUP_MAX_CACHE_SIZE,
  CLIENT_ERROR_DEDUP_TTL_MS,
  pruneExpiredEntries,
  shouldReportClientError,
} from './clientErrorDedup.js'

describe('shouldReportClientError', () => {
  it('初回は true を返し cache に記録する', () => {
    const cache = new Map<string, number>()
    expect(shouldReportClientError('fp1', 1000, cache)).toBe(true)
    expect(cache.get('fp1')).toBe(1000)
  })

  it('TTL 内の同一 fingerprint は false', () => {
    const cache = new Map<string, number>()
    expect(shouldReportClientError('fp1', 1000, cache)).toBe(true)
    expect(shouldReportClientError('fp1', 1000 + 4 * 60 * 1000, cache)).toBe(false)
  })

  it('TTL 経過後は true', () => {
    const cache = new Map<string, number>()
    expect(shouldReportClientError('fp1', 1000, cache)).toBe(true)
    expect(shouldReportClientError('fp1', 1000 + CLIENT_ERROR_DEDUP_TTL_MS, cache)).toBe(true)
  })

  it('fingerprint が異なればそれぞれ true', () => {
    const cache = new Map<string, number>()
    expect(shouldReportClientError('fp1', 1000, cache)).toBe(true)
    expect(shouldReportClientError('fp2', 1000, cache)).toBe(true)
  })
})

describe('pruneExpiredEntries', () => {
  it('TTL 超過エントリを削除する', () => {
    const cache = new Map<string, number>()
    cache.set('expired', 1000)
    cache.set('active', 1000 + 4 * 60 * 1000)
    pruneExpiredEntries(cache, 1000 + CLIENT_ERROR_DEDUP_TTL_MS)
    expect(cache.has('expired')).toBe(false)
    expect(cache.has('active')).toBe(true)
  })
})

describe('dedup cache size limit', () => {
  it('上限超過時に最古エントリを削除する', () => {
    const cache = new Map<string, number>()
    for (let i = 0; i < CLIENT_ERROR_DEDUP_MAX_CACHE_SIZE + 10; i++) {
      shouldReportClientError(`fp${i}`, 1000 + i, cache)
    }
    expect(cache.size).toBeLessThanOrEqual(CLIENT_ERROR_DEDUP_MAX_CACHE_SIZE)
    expect(cache.has('fp0')).toBe(false)
    expect(cache.has(`fp${CLIENT_ERROR_DEDUP_MAX_CACHE_SIZE + 9}`)).toBe(true)
  })
})
