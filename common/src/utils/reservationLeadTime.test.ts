import { describe, expect, it } from 'vitest'
import { EVENT_RESERVATION_LEAD_TIME_DAYS } from '../constants/eventReservation.js'
import { DEFAULT_TIME_ZONE } from './datetime.js'
import { getReservationLeadTimeMinDateString, getReservationLeadTimeMinMillis } from './reservationLeadTime.js'
import { DateTime } from 'luxon'

describe('getReservationLeadTimeMinMillis', () => {
  it('JST 当日 0:00 + EVENT_RESERVATION_LEAD_TIME_DAYS と一致する', () => {
    const nowMillis = DateTime.fromObject(
      { year: 2026, month: 5, day: 10, hour: 15, minute: 30 },
      { zone: DEFAULT_TIME_ZONE },
    ).toMillis()

    const expected = DateTime.fromMillis(nowMillis, { zone: DEFAULT_TIME_ZONE })
      .startOf('day')
      .plus({ days: EVENT_RESERVATION_LEAD_TIME_DAYS })
      .toMillis()

    expect(getReservationLeadTimeMinMillis(nowMillis)).toBe(expected)
  })
})

describe('getReservationLeadTimeMinDateString', () => {
  it('JST 当日 0:00 + EVENT_RESERVATION_LEAD_TIME_DAYS を yyyy-MM-dd で返す', () => {
    const nowMillis = DateTime.fromObject(
      { year: 2026, month: 5, day: 10, hour: 15, minute: 30 },
      { zone: DEFAULT_TIME_ZONE },
    ).toMillis()

    const expected = DateTime.fromMillis(nowMillis, { zone: DEFAULT_TIME_ZONE })
      .startOf('day')
      .plus({ days: EVENT_RESERVATION_LEAD_TIME_DAYS })
      .toFormat('yyyy-MM-dd')

    expect(getReservationLeadTimeMinDateString(nowMillis)).toBe(expected)
  })

  it('JST 深夜直前（23:59）と直後（翌 00:00）で日付がまたぐ', () => {
    const beforeMidnight = DateTime.fromObject(
      { year: 2026, month: 5, day: 10, hour: 23, minute: 59 },
      { zone: DEFAULT_TIME_ZONE },
    ).toMillis()
    const afterMidnight = DateTime.fromObject(
      { year: 2026, month: 5, day: 11, hour: 0, minute: 0 },
      { zone: DEFAULT_TIME_ZONE },
    ).toMillis()

    expect(getReservationLeadTimeMinDateString(beforeMidnight)).not.toBe(
      getReservationLeadTimeMinDateString(afterMidnight),
    )
  })
})
