import { formatYearMonth } from './datetime.js'
import {
  getYearMonthRangeMillis,
  isEnterpriseMemberBillableInYearMonth,
  parseYearMonth,
  type BillableMemberTimestamps,
} from './isEnterpriseMemberBillableInYearMonth.js'
import type { DashboardBillingStatus, DashboardMemberRow, DashboardMonthlyRow } from '../apis/dashboard.js'

export const MAX_DASHBOARD_PERIOD_MONTHS = 24

export type DashboardOrderLine = {
  user_id: string
  event_id: string
  menu_price: number
  pay_enterprise_subsidy_amount?: number
}

export type DashboardStripeSession = {
  user_id: string
  event_id: string
}

export type DashboardAuditSession = {
  user_id: string
  event_id: string
}

export type DashboardEventMonthInput = {
  event_id: string
  event_start_datetime: number
}

export type DashboardMemberMeta = BillableMemberTimestamps & {
  user_id: string
  display_name: string
  email: string
  department: string
}

export type DashboardBillingSettings = {
  unit_price: number
  billing_trial_ends_at: number
}

export class DashboardPeriodError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DashboardPeriodError'
  }
}

export function compareYearMonth(a: string, b: string): number {
  const { year: ay, month: am } = parseYearMonth(a)
  const { year: by, month: bm } = parseYearMonth(b)
  if (ay !== by) return ay - by
  return am - bm
}

