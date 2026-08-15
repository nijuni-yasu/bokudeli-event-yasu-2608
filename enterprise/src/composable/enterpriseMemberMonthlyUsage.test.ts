import { describe, expect, it } from 'vitest'
import { EnterpriseMember } from '@shokujii/common/schemas/Enterprise.js'
import type { EnterpriseSubsidySettingsEntryType } from '@shokujii/common/schemas/EnterpriseSubsidySettings.js'
import {
  applyBudgetColumnsToHistory,
  buildMonthlyUsageHistory,
  compareYearMonth,
  formatYearMonthLabel,
  trimMonthlyUsageHistoryPreservingCurrentMonth,
  toEnterpriseMemberMonthlyUsageView,
} from './enterpriseMemberMonthlyUsageHistory.js'

const defaultHistory: EnterpriseSubsidySettingsEntryType[] = [
  { effective_from_month: '2026-01', type: 'fixed', value: 500, monthly_limit_per_user: 7500 },
]

describe('compareYearMonth', () => {
  it('orders YYYY-MM chronologically', () => {
    expect(compareYearMonth('2026-06', '2026-07')).toBeLessThan(0)
    expect(compareYearMonth('2026-09', '2026-07')).toBeGreaterThan(0)
  })
})

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
    expect(history[0]).toEqual({
      yearMonth: '2026-06',
      used: 200,
      userPaid: 80,
      orderMenuCount: 0,
      limit: null,
      remaining: null,
    })
    expect(history[1]).toEqual({
      yearMonth: '2026-05',
      used: 0,
      userPaid: 300,
      orderMenuCount: 2,
      limit: null,
      remaining: null,
    })
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

describe('applyBudgetColumnsToHistory', () => {
  it('fills limit and remaining from current month through newest future month in table', () => {
    const history = buildMonthlyUsageHistory({ '2026-06': 500, '2026-07': 1000, '2026-09': 500 }, {}, {})
    const subsidyHistory: EnterpriseSubsidySettingsEntryType[] = [
      { effective_from_month: '2026-01', type: 'fixed', value: 500, monthly_limit_per_user: 3000 },
      { effective_from_month: '2026-07', type: 'fixed', value: 500, monthly_limit_per_user: 5000 },
    ]
    const enriched = applyBudgetColumnsToHistory(history, '2026-07', subsidyHistory)
    const byMonth = Object.fromEntries(enriched.map((row) => [row.yearMonth, row]))
    expect(byMonth['2026-06']?.limit).toBeNull()
    expect(byMonth['2026-07']).toMatchObject({ limit: 5000, remaining: 4000 })
    expect(byMonth['2026-09']).toMatchObject({ limit: 5000, remaining: 4500 })
  })
})

describe('toEnterpriseMemberMonthlyUsageView', () => {
  it('builds current month summary for cart and budget columns on history', () => {
    const member = new EnterpriseMember('user-1', {
      user_email: 'a@example.com',
      monthly_usage: { '2026-06': 3000, '2026-05': 1000, '2026-08': 500 },
      monthly_order_count: { '2026-06': 2, '2026-05': 1 },
      monthly_user_paid: { '2026-06': 500, '2026-05': 200 },
    })
    const view = toEnterpriseMemberMonthlyUsageView(member, defaultHistory, '2026-06')
    expect(view.used).toBe(3000)
    expect(view.userPaid).toBe(500)
    expect(view.limit).toBe(7500)
    expect(view.remaining).toBe(4500)
    expect(view.orderMenuCount).toBe(2)
    expect(view.settings.discountValue).toBe(500)
    expect(view.history.find((r) => r.yearMonth === '2026-05')?.limit).toBeNull()
    expect(view.history.find((r) => r.yearMonth === '2026-06')).toMatchObject({
      limit: 7500,
      remaining: 4500,
    })
    expect(view.history.find((r) => r.yearMonth === '2026-08')).toMatchObject({
      limit: 7500,
      remaining: 7000,
    })
  })

  it('injects current month row when missing from usage maps', () => {
    const member = new EnterpriseMember('user-1', {
      user_email: 'a@example.com',
      monthly_usage: { '2026-05': 1000 },
    })
    const history: EnterpriseSubsidySettingsEntryType[] = [
      { effective_from_month: '2026-01', type: 'fixed', value: 500, monthly_limit_per_user: 3000 },
    ]
    const view = toEnterpriseMemberMonthlyUsageView(member, history, '2026-06')
    const june = view.history.find((r) => r.yearMonth === '2026-06')
    expect(june).toMatchObject({ used: 0, limit: 3000, remaining: 3000 })
    expect(view.history.find((r) => r.yearMonth === '2026-05')?.limit).toBeNull()
  })

  it('keeps history at most 12 rows after injecting calendar current month', () => {
    const monthlyUsage = Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => {
        const month = String(i + 1).padStart(2, '0')
        return [`2025-${month}`, 100]
      }),
    )
    const member = new EnterpriseMember('user-1', {
      user_email: 'a@example.com',
      monthly_usage: monthlyUsage,
    })
    const view = toEnterpriseMemberMonthlyUsageView(member, defaultHistory, '2026-07')
    expect(view.history).toHaveLength(12)
    expect(view.history.some((r) => r.yearMonth === '2026-07')).toBe(true)
  })

  it('未来月 12 件のみでもカレンダー当月が slice から脱落しない', () => {
    const futureMonths = [
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
      '2027-03',
      '2027-04',
      '2027-05',
      '2027-06',
      '2027-07',
    ]
    const monthlyUsage = Object.fromEntries(futureMonths.map((ym) => [ym, 100]))
    const member = new EnterpriseMember('user-1', {
      user_email: 'a@example.com',
      monthly_usage: monthlyUsage,
    })
    const view = toEnterpriseMemberMonthlyUsageView(member, defaultHistory, '2026-07')
    expect(view.history).toHaveLength(12)
    expect(view.history.some((r) => r.yearMonth === '2026-07')).toBe(true)
  })

  it('treats missing monthly_user_paid as zero', () => {
    const member = new EnterpriseMember('user-1', {
      user_email: 'a@example.com',
      monthly_usage: { '2026-06': 100 },
    })
    const history: EnterpriseSubsidySettingsEntryType[] = [
      { effective_from_month: '2026-01', type: 'fixed', value: 500, monthly_limit_per_user: 3000 },
    ]
    const view = toEnterpriseMemberMonthlyUsageView(member, history, '2026-06')
    expect(view.userPaid).toBe(0)
  })
})

describe('trimMonthlyUsageHistoryPreservingCurrentMonth', () => {
  it('当月が top12 外でも必ず残す', () => {
    const rows = buildMonthlyUsageHistory(
      Object.fromEntries(
        Array.from({ length: 12 }, (_, i) => {
          const absoluteMonth = 8 + i
          const year = 2026 + Math.floor((absoluteMonth - 1) / 12)
          const month = ((absoluteMonth - 1) % 12) + 1
          return [`${year}-${String(month).padStart(2, '0')}`, 1]
        }),
      ),
      {},
      {},
      12,
    )
    const withCurrent = [
      {
        yearMonth: '2026-07',
        used: 0,
        userPaid: 0,
        orderMenuCount: 0,
        limit: null,
        remaining: null,
      },
      ...rows,
    ]
    const trimmed = trimMonthlyUsageHistoryPreservingCurrentMonth(withCurrent, '2026-07', 12)
    expect(trimmed).toHaveLength(12)
    expect(trimmed.some((r) => r.yearMonth === '2026-07')).toBe(true)
  })
})
