import { describe, expect, it } from 'vitest'
import {
  getShopReservationApprovalDeadlineMillis,
  SHOP_RESERVATION_APPROVAL_DEADLINE_DAYS,
  SHOP_RESERVATION_REMIND_DAY_OFFSETS,
} from './eventReservation.js'

const FORTY_EIGHT_HOURS_MILLIS = 48 * 60 * 60 * 1000

describe('shop reservation approval deadline', () => {
  it('承認期限は申請から 48 時間（2 日）後', () => {
    expect(SHOP_RESERVATION_APPROVAL_DEADLINE_DAYS).toBe(2)

    const updatedAt = 1_700_000_000_000
    expect(getShopReservationApprovalDeadlineMillis(updatedAt)).toBe(updatedAt + FORTY_EIGHT_HOURS_MILLIS)
  })

  it('リマインドは期限日より前のみ', () => {
    expect(SHOP_RESERVATION_REMIND_DAY_OFFSETS.every((day) => day < SHOP_RESERVATION_APPROVAL_DEADLINE_DAYS)).toBe(true)
  })
})