function enumerateYearMonthsUnchecked(startYearMonth: string, endYearMonth: string): string[] {
  const result: string[] = []
  const { year: endYear, month: endMonth } = parseYearMonth(endYearMonth)
  let { year, month } = parseYearMonth(startYearMonth)
  while (year < endYear || (year === endYear && month <= endMonth)) {
    result.push(`${year}-${String(month).padStart(2, '0')}`)
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
  return result
}

export function enumerateYearMonths(startYearMonth: string, endYearMonth: string): string[] {
  validateDashboardPeriod(startYearMonth, endYearMonth)
  return enumerateYearMonthsUnchecked(startYearMonth, endYearMonth)
}

export function countMonthsInRange(startYearMonth: string, endYearMonth: string): number {
  return enumerateYearMonthsUnchecked(startYearMonth, endYearMonth).length
}

export function validateDashboardPeriod(
  startYearMonth: string,
  endYearMonth: string,
  maxMonths = MAX_DASHBOARD_PERIOD_MONTHS,
): void {
  parseYearMonth(startYearMonth)
  parseYearMonth(endYearMonth)
  if (compareYearMonth(startYearMonth, endYearMonth) > 0) {
    throw new DashboardPeriodError('start_year_month must be <= end_year_month')
  }
  const monthCount = countMonthsInRange(startYearMonth, endYearMonth)
  if (monthCount > maxMonths) {
    throw new DashboardPeriodError(`period must be at most ${maxMonths} months`)
  }
}

export function isYearMonthInRange(yearMonth: string, startYearMonth: string, endYearMonth: string): boolean {
  return compareYearMonth(yearMonth, startYearMonth) >= 0 && compareYearMonth(yearMonth, endYearMonth) <= 0
}

export function buildEventMonthMap(events: readonly DashboardEventMonthInput[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const event of events) {
    map.set(event.event_id, formatYearMonth(event.event_start_datetime))
  }
  return map
}

function resolveEventMonth(eventId: string, eventMonthMap: ReadonlyMap<string, string>): string | undefined {
  return eventMonthMap.get(eventId)
}

function subsidyAmount(order: DashboardOrderLine): number {
  return order.pay_enterprise_subsidy_amount ?? 0
}

function userPaidAmount(order: DashboardOrderLine): number {
  return order.menu_price - subsidyAmount(order)
}

/** G-1 前: enterprise_billing_amount = subsidy のみ */
function enterpriseBillingAmount(order: DashboardOrderLine): number {
  return subsidyAmount(order)
}

export function computePlatformFeeForMonth(
  yearMonth: string,
  members: readonly DashboardMemberMeta[],
  billingSettings: DashboardBillingSettings,
  zone?: string,
): { active_account_count: number; platform_fee_amount: number } {
  const { monthEnd } = getYearMonthRangeMillis(yearMonth, zone)
  const active_account_count = members.filter((member) =>
    isEnterpriseMemberBillableInYearMonth(member, yearMonth, zone),
  ).length
  const inTrial = monthEnd <= billingSettings.billing_trial_ends_at
  const platform_fee_amount = inTrial ? 0 : active_account_count * billingSettings.unit_price
  return { active_account_count, platform_fee_amount }
}

export function countSessionsByMonth(params: {
  startYearMonth: string
  endYearMonth: string
  stripes: readonly DashboardStripeSession[]
  auditSessions: readonly DashboardAuditSession[]
  eventMonthMap: ReadonlyMap<string, string>
}): Map<string, number> {
  const counts = new Map<string, number>()
  const add = (eventId: string) => {
    const yearMonth = resolveEventMonth(eventId, params.eventMonthMap)
    if (yearMonth == null || !isYearMonthInRange(yearMonth, params.startYearMonth, params.endYearMonth)) {
      return
    }
    counts.set(yearMonth, (counts.get(yearMonth) ?? 0) + 1)
  }
  for (const stripe of params.stripes) {
    add(stripe.event_id)
  }
  for (const audit of params.auditSessions) {
    add(audit.event_id)
  }
  return counts
}

export function sumOrderAmountsByMonth(params: {
  startYearMonth: string
  endYearMonth: string
  orders: readonly DashboardOrderLine[]
  eventMonthMap: ReadonlyMap<string, string>
}): {
  totalAmountByMonth: Map<string, number>
  subsidyByMonth: Map<string, number>
  userPaidByMonth: Map<string, number>
  billingByMonth: Map<string, number>
  uniqueUsersByMonth: Map<string, Set<string>>
} {
  const totalAmountByMonth = new Map<string, number>()
  const subsidyByMonth = new Map<string, number>()
  const userPaidByMonth = new Map<string, number>()
  const billingByMonth = new Map<string, number>()
  const uniqueUsersByMonth = new Map<string, Set<string>>()

  for (const order of params.orders) {
    const yearMonth = resolveEventMonth(order.event_id, params.eventMonthMap)
    if (yearMonth == null || !isYearMonthInRange(yearMonth, params.startYearMonth, params.endYearMonth)) {
      continue
    }
    totalAmountByMonth.set(yearMonth, (totalAmountByMonth.get(yearMonth) ?? 0) + order.menu_price)
    subsidyByMonth.set(yearMonth, (subsidyByMonth.get(yearMonth) ?? 0) + subsidyAmount(order))
    userPaidByMonth.set(yearMonth, (userPaidByMonth.get(yearMonth) ?? 0) + userPaidAmount(order))
    billingByMonth.set(yearMonth, (billingByMonth.get(yearMonth) ?? 0) + enterpriseBillingAmount(order))
    const users = uniqueUsersByMonth.get(yearMonth) ?? new Set<string>()
    users.add(order.user_id)
    uniqueUsersByMonth.set(yearMonth, users)
  }

  return { totalAmountByMonth, subsidyByMonth, userPaidByMonth, billingByMonth, uniqueUsersByMonth }
}

export function aggregateMonthlyRows(params: {
  startYearMonth: string
  endYearMonth: string
  orders: readonly DashboardOrderLine[]
  stripes: readonly DashboardStripeSession[]
  auditSessions: readonly DashboardAuditSession[]
  eventMonthMap: ReadonlyMap<string, string>
  members: readonly DashboardMemberMeta[]
  billingSettings: DashboardBillingSettings
  /** D-4 未実装時は true（全月 provisional） */
  allProvisional?: boolean
  currentCalendarYearMonth?: string
  zone?: string
}): DashboardMonthlyRow[] {
  validateDashboardPeriod(params.startYearMonth, params.endYearMonth)
  const yearMonths = enumerateYearMonths(params.startYearMonth, params.endYearMonth)
  const sessionCounts = countSessionsByMonth(params)
  const amounts = sumOrderAmountsByMonth(params)
  const currentYm = params.currentCalendarYearMonth ?? formatYearMonth(Date.now(), params.zone)

  return yearMonths.map((yearMonth) => {
    const { active_account_count, platform_fee_amount } = computePlatformFeeForMonth(
      yearMonth,
      params.members,
      params.billingSettings,
      params.zone,
    )
    const enterprise_billing_amount = amounts.billingByMonth.get(yearMonth) ?? 0
    const billing_status: DashboardBillingStatus =
      params.allProvisional === true || yearMonth === currentYm ? 'provisional' : 'final'

    return {
      year_month: yearMonth,
      session_count: sessionCounts.get(yearMonth) ?? 0,
      unique_users: amounts.uniqueUsersByMonth.get(yearMonth)?.size ?? 0,
      total_amount: amounts.totalAmountByMonth.get(yearMonth) ?? 0,
      enterprise_subsidy_amount: amounts.subsidyByMonth.get(yearMonth) ?? 0,
      user_paid_amount: amounts.userPaidByMonth.get(yearMonth) ?? 0,
      enterprise_billing_amount,
      active_account_count,
      platform_fee_amount,
      total_billing_amount: platform_fee_amount + enterprise_billing_amount,
      billing_status,
    }
  })
}

export function aggregateMemberRows(params: {
  startYearMonth: string
  endYearMonth: string
  orders: readonly DashboardOrderLine[]
  stripes: readonly DashboardStripeSession[]
  auditSessions: readonly DashboardAuditSession[]
  eventMonthMap: ReadonlyMap<string, string>
  members: readonly DashboardMemberMeta[]
}): DashboardMemberRow[] {
  validateDashboardPeriod(params.startYearMonth, params.endYearMonth)

  const memberMetaByUserId = new Map(params.members.map((member) => [member.user_id, member]))
  const totals = new Map<
    string,
    { session_count: number; total_amount: number; enterprise_subsidy_amount: number; user_paid_amount: number }
  >()

  const ensure = (userId: string) => {
    let row = totals.get(userId)
    if (row == null) {
      row = { session_count: 0, total_amount: 0, enterprise_subsidy_amount: 0, user_paid_amount: 0 }
      totals.set(userId, row)
    }
    return row
  }

  const isInRangeEventMonth = (eventId: string): boolean => {
    const yearMonth = resolveEventMonth(eventId, params.eventMonthMap)
    return yearMonth != null && isYearMonthInRange(yearMonth, params.startYearMonth, params.endYearMonth)
  }

  for (const order of params.orders) {
    if (!isInRangeEventMonth(order.event_id)) continue
    const row = ensure(order.user_id)
    row.total_amount += order.menu_price
    row.enterprise_subsidy_amount += subsidyAmount(order)
    row.user_paid_amount += userPaidAmount(order)
  }

  for (const stripe of params.stripes) {
    if (!isInRangeEventMonth(stripe.event_id)) continue
    ensure(stripe.user_id).session_count += 1
  }

  for (const audit of params.auditSessions) {
    if (!isInRangeEventMonth(audit.event_id)) continue
    ensure(audit.user_id).session_count += 1
  }

  return Array.from(totals.entries())
    .filter(([, row]) => row.total_amount > 0)
    .map(([userId, row]) => {
      const meta = memberMetaByUserId.get(userId)
      return {
        user_id: userId,
        display_name: meta?.display_name ?? '',
        email: meta?.email ?? '',
        department: meta?.department ?? '',
        session_count: row.session_count,
        total_amount: row.total_amount,
        enterprise_subsidy_amount: row.enterprise_subsidy_amount,
        user_paid_amount: row.user_paid_amount,
      }
    })
    .sort((a, b) => b.total_amount - a.total_amount || a.display_name.localeCompare(b.display_name, 'ja'))
}
