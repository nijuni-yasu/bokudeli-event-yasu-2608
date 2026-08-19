import { buildCsvContent } from '@shokujii/base/composable/memberCsvExport.js'
import { downloadCsv } from '@shokujii/base/utils/downloadCsv.js'
import type { DashboardMemberRow, DashboardMonthlyRow } from '@shokujii/common/apis/dashboard.js'
import { priceString } from '@shokujii/base/schemes/converter'
import { formatDashboardMembersPeriodLabel, formatDashboardTimestamp } from '@/utils/adminDashboardPeriod'

type DashboardCsvTranslate = (key: string) => string

const MONTHLY_CSV_HEADER_KEYS = [
  'admin.dashboard.col_year_month',
  'admin.dashboard.col_session_count',
  'admin.dashboard.col_unique_users',
  'admin.dashboard.col_total_amount',
  'admin.dashboard.col_enterprise_subsidy',
  'admin.dashboard.col_user_paid',
  'admin.dashboard.col_enterprise_billing',
  'admin.dashboard.col_active_accounts',
  'admin.dashboard.col_platform_fee',
  'admin.dashboard.col_total_billing',
] as const

const MEMBER_CSV_HEADER_KEYS = [
  'admin.dashboard.col_display_name',
  'admin.dashboard.col_email',
  'admin.dashboard.col_department',
  'admin.dashboard.col_session_count',
  'admin.dashboard.col_total_amount',
  'admin.dashboard.col_enterprise_subsidy',
  'admin.dashboard.col_user_paid',
] as const

const formatAmount = (amount: number) => priceString(amount)

export function buildMonthlyDashboardCsv(rows: readonly DashboardMonthlyRow[], t: DashboardCsvTranslate): string {
  const headers = MONTHLY_CSV_HEADER_KEYS.map((key) => t(key))
  const data = rows.map((row) => [
    row.year_month,
    String(row.session_count),
    String(row.unique_users),
    formatAmount(row.total_amount),
    formatAmount(row.enterprise_subsidy_amount),
    formatAmount(row.user_paid_amount),
    formatAmount(row.enterprise_billing_amount),
    String(row.active_account_count),
    formatAmount(row.platform_fee_amount),
    formatAmount(row.total_billing_amount),
  ])
  return buildCsvContent(headers, data)
}

export function buildMemberDashboardCsv(rows: readonly DashboardMemberRow[], t: DashboardCsvTranslate): string {
  const headers = MEMBER_CSV_HEADER_KEYS.map((key) => t(key))
  const data = rows.map((row) => [
    row.display_name,
    row.email,
    row.department,
    String(row.session_count),
    formatAmount(row.total_amount),
    formatAmount(row.enterprise_subsidy_amount),
    formatAmount(row.user_paid_amount),
  ])
  return buildCsvContent(headers, data)
}

export function downloadMonthlyDashboardCsv(rows: readonly DashboardMonthlyRow[], t: DashboardCsvTranslate): void {
  downloadCsv(`dashboard_monthly_${formatDashboardTimestamp()}.csv`, buildMonthlyDashboardCsv(rows, t))
}

export function downloadMemberDashboardCsv(
  rows: readonly DashboardMemberRow[],
  startYearMonth: string,
  endYearMonth: string,
  t: DashboardCsvTranslate,
): void {
  downloadCsv(
    `dashboard_members_${formatDashboardMembersPeriodLabel(startYearMonth, endYearMonth)}_${formatDashboardTimestamp()}.csv`,
    buildMemberDashboardCsv(rows, t),
  )
}
