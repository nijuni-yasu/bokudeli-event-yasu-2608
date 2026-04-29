import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import { DEFAULT_TIME_ZONE } from './datetime.js'
import { updateEventDeadlineFromShop } from './eventShopDeadline.js'

function startJst(y: number, m: number, d: number, h: number, min: number): number {
  return DateTime.fromObject(
    { year: y, month: m, day: d, hour: h, minute: min },
    { zone: DEFAULT_TIME_ZONE },
  ).toMillis()
}

describe('updateEventDeadlineFromShop', () => {
  it('days_before が 0 のとき開始から time ミリ秒だけ引いた締切になる', () => {
    const start = startJst(2026, 6, 1, 18, 0)
    const ev = { event_start_datetime: start, event_deadline_datetime: 0 }
    const oneHourMs = 60 * 60 * 1000
    updateEventDeadlineFromShop(ev, {
      shop_deadline_datetime: { days_before: 0, time: oneHourMs },
    })
    expect(ev.event_deadline_datetime).toBe(start - oneHourMs)
  })

  it('days_before が正のとき前日に締切時刻の時分が入る', () => {
    const start = startJst(2026, 6, 3, 18, 0)
    const ev = { event_start_datetime: start, event_deadline_datetime: 0 }
    const deadlineTimeMillis = DateTime.fromObject(
      { year: 2020, month: 1, day: 1, hour: 14, minute: 30 },
      { zone: DEFAULT_TIME_ZONE },
    ).toMillis()
    updateEventDeadlineFromShop(ev, {
      shop_deadline_datetime: { days_before: 1, time: deadlineTimeMillis },
    })
    const expected = DateTime.fromMillis(start, { zone: DEFAULT_TIME_ZONE })
      .minus({ days: 1 })
      .set({ hour: 14, minute: 30, second: 0, millisecond: 0 })
      .toMillis()
    expect(ev.event_deadline_datetime).toBe(expected)
  })

  it('event_start_datetime が不正なときは締切を書き換えない', () => {
    const ev = { event_start_datetime: Number.NaN, event_deadline_datetime: 999 }
    updateEventDeadlineFromShop(ev, {
      shop_deadline_datetime: { days_before: 0, time: 1000 },
    })
    expect(ev.event_deadline_datetime).toBe(999)
  })

  it('days_before 正で deadlineTime が不正なときは締切を書き換えない', () => {
    const start = startJst(2026, 6, 3, 18, 0)
    const ev = { event_start_datetime: start, event_deadline_datetime: 555 }
    updateEventDeadlineFromShop(ev, {
      shop_deadline_datetime: { days_before: 1, time: Number.NaN },
    })
    expect(ev.event_deadline_datetime).toBe(555)
  })
})
