export type DashboardPeriodRequest = {
  enterprise_id: string
  start_year_month: string
  end_year_month: string
}

export type DashboardBillingStatus = 'final' | 'provisional'

export type DashboardMonthlyRow = {
  year_month: string
  session_count: number
  unique_users: number
  total_amount: number
  enterprise_subsidy_amount: number
  user_paid_amount: number
  enterprise_billing_amount: number
  active_account_count: number
  platform_fee_amount: number
  total_billing_amount: number
  billing_status: DashboardBillingStatus
}

export type DashboardMemberRow = {
  user_id: string
  display_name: string
  email: string
  department: string
  session_count: number
  total_amount: number
  enterprise_subsidy_amount: number
  user_paid_amount: number
}

export type GetDashboardMonthlyDataRequest = DashboardPeriodRequest

export type GetDashboardMonthlyDataResponse = {
  rows: DashboardMonthlyRow[]
}

export type GetDashboardMemberDataRequest = DashboardPeriodRequest

export type GetDashboardMemberDataResponse = {
  rows: DashboardMemberRow[]
}
