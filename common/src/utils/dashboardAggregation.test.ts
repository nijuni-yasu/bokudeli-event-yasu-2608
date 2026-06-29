import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import {
  aggregateMemberRows,
  aggregateMonthlyRows,
  buildEventMonthMap,
  countMonthsInRange,
  countSessionsByMonth,
  DashboardPeriodError,
  enumerateYearMonths,
  mergeMonthlyRowsWithSnapshots,
  validateDashboardPeriod,
} from './dashboardAggregation.js'

const ZONE = 'Asia/Tokyo'

function jst(year: number, month: number, day: number): number {
  return DateTime.fromObject({ year, month, day, hour: 12 }, { zone: ZONE }).toMillis()
}

const eventMonthMap = buildEventMonthMap([
  { event_id: 'e-june', event_start_datetime: jst(2026, 6, 15) },
  { event_id: 'e-july', event_start_datetime: jst(2026, 7, 20) },
])

const billingSettings = {
  unit_price: 500,
  billing_trial_ends_at: jst(2026, 12, 31),
}

const members = [
  {
    user_id: 'u1',
    display_name: 'Alice',
    email: 'a@example.com',
    department: 'Sales',
    is_active: true,
    last_activated_at: jst(2026, 1, 1),
    last_deactivated_at: null,
  },
  {
    user_id: 'u2',
    display_name: 'Bob',
    email: 'b@example.com',
    department: '',
    is_active: true,
    last_activated_at: jst(2026, 1, 1),
    last_deactivated_at: null,
  },
]

describe('validateDashboardPeriod', () => {
  it('12 ヶ月以内は OK', () => {
    expect(() => validateDashboardPeriod('2025-07', '2026-06')).not.toThrow()
    expect(countMonthsInRange('2025-07', '2026-06')).toBe(12)
  })

  it('13 ヶ月超はエラー', () => {
    expect(() => validateDashboardPeriod('2025-01', '2026-01')).toThrow(DashboardPeriodError)
  })

  it('start > end はエラー', () => {
    expect(() => validateDashboardPeriod('2026-07', '2026-06')).toThrow(DashboardPeriodError)
  })
})

describe('enumerateYearMonths', () => {
  it('期間内の全 YM を昇順で返し 0 埋め対象になる', () => {
    expect(enumerateYearMonths('2026-05', '2026-07')).toEqual(['2026-05', '2026-06', '2026-07'])
  })
})

describe('aggregateMonthlyRows', () => {
  it('6 月決済・7 月イベントは 7 月行に帰属', () => {
    const rows = aggregateMonthlyRows({
      startYearMonth: '2026-06',
      endYearMonth: '2026-07',
      orders: [{ user_id: 'u1', event_id: 'e-july', menu_price: 1000, pay_enterprise_subsidy_amount: 500 }],
      stripes: [],
      auditSessions: [],
      eventMonthMap,
      members,
      billingSettings,
      allProvisional: true,
      currentCalendarYearMonth: '2026-12',
      zone: ZONE,
    })
    const june = rows.find((r) => r.year_month === '2026-06')
    const july = rows.find((r) => r.year_month === '2026-07')
    expect(june?.total_amount).toBe(0)
    expect(july?.total_amount).toBe(1000)
    expect(july?.enterprise_subsidy_amount).toBe(500)
    expect(july?.user_paid_amount).toBe(500)
  })

  it('user_advance（subsidy なし）は total に含む', () => {
    const rows = aggregateMonthlyRows({
      startYearMonth: '2026-06',
      endYearMonth: '2026-06',
      orders: [{ user_id: 'u1', event_id: 'e-june', menu_price: 800 }],
      stripes: [],
      auditSessions: [],
      eventMonthMap,
      members,
      billingSettings,
      allProvisional: true,
      zone: ZONE,
    })
    expect(rows[0]?.total_amount).toBe(800)
    expect(rows[0]?.enterprise_subsidy_amount).toBe(0)
    expect(rows[0]?.user_paid_amount).toBe(800)
  })

  it('session_count は stripes + audit（stripe 経路は audit を数えない）', () => {
    const sessionCounts = countSessionsByMonth({
      startYearMonth: '2026-06',
      endYearMonth: '2026-06',
      stripes: [{ user_id: 'u1', event_id: 'e-june' }],
      auditSessions: [{ user_id: 'u2', event_id: 'e-june' }],
      eventMonthMap,
    })
    expect(sessionCounts.get('2026-06')).toBe(2)

    const rows = aggregateMonthlyRows({
      startYearMonth: '2026-06',
      endYearMonth: '2026-06',
      orders: [
        { user_id: 'u1', event_id: 'e-june', menu_price: 500 },
        { user_id: 'u1', event_id: 'e-june', menu_price: 500 },
      ],
      stripes: [{ user_id: 'u1', event_id: 'e-june' }],
      auditSessions: [{ user_id: 'u2', event_id: 'e-june' }],
      eventMonthMap,
      members,
      billingSettings,
      allProvisional: true,
      zone: ZONE,
    })
    expect(rows[0]?.session_count).toBe(2)
    expect(rows[0]?.total_amount).toBe(1000)
  })

  it('期間外イベントは除外し空月は 0 埋め', () => {
    const rows = aggregateMonthlyRows({
      startYearMonth: '2026-06',
      endYearMonth: '2026-07',
      orders: [{ user_id: 'u1', event_id: 'e-june', menu_price: 300 }],
      stripes: [],
      auditSessions: [],
      eventMonthMap,
      members,
      billingSettings,
      allProvisional: true,
      zone: ZONE,
    })
    expect(rows).toHaveLength(2)
    expect(rows[0]?.total_amount).toBe(300)
    expect(rows[1]?.total_amount).toBe(0)
  })
})

