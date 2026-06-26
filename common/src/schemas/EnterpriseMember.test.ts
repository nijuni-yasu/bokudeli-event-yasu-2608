import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import { EnterpriseMember } from './Enterprise.js'
import { isEnterpriseMemberBillableInYearMonth } from '../utils/isEnterpriseMemberBillableInYearMonth.js'

const ZONE = 'Asia/Tokyo'

function jst(year: number, month: number, day: number, hour = 12): number {
  return DateTime.fromObject({ year, month, day, hour }, { zone: ZONE }).toMillis()
}

const firestoreTimestampLike = (millis: number) => ({
  seconds: Math.floor(millis / 1000),
  nanoseconds: (millis % 1000) * 1_000_000,
})

describe('EnterpriseMember', () => {
  it('Firestore Timestamp 風の last_activated_at を number に正規化する', () => {
    const activatedAt = jst(2026, 6, 1)
    const member = new EnterpriseMember('user-1', {
      last_activated_at: firestoreTimestampLike(activatedAt) as unknown as number,
      last_deactivated_at: null,
    })

    expect(typeof member.last_activated_at).toBe('number')
    expect(member.last_activated_at).toBe(activatedAt)
    expect(member.last_deactivated_at).toBeNull()
  })

  it('正規化された日付で billable_in 判定ができる', () => {
    const activatedAt = jst(2026, 1, 1)
    const member = new EnterpriseMember('user-1', {
      is_active: true,
      last_activated_at: firestoreTimestampLike(activatedAt) as unknown as number,
      last_deactivated_at: null,
    })

    expect(
      isEnterpriseMemberBillableInYearMonth(
        {
          is_active: member.is_active,
          last_activated_at: member.last_activated_at,
          last_deactivated_at: member.last_deactivated_at,
        },
        '2026-06',
        ZONE,
      ),
    ).toBe(true)
  })
})
