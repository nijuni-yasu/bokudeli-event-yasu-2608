import { describe, expect, it } from 'vitest'
import { EnterpriseMember } from '@shokujii/common/schemas/Enterprise.js'
import {
  buildMonthlyUsageHistory,
  formatYearMonthLabel,
  toEnterpriseMemberMonthlyUsageView,
} from './enterpriseMemberMonthlyUsageHistory.js'

describe('formatYearMonthLabel', () => {
  it('formats YYYY-MM as Japanese label', () => {
    expect(formatYearMonthLabel('2026-07')).toBe('2026年7月')
  })
})

describe('buildMonthlyUsageHistory', () => {
  it('returns rows sorted by yearMonth descending', () => {
    const history = buildMonthlyUsageHistory(
      { '2026-04': 100, '2026-06': 200, '2025-12': 50 },
      { '2026-04': 1, '2026-05': 2 },
      { '2026-06': 80, '2026-05': 300 },
    )
    expect(history.map((row) => row.yearMonth)).toEqual(['2026-06', '2026-05', '2026-04', '2025-12'])
    expect(history[0]).toEqual({ yearMonth: '2026-06', used: 200, userPaid: 80, orderMenuCount: 0 })
    expect(history[1]).toEqual({ yearMonth: '2026-05', used: 0, userPaid: 300, orderMenuCount: 2 })
  })

  it('limits to maxMonths', () => {
    const monthlyUsage = Object.fromEntries(
      Array.from({ length: 15 }, (_, i) => {
        const year = 2024 + Math.floor(i / 12)
        const month = String((i % 12) + 1).padStart(2, '0')
        return [`${year}-${month}`, i + 1]
      }),
    )
    expect(buildMonthlyUsageHistory(monthlyUsage, {}, {}, 12)).toHaveLength(12)
  })

  it('returns empty array when all maps are empty', () => {
    expect(buildMonthlyUsageHistory({}, {}, {})).toEqual([])
  })
})

describe('toEnterpriseMemberMonthlyUsageView', () => {
  it('builds current month summary and remaining budget', () => {
    const member = new EnterpriseMember('user-1', {
      user_email: 'a@example.com',
      monthly_usage: { '2026-06': 3000, '2026-05': 1000 },
      monthly_order_count: { '2026-06': 2, '2026-05': 1 },
      monthly_user_paid: { '2026-06': 500, '2026-05': 200 },
    })
    const view = toEnterpriseMemberMonthlyUsageView(member, 7500, '2026-06')
    expect(view.used).toBe(3000)
    expect(view.userPaid).toBe(500)
    expect(view.limit).toBe(7500)
    expect(view.remaining).toBe(4500)
    expect(view.orderMenuCount).toBe(2)
    expect(view.history).toHaveLength(2)
  })

  it('treats missing monthly_user_paid as zero', () => {
    const member = new EnterpriseMember('user-1', {
      user_email: 'a@example.com',
      monthly_usage: { '2026-06': 100 },
    })
    const view = toEnterpriseMemberMonthlyUsageView(member, 3000, '2026-06')
    expect(view.userPaid).toBe(0)
  })
})
