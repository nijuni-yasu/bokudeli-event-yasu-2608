import { describe, expect, it } from 'vitest'
import {
  AuditLogQueryError,
  decodeAuditLogCursor,
  encodeAuditLogCursor,
  parseAuditLogDateRange,
} from './auditLogCursor.js'

describe('auditLogCursor', () => {
  it('encode / decode が往復する', () => {
    const cursor = { timestamp: 1_700_000_000_000, log_id: 'log-abc' }
    const encoded = encodeAuditLogCursor(cursor)
    expect(decodeAuditLogCursor(encoded)).toEqual(cursor)
  })

  it('不正な cursor は undefined', () => {
    expect(decodeAuditLogCursor('not-valid')).toBeUndefined()
  })

  it('Buffer 実装時代の既知 cursor 文字列を decode できる', () => {
    const encoded = 'eyJ0aW1lc3RhbXAiOjE3MDAwMDAwMDAwMDAsImxvZ19pZCI6ImxvZy1hYmMifQ'
    expect(decodeAuditLogCursor(encoded)).toEqual({ timestamp: 1_700_000_000_000, log_id: 'log-abc' })
  })
})

describe('parseAuditLogDateRange', () => {
  it('JST の日付範囲を millis に変換', () => {
    const { startMillis, endMillis } = parseAuditLogDateRange('2026-06-01', '2026-06-30')
    expect(startMillis).toBeDefined()
    expect(endMillis).toBeDefined()
    expect(startMillis!).toBeLessThan(endMillis!)
  })

  it('start > end はエラー', () => {
    expect(() => parseAuditLogDateRange('2026-06-30', '2026-06-01')).toThrow(AuditLogQueryError)
  })

  it('不正な日付形式はエラー', () => {
    expect(() => parseAuditLogDateRange('2026/06/01', undefined)).toThrow(AuditLogQueryError)
  })
})