describe('mergeMonthlyRowsWithSnapshots', () => {
  it('スナップショットあり月は確定値で上書き', () => {
    const liveRows = aggregateMonthlyRows({
      startYearMonth: '2026-05',
      endYearMonth: '2026-06',
      orders: [{ user_id: 'u1', event_id: 'e-june', menu_price: 1000, pay_enterprise_subsidy_amount: 500 }],
      stripes: [],
      auditSessions: [],
      eventMonthMap,
      members,
      billingSettings,
      currentCalendarYearMonth: '2026-12',
      zone: ZONE,
    })
    const merged = mergeMonthlyRowsWithSnapshots(
      liveRows,
      [
        {
          year_month: '2026-05',
          active_account_count: 10,
          platform_fee_amount: 5000,
          meal_billing_amount: 80000,
          total_billing_amount: 85000,
          billing_status: 'final',
        },
      ],
      '2026-12',
    )
    const may = merged.find((r) => r.year_month === '2026-05')
    const june = merged.find((r) => r.year_month === '2026-06')
    expect(may).toMatchObject({
      active_account_count: 10,
      platform_fee_amount: 5000,
      enterprise_billing_amount: 80000,
      total_billing_amount: 85000,
      billing_status: 'final',
    })
    expect(june?.billing_status).toBe('provisional')
  })
})

describe('aggregateMemberRows', () => {
  it('期間内に ordered 1 件以上のメンバーのみ', () => {
    const rows = aggregateMemberRows({
      startYearMonth: '2026-06',
      endYearMonth: '2026-07',
      orders: [
        { user_id: 'u1', event_id: 'e-june', menu_price: 500, pay_enterprise_subsidy_amount: 200 },
        { user_id: 'u2', event_id: 'e-july', menu_price: 1000 },
      ],
      stripes: [{ user_id: 'u1', event_id: 'e-june' }],
      auditSessions: [{ user_id: 'u2', event_id: 'e-july' }],
      eventMonthMap,
      members,
    })
    expect(rows).toHaveLength(2)
    const alice = rows.find((r) => r.user_id === 'u1')
    expect(alice?.session_count).toBe(1)
    expect(alice?.enterprise_subsidy_amount).toBe(200)
    expect(alice?.display_name).toBe('Alice')
  })

  it('注文ゼロのメンバーは含めない', () => {
    const rows = aggregateMemberRows({
      startYearMonth: '2026-06',
      endYearMonth: '2026-06',
      orders: [],
      stripes: [{ user_id: 'u1', event_id: 'e-june' }],
      auditSessions: [],
      eventMonthMap,
      members,
    })
    expect(rows).toHaveLength(0)
  })
})
