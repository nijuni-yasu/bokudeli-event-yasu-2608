import { buildCsvContent } from '@shokujii/base/composable/memberCsvExport.js'
import { downloadCsv } from '@shokujii/base/utils/downloadCsv.js'
import type { DashboardMemberRow, DashboardMonthlyRow } from '@shokujii/common/apis/dashboard.js'
import { priceString } from '@shokujii/base/schemes/converter'
import { formatDashboardMembersPeriodLabel, formatDashboardTimestamp } from '@/utils/adminDashboardPeriod'

const formatAmount = (amount: number) => priceString(amount)

const billingStatusLabel = (status: DashboardMonthlyRow['billing_status']) =>
  status === 'provisional' ? '見込み' : '確定'

export function buildMonthlyDashboardCsv(rows: readonly DashboardMonthlyRow[]): string {
  const headers = [
    '年月',
    '利用回数',
    '利用人数',
    '注文合計額（税込）',
    '企業負担額（補助）',
    '自己負担額',
    '企業請求見込額（食事）',
    '有効アカウント数',
    'プラットフォーム利用料',
    '合計請求見込額',
    '確定状態',
  ]
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
    billingStatusLabel(row.billing_status),
  ])
  return buildCsvContent(headers, data)
}

export function buildMemberDashboardCsv(rows: readonly DashboardMemberRow[]): string {
  const headers = [
    '表示名',
    'メールアドレス',
    '部署',
    '利用回数',
    '注文合計額（税込）',
    '企業負担額（補助）',
    '自己負担額',
  ]
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

export function downloadMonthlyDashboardCsv(rows: readonly DashboardMonthlyRow[]): void {
  downloadCsv(`dashboard_monthly_${formatDashboardTimestamp()}.csv`, buildMonthlyDashboardCsv(rows))
}

export function downloadMemberDashboardCsv(
  rows: readonly DashboardMemberRow[],
  startYearMonth: string,
  endYearMonth: string,
): void {
  downloadCsv(
    `dashboard_members_${formatDashboardMembersPeriodLabel(startYearMonth, endYearMonth)}_${formatDashboardTimestamp()}.csv`,
    buildMemberDashboardCsv(rows),
  )
}
