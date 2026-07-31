import { parseYearMonth } from '@shokujii/common/utils/isEnterpriseMemberBillableInYearMonth.js'
import type { EnterpriseMember } from '@shokujii/common/schemas/Enterprise.js'

export type EnterpriseMemberMonthlyUsageHistoryRow = {
  yearMonth: string
  used: number
  userPaid: number
  orderMenuCount: number
}

export type EnterpriseMemberMonthlyUsageView = {
  currentMonth: string
  used: number
  userPaid: number
  limit: number
  remaining: number
  orderMenuCount: number
  history: EnterpriseMemberMonthlyUsageHistoryRow[]
}

const compareYearMonthDesc = (a: string, b: string): number => {
  const pa = parseYearMonth(a)
  const pb = parseYearMonth(b)
  if (pa.year !== pb.year) {
    return pb.year - pa.year
  }
  return pb.month - pa.month
}

/** 例: "2026-07" → "2026年7月" */
export function formatYearMonthLabel(yearMonth: string): string {
  const { year, month } = parseYearMonth(yearMonth)
  return `${year}年${month}月`
}

export function buildMonthlyUsageHistory(
  monthlyUsage: Record<string, number>,
  monthlyOrderCount: Record<string, number>,
  monthlyUserPaid: Record<string, number>,
  maxMonths = 12,
): EnterpriseMemberMonthlyUsageHistoryRow[] {
  const keys = new Set([
    ...Object.keys(monthlyUsage),
    ...Object.keys(monthlyOrderCount),
    ...Object.keys(monthlyUserPaid),
  ])
  return Array.from(keys)
    .sort(compareYearMonthDesc)
    .slice(0, maxMonths)
    .map((yearMonth) => ({
      yearMonth,
      used: monthlyUsage[yearMonth] ?? 0,
      userPaid: monthlyUserPaid[yearMonth] ?? 0,
      orderMenuCount: monthlyOrderCount[yearMonth] ?? 0,
    }))
}

export function toEnterpriseMemberMonthlyUsageView(
  member: EnterpriseMember,
  limit: number,
  currentMonth: string,
): EnterpriseMemberMonthlyUsageView {
  const used = member.monthly_usage[currentMonth] ?? 0
  const userPaid = member.monthly_user_paid[currentMonth] ?? 0
  const orderMenuCount = member.monthly_order_count[currentMonth] ?? 0
  return {
    currentMonth,
    used,
    userPaid,
    limit,
    remaining: Math.max(0, limit - used),
    orderMenuCount,
    history: buildMonthlyUsageHistory(member.monthly_usage, member.monthly_order_count, member.monthly_user_paid),
  }
}
