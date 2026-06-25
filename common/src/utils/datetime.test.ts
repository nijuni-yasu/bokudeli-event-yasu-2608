import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import {
  DEFAULT_TIME_ZONE,
  formatChatCalendarDate,
  formatChatListTimestamp,
  formatYearMonth,
  isChatSameCalendarDay,
  isChatToday,
  isChatYesterday,
} from './datetime.js'

const jst = (spec: { year: number; month: number; day: number; hour?: number; minute?: number }): number =>
  DateTime.fromObject(
    {
      year: spec.year,
      month: spec.month,
      day: spec.day,
      hour: spec.hour ?? 0,
      minute: spec.minute ?? 0,
    },
    { zone: DEFAULT_TIME_ZONE },
  ).toMillis()

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

describe('chat date display', () => {
  const nowMillis = jst({ year: 2026, month: 6, day: 25, hour: 12 })

  describe('isChatToday / isChatYesterday', () => {
    it('今日・昨日を JST 暦日で判定する', () => {
      expect(isChatToday(jst({ year: 2026, month: 6, day: 25, hour: 0, minute: 3 }), nowMillis)).toBe(true)
      expect(isChatYesterday(jst({ year: 2026, month: 6, day: 24, hour: 23, minute: 59 }), nowMillis)).toBe(true)
      expect(isChatToday(jst({ year: 2026, month: 6, day: 24 }), nowMillis)).toBe(false)
      expect(isChatYesterday(jst({ year: 2026, month: 6, day: 23 }), nowMillis)).toBe(false)
    })
  })

  describe('isChatSameCalendarDay', () => {
    it('同日は true、日付跨ぎは false', () => {
      const late = jst({ year: 2026, month: 6, day: 24, hour: 23, minute: 59 })
      const early = jst({ year: 2026, month: 6, day: 25, hour: 0, minute: 1 })
      expect(isChatSameCalendarDay(late, late)).toBe(true)
      expect(isChatSameCalendarDay(late, early)).toBe(false)
    })
  })

  describe('formatChatCalendarDate', () => {
    it('当年は MM/dd、当年以外は yyyy/MM/dd', () => {
      expect(formatChatCalendarDate(jst({ year: 2026, month: 6, day: 22 }), nowMillis)).toBe('06/22')
      expect(formatChatCalendarDate(jst({ year: 2025, month: 12, day: 31 }), nowMillis)).toBe('2025/12/31')
      expect(formatChatCalendarDate(jst({ year: 2024, month: 1, day: 1 }), nowMillis)).toBe('2024/01/01')
    })
  })

  describe('formatChatListTimestamp', () => {
    it('今日は H:mm、それ以外は日付ラベル', () => {
      expect(formatChatListTimestamp(jst({ year: 2026, month: 6, day: 25, hour: 14, minute: 30 }), nowMillis)).toBe(
        '14:30',
      )
      expect(formatChatListTimestamp(jst({ year: 2026, month: 6, day: 24, hour: 9 }), nowMillis)).toBe('06/24')
      expect(formatChatListTimestamp(jst({ year: 2026, month: 6, day: 22 }), nowMillis)).toBe('06/22')
      expect(formatChatListTimestamp(jst({ year: 2025, month: 12, day: 31 }), nowMillis)).toBe('2025/12/31')
      expect(formatChatListTimestamp(jst({ year: 2024, month: 6, day: 1 }), nowMillis)).toBe('2024/06/01')
    })
  })
})
