import { DateTime } from 'luxon'
import { DEFAULT_TIME_ZONE, formatYearMonth } from '@shokujii/common/utils/datetime.js'
import { parseYearMonth } from '@shokujii/common/utils/isEnterpriseMemberBillableInYearMonth.js'

export const DEFAULT_DASHBOARD_PERIOD_MONTHS = 12

export type DashboardPeriod = {
  start_year_month: string
  end_year_month: string
}

export function getDefaultDashboardPeriod(months = DEFAULT_DASHBOARD_PERIOD_MONTHS): DashboardPeriod {
  const end = DateTime.now().setZone(DEFAULT_TIME_ZONE).startOf('month')
  const start = end.minus({ months: months - 1 })
  return {
    start_year_month: start.toFormat('yyyy-MM'),
    end_year_month: end.toFormat('yyyy-MM'),
  }
}

export function buildYearMonthOptions(monthCount = 36): { title: string; value: string }[] {
  const end = DateTime.now().setZone(DEFAULT_TIME_ZONE).startOf('month')
  const options: { title: string; value: string }[] = []
  for (let i = 0; i < monthCount; i += 1) {
    const dt = end.minus({ months: i })
    const value = dt.toFormat('yyyy-MM')
    options.push({ title: value, value })
  }
  return options
}

export function formatYearMonthLabel(yearMonth: string): string {
  const { year, month } = parseYearMonth(yearMonth)
  return `${year}年${month}月`
}

export function isCurrentCalendarMonth(yearMonth: string): boolean {
  return yearMonth === formatYearMonth(Date.now(), DEFAULT_TIME_ZONE)
}

export function formatDashboardTimestamp(): string {
  return DateTime.now().setZone(DEFAULT_TIME_ZONE).toFormat('yyyyMMdd_HHmmss')
}

export function formatDashboardMembersPeriodLabel(startYearMonth: string, endYearMonth: string): string {
  return `${startYearMonth.replace('-', '')}_${endYearMonth.replace('-', '')}`
}
