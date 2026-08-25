import { describe, expect, it } from 'vitest'
import {
  getShopReservationApprovalDeadlineMillis,
  SHOP_RESERVATION_APPROVAL_DEADLINE_DAYS,
  SHOP_RESERVATION_REMIND_DAY_OFFSETS,
} from './eventReservation.js'

describe('shop reservation approval deadline', () => {
  it('承認期限は申請から 48 時間（2 日）後', () => {
    const updatedAt = 1_700_000_000_000
    expect(getShopReservationApprovalDeadlineMillis(updatedAt)).toBe(
      updatedAt + SHOP_RESERVATION_APPROVAL_DEADLINE_DAYS * 24 * 60 * 60 * 1000,
    )
  })

  it('リマインドは期限日より前のみ', () => {
    expect(SHOP_RESERVATION_REMIND_DAY_OFFSETS.every((day) => day < SHOP_RESERVATION_APPROVAL_DEADLINE_DAYS)).toBe(
      true,
    )
  })
})
