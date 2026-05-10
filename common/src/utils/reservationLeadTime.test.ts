import { describe, expect, it } from 'vitest'
import { EVENT_RESERVATION_LEAD_TIME_DAYS } from '../constants/eventReservation.js'
import { DEFAULT_TIME_ZONE } from './datetime.js'
import { getReservationLeadTimeMinMillis } from './reservationLeadTime.js'
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
