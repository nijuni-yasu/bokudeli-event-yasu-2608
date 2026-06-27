import { parseYearMonth } from '@shokujii/common/utils/isEnterpriseMemberBillableInYearMonth.js'
import type { EnterpriseMember } from '@shokujii/common/schemas/Enterprise.js'

export type EnterpriseMemberMonthlyUsageHistoryRow = {
  yearMonth: string
  used: number
  orderMenuCount: number
}

export type EnterpriseMemberMonthlyUsageView = {
  currentMonth: string
  used: number
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

export function buildMonthlyUsageHistory(
  monthlyUsage: Record<string, number>,
  monthlyOrderCount: Record<string, number>,
  maxMonths = 12,
): EnterpriseMemberMonthlyUsageHistoryRow[] {
  const keys = new Set([...Object.keys(monthlyUsage), ...Object.keys(monthlyOrderCount)])
  return Array.from(keys)
    .sort(compareYearMonthDesc)
    .slice(0, maxMonths)
    .map((yearMonth) => ({
      yearMonth,
      used: monthlyUsage[yearMonth] ?? 0,
      orderMenuCount: monthlyOrderCount[yearMonth] ?? 0,
    }))
}

export function toEnterpriseMemberMonthlyUsageView(
  member: EnterpriseMember,
  limit: number,
  currentMonth: string,
): EnterpriseMemberMonthlyUsageView {
  const used = member.monthly_usage[currentMonth] ?? 0
  const orderMenuCount = member.monthly_order_count[currentMonth] ?? 0
  return {
    currentMonth,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    orderMenuCount,
    history: buildMonthlyUsageHistory(member.monthly_usage, member.monthly_order_count),
  }
}
