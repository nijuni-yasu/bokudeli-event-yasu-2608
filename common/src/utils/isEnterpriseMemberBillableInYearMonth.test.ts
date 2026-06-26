import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import {
  computeBillingTrialEndsAtMillis,
  getYearMonthRangeMillis,
  isEnterpriseMemberBillableInYearMonth,
} from './isEnterpriseMemberBillableInYearMonth.js'

const ZONE = 'Asia/Tokyo'

function jst(year: number, month: number, day: number, hour = 12): number {
  return DateTime.fromObject({ year, month, day, hour }, { zone: ZONE }).toMillis()
}

describe('getYearMonthRangeMillis', () => {
  it('2026-06 の JST 範囲を返す', () => {
    const { monthStart, monthEnd } = getYearMonthRangeMillis('2026-06', ZONE)
    expect(monthStart).toBe(jst(2026, 6, 1, 0))
    expect(monthEnd).toBe(
      DateTime.fromObject({ year: 2026, month: 6, day: 30 }, { zone: ZONE }).endOf('day').toMillis(),
    )
  })
})

describe('isEnterpriseMemberBillableInYearMonth', () => {
  const YM = '2026-06'

  it('1月からずっと active（toggle なし）→ 対象', () => {
    expect(
      isEnterpriseMemberBillableInYearMonth(
        {
          is_active: true,
          last_activated_at: jst(2026, 1, 1),
          last_deactivated_at: null,
        },
        YM,
        ZONE,
      ),
    ).toBe(true)
  })

  it('6/20 退職停止 → 対象', () => {
    expect(
      isEnterpriseMemberBillableInYearMonth(
        {
          is_active: false,
          last_activated_at: jst(2026, 1, 1),
          last_deactivated_at: jst(2026, 6, 20),
        },
        YM,
        ZONE,
      ),
    ).toBe(true)
  })

  it('5月まで inactive のまま → 対象外', () => {
    expect(
      isEnterpriseMemberBillableInYearMonth(
        {
          is_active: false,
          last_activated_at: jst(2026, 1, 1),
          last_deactivated_at: jst(2026, 5, 31),
        },
        YM,
        ZONE,
      ),
    ).toBe(false)
  })

  it('6/1〜6/10 のみ active → 対象', () => {
    expect(
      isEnterpriseMemberBillableInYearMonth(
        {
          is_active: false,
          last_activated_at: jst(2026, 6, 1),
          last_deactivated_at: jst(2026, 6, 10),
        },
        YM,
        ZONE,
      ),
    ).toBe(true)
  })

  it('6月ずっと active、7/1 停止 → 対象', () => {
    expect(
      isEnterpriseMemberBillableInYearMonth(
        {
          is_active: false,
          last_activated_at: jst(2026, 1, 1),
          last_deactivated_at: jst(2026, 7, 1),
        },
        YM,
        ZONE,
      ),
    ).toBe(true)
  })

  it('6/30 停止 → 7/1 復活（deact 保持）→ 6月は対象', () => {
    expect(
      isEnterpriseMemberBillableInYearMonth(
        {
          is_active: true,
          last_activated_at: jst(2026, 7, 1),
          last_deactivated_at: jst(2026, 6, 30),
        },
        YM,
        ZONE,
      ),
    ).toBe(true)
  })

  it('6月停止 → 7/15 復活、8月 toggle なしで active 継続 → 8月は対象（4条件目）', () => {
    expect(
      isEnterpriseMemberBillableInYearMonth(
        {
          is_active: true,
          last_activated_at: jst(2026, 7, 15),
          last_deactivated_at: jst(2026, 6, 30),
        },
        '2026-08',
        ZONE,
      ),
    ).toBe(true)
  })

  it('5月まで inactive のまま（6月に toggle なし）→ 6月は非対象', () => {
    expect(
      isEnterpriseMemberBillableInYearMonth(
        {
          is_active: false,
          last_activated_at: jst(2026, 1, 1),
          last_deactivated_at: jst(2026, 5, 31),
        },
        YM,
        ZONE,
      ),
    ).toBe(false)
  })
})

describe('computeBillingTrialEndsAtMillis', () => {
  it('2026-04-15 作成 → 2026-06-30 23:59:59.999 JST', () => {
    const created = jst(2026, 4, 15)
    const ends = computeBillingTrialEndsAtMillis(created, ZONE)
    expect(ends).toBe(DateTime.fromObject({ year: 2026, month: 6, day: 30 }, { zone: ZONE }).endOf('day').toMillis())
  })
})
