import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import { formatYearMonth } from './datetime.js'

describe('formatYearMonth', () => {
  it('JST で YYYY-MM を返す', () => {
    const millis = DateTime.fromObject({ year: 2026, month: 7, day: 3, hour: 12 }, { zone: 'Asia/Tokyo' }).toMillis()
    expect(formatYearMonth(millis)).toBe('2026-07')
  })

  it('月をまたぐ境界でもイベント開催月キーが正しい', () => {
    const millis = DateTime.fromObject({ year: 2026, month: 6, day: 30, hour: 23 }, { zone: 'Asia/Tokyo' }).toMillis()
    expect(formatYearMonth(millis)).toBe('2026-06')
  })
})
