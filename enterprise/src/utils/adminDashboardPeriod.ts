import { DateTime } from 'luxon'
import { DEFAULT_TIME_ZONE } from '@shokujii/common/utils/datetime.js'
import { parseYearMonth } from '@shokujii/common/utils/isEnterpriseMemberBillableInYearMonth.js'

/** 選択肢に含める過去方向の月数（当月を含む）。MVP は12ヶ月、将来拡張予定 */
export const DASHBOARD_YEAR_MONTH_OPTION_PAST_MONTHS = 12
export const MAX_DASHBOARD_PERIOD_MONTHS = 12

export type DashboardPeriod = {
  start_year_month: string
  end_year_month: string
}

export type DashboardPeriodValidationError = 'invalid_order' | 'invalid_max'

export function countInclusiveMonths(startYearMonth: string, endYearMonth: string): number {
  const start = parseYearMonth(startYearMonth)
  const end = parseYearMonth(endYearMonth)
  return (end.year - start.year) * 12 + (end.month - start.month) + 1
}

export function validateDashboardPeriod(period: DashboardPeriod): DashboardPeriodValidationError | undefined {
  const start = parseYearMonth(period.start_year_month)
  const end = parseYearMonth(period.end_year_month)
  if (start.year > end.year || (start.year === end.year && start.month > end.month)) {
    return 'invalid_order'
  }
  if (countInclusiveMonths(period.start_year_month, period.end_year_month) > MAX_DASHBOARD_PERIOD_MONTHS) {
    return 'invalid_max'
  }
  return undefined
}

export type YearMonthOption = {
  title: string
  value: string
}

function shiftYearMonth(yearMonth: string, monthDelta: number): string {
  const { year, month } = parseYearMonth(yearMonth)
  return DateTime.fromObject({ year, month, day: 1 }, { zone: DEFAULT_TIME_ZONE })
    .plus({ months: monthDelta })
    .toFormat('yyyy-MM')
}

/** 終了月に対して有効な開始月へ補正する */
export function clampStartYearMonth(startYearMonth: string, endYearMonth: string): string {
  if (startYearMonth > endYearMonth) {
    return endYearMonth
  }
  if (countInclusiveMonths(startYearMonth, endYearMonth) > MAX_DASHBOARD_PERIOD_MONTHS) {
    return shiftYearMonth(endYearMonth, -(MAX_DASHBOARD_PERIOD_MONTHS - 1))
  }
  return startYearMonth
}

/** 開始月に対して有効な終了月へ補正する */
export function clampEndYearMonth(startYearMonth: string, endYearMonth: string): string {
  if (endYearMonth < startYearMonth) {
    return startYearMonth
  }
  if (countInclusiveMonths(startYearMonth, endYearMonth) > MAX_DASHBOARD_PERIOD_MONTHS) {
    return shiftYearMonth(startYearMonth, MAX_DASHBOARD_PERIOD_MONTHS - 1)
  }
  return endYearMonth
}

export function filterStartYearMonthOptions(options: YearMonthOption[], endYearMonth: string): YearMonthOption[] {
  return options.filter(
    (opt) => opt.value <= endYearMonth && countInclusiveMonths(opt.value, endYearMonth) <= MAX_DASHBOARD_PERIOD_MONTHS,
  )
}

export function filterEndYearMonthOptions(options: YearMonthOption[], startYearMonth: string): YearMonthOption[] {
  return options.filter(
    (opt) =>
      opt.value >= startYearMonth && countInclusiveMonths(startYearMonth, opt.value) <= MAX_DASHBOARD_PERIOD_MONTHS,
  )
}

/** デフォルト: 先月〜来月（先月・今月・来月の3ヶ月） */
export function getDefaultDashboardPeriod(nowMillis = Date.now()): DashboardPeriod {
  const current = DateTime.fromMillis(nowMillis).setZone(DEFAULT_TIME_ZONE).startOf('month')
  return {
    start_year_month: current.minus({ months: 1 }).toFormat('yyyy-MM'),
    end_year_month: current.plus({ months: 1 }).toFormat('yyyy-MM'),
  }
}

/** 過去12ヶ月（当月含む）〜来月までを選択肢として返す（新しい月が先） */
export function buildYearMonthOptions(
  pastMonthCount = DASHBOARD_YEAR_MONTH_OPTION_PAST_MONTHS,
  nowMillis = Date.now(),
): { title: string; value: string }[] {
  const current = DateTime.fromMillis(nowMillis).setZone(DEFAULT_TIME_ZONE).startOf('month')
  const min = current.minus({ months: pastMonthCount - 1 })
  const max = current.plus({ months: 1 })

  const options: { title: string; value: string }[] = []
  let dt = min
  while (dt.toMillis() <= max.toMillis()) {
    const value = dt.toFormat('yyyy-MM')
    options.push({ title: value, value })
    dt = dt.plus({ months: 1 })
  }
  return options.reverse()
}

export function formatYearMonthLabel(yearMonth: string): string {
  const { year, month } = parseYearMonth(yearMonth)
  return `${year}年${month}月`
}

export function formatDashboardTimestamp(): string {
  return DateTime.now().setZone(DEFAULT_TIME_ZONE).toFormat('yyyyMMdd_HHmmss')
}

export function formatDashboardMembersPeriodLabel(startYearMonth: string, endYearMonth: string): string {
  return `${startYearMonth.replace('-', '')}_${endYearMonth.replace('-', '')}`
}
