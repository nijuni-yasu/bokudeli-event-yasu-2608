import { parseYearMonth } from '@shokujii/common/utils/isEnterpriseMemberBillableInYearMonth.js'
import type { EnterpriseDiscountType, EnterpriseMember } from '@shokujii/common/schemas/Enterprise.js'

export type EnterpriseMemberMonthlyUsageHistoryRow = {
  yearMonth: string
  used: number
  userPaid: number
  orderMenuCount: number
  limit: number | null
  remaining: number | null
}

export type EnterpriseSubsidyCompanySettingsView = {
  monthlyLimit: number
  discountType: EnterpriseDiscountType
  discountValue: number
}

export type EnterpriseMemberMonthlyUsageView = {
  currentMonth: string
  used: number
  userPaid: number
  limit: number
  remaining: number
  orderMenuCount: number
  settings: EnterpriseSubsidyCompanySettingsView
  history: EnterpriseMemberMonthlyUsageHistoryRow[]
}

/** YYYY-MM の昇順比較（a が b より前なら負） */
export function compareYearMonth(a: string, b: string): number {
  const pa = parseYearMonth(a)
  const pb = parseYearMonth(b)
  if (pa.year !== pb.year) {
    return pa.year - pb.year
  }
  return pa.month - pb.month
}

const compareYearMonthDesc = (a: string, b: string): number => -compareYearMonth(a, b)

/** 例: "2026-07" → "2026年7月" */
export function formatYearMonthLabel(yearMonth: string): string {
  const { year, month } = parseYearMonth(yearMonth)
  return `${year}年${month}月`
}

const HISTORY_MAX_MONTHS = 12

export function buildMonthlyUsageHistory(
  monthlyUsage: Record<string, number>,
  monthlyOrderCount: Record<string, number>,
  monthlyUserPaid: Record<string, number>,
  maxMonths = HISTORY_MAX_MONTHS,
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
      limit: null,
      remaining: null,
    }))
}

function ensureCurrentMonthInHistory(
  history: EnterpriseMemberMonthlyUsageHistoryRow[],
  currentMonth: string,
): EnterpriseMemberMonthlyUsageHistoryRow[] {
  if (history.some((row) => row.yearMonth === currentMonth)) {
    return history
  }
  return [
    {
      yearMonth: currentMonth,
      used: 0,
      userPaid: 0,
      orderMenuCount: 0,
      limit: null,
      remaining: null,
    },
    ...history,
  ].sort((a, b) => compareYearMonthDesc(a.yearMonth, b.yearMonth))
}

/**
 * EP-22: 最大 maxMonths 件に抑えつつ、カレンダー当月行は slice から落とさない。
 * （未来月のみ 12 件埋まっていると降順 slice で当月が脱落する edge case 対策）
 */
export function trimMonthlyUsageHistoryPreservingCurrentMonth(
  history: EnterpriseMemberMonthlyUsageHistoryRow[],
  currentMonth: string,
  maxMonths = HISTORY_MAX_MONTHS,
): EnterpriseMemberMonthlyUsageHistoryRow[] {
  const sorted = [...history].sort((a, b) => compareYearMonthDesc(a.yearMonth, b.yearMonth))
  if (sorted.length <= maxMonths) {
    return sorted
  }
  const top = sorted.slice(0, maxMonths)
  if (top.some((row) => row.yearMonth === currentMonth)) {
    return top
  }
  const currentRow = sorted.find((row) => row.yearMonth === currentMonth)
  if (currentRow == null) {
    return top
  }
  const others = sorted.filter((row) => row.yearMonth !== currentMonth).slice(0, maxMonths - 1)
  return [...others, currentRow].sort((a, b) => compareYearMonthDesc(a.yearMonth, b.yearMonth))
}

/**
 * カレンダー当月〜テーブル内の最も新しい未来月まで、上限・残りを付与する（過去月は null）。
 */
export function applyBudgetColumnsToHistory(
  history: EnterpriseMemberMonthlyUsageHistoryRow[],
  currentMonth: string,
  monthlyLimit: number,
): EnterpriseMemberMonthlyUsageHistoryRow[] {
  let maxBudgetMonth = currentMonth
  for (const row of history) {
    if (compareYearMonth(row.yearMonth, currentMonth) >= 0 && compareYearMonth(row.yearMonth, maxBudgetMonth) > 0) {
      maxBudgetMonth = row.yearMonth
    }
  }

  return history.map((row) => {
    const inBudgetRange =
      compareYearMonth(row.yearMonth, currentMonth) >= 0 && compareYearMonth(row.yearMonth, maxBudgetMonth) <= 0
    if (!inBudgetRange) {
      return { ...row, limit: null, remaining: null }
    }
    return {
      ...row,
      limit: monthlyLimit,
      remaining: Math.max(0, monthlyLimit - row.used),
    }
  })
}

export function toEnterpriseMemberMonthlyUsageView(
  member: EnterpriseMember,
  settings: EnterpriseSubsidyCompanySettingsView,
  currentMonth: string,
): EnterpriseMemberMonthlyUsageView {
  const { monthlyLimit } = settings
  const used = member.monthly_usage[currentMonth] ?? 0
  const userPaid = member.monthly_user_paid[currentMonth] ?? 0
  const orderMenuCount = member.monthly_order_count[currentMonth] ?? 0
  const rawHistory = buildMonthlyUsageHistory(
    member.monthly_usage,
    member.monthly_order_count,
    member.monthly_user_paid,
  )
  const withCurrentMonth = ensureCurrentMonthInHistory(rawHistory, currentMonth)
  const trimmedHistory = trimMonthlyUsageHistoryPreservingCurrentMonth(withCurrentMonth, currentMonth)
  const history = applyBudgetColumnsToHistory(trimmedHistory, currentMonth, monthlyLimit)
  return {
    currentMonth,
    used,
    userPaid,
    limit: monthlyLimit,
    remaining: Math.max(0, monthlyLimit - used),
    orderMenuCount,
    settings,
    history,
  }
}
