import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import {
  buildBillingSnapshot,
  computePlatformFeeAmount,
  assertRecapturableYearMonth,
  BillingSnapshotPeriodError,
} from './billingSnapshot.js'

const ZONE = 'Asia/Tokyo'

function jst(year: number, month: number, day: number): number {
  return DateTime.fromObject({ year, month, day, hour: 12 }, { zone: ZONE }).toMillis()
}

const members = [
  {
    is_active: true,
    last_activated_at: jst(2026, 1, 1),
    last_deactivated_at: null,
  },
  {
    is_active: true,
    last_activated_at: jst(2026, 1, 1),
    last_deactivated_at: null,
  },
]

describe('computePlatformFeeAmount', () => {
  it('お試し期間内は platform_fee 0', () => {
    const result = computePlatformFeeAmount({
      yearMonth: '2026-06',
      members,
      unitPrice: 500,
      billingTrialEndsAt: jst(2026, 12, 31),
      enterpriseIsActive: true,
      zone: ZONE,
    })
    expect(result.platform_fee_amount).toBe(0)
    expect(result.is_trial).toBe(true)
    expect(result.active_account_count).toBe(2)
  })

  it('企業停止時は platform_fee 0', () => {
    const result = computePlatformFeeAmount({
      yearMonth: '2026-06',
      members,
      unitPrice: 500,
      billingTrialEndsAt: jst(2026, 1, 1),
      enterpriseIsActive: false,
      zone: ZONE,
    })
    expect(result.platform_fee_amount).toBe(0)
    expect(result.is_trial).toBe(false)
  })

  it('課金対象は count × unit_price', () => {
    const result = computePlatformFeeAmount({
      yearMonth: '2026-06',
      members,
      unitPrice: 500,
      billingTrialEndsAt: jst(2026, 1, 1),
      enterpriseIsActive: true,
      zone: ZONE,
    })
    expect(result.platform_fee_amount).toBe(1000)
    expect(result.active_account_count).toBe(2)
  })
})

describe('buildBillingSnapshot', () => {
  it('meal + platform = total', () => {
    const snapshot = buildBillingSnapshot({
      yearMonth: '2026-06',
      unitPrice: 500,
      billingTrialEndsAt: jst(2026, 1, 1),
      enterpriseIsActive: true,
      members,
      mealBillingAmount: 125000,
      zone: ZONE,
      snapshotAt: jst(2026, 7, 1),
    })
    expect(snapshot).toMatchObject({
      year_month: '2026-06',
      meal_billing_amount: 125000,
      platform_fee_amount: 1000,
      total_billing_amount: 126000,
      billing_status: 'final',
    })
  })
})

describe('assertRecapturableYearMonth', () => {
  it('当月は拒否', () => {
    expect(() => assertRecapturableYearMonth('2026-06', '2026-06')).toThrow(BillingSnapshotPeriodError)
  })

  it('未来月は拒否', () => {
    expect(() => assertRecapturableYearMonth('2026-07', '2026-06')).toThrow(BillingSnapshotPeriodError)
  })

  it('過去月は OK', () => {
    expect(() => assertRecapturableYearMonth('2026-05', '2026-06')).not.toThrow()
  })

  it('不正形式は拒否', () => {
    expect(() => assertRecapturableYearMonth('202606', '2026-06')).toThrow(BillingSnapshotPeriodError)
  })
})
