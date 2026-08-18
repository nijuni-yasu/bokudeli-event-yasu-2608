import type { BillingStatusType } from '../schemas/Enterprise.js'
import {
  getYearMonthRangeMillis,
  isEnterpriseMemberBillableInYearMonth,
  parseYearMonth,
  type BillableMemberTimestamps,
} from './isEnterpriseMemberBillableInYearMonth.js'

export class BillingSnapshotPeriodError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BillingSnapshotPeriodError'
  }
}

export function assertRecapturableYearMonth(yearMonth: string, currentCalendarYearMonth: string): void {
  try {
    parseYearMonth(yearMonth)
  } catch {
    throw new BillingSnapshotPeriodError('year_month must be YYYY-MM')
  }
  if (yearMonth >= currentCalendarYearMonth) {
    throw new BillingSnapshotPeriodError('year_month must be before the current calendar month')
  }
}

export type BuildBillingSnapshotInput = {
  yearMonth: string
  unitPrice: number
  billingTrialEndsAt: number
  enterpriseIsActive: boolean
  members: readonly BillableMemberTimestamps[]
  mealBillingAmount: number
  zone?: string
  snapshotAt?: number
}

export type BillingSnapshotFields = {
  year_month: string
  active_account_count: number
  unit_price: number
  platform_fee_amount: number
  is_trial: boolean
  meal_billing_amount: number
  total_billing_amount: number
  snapshot_at: number
  billing_status: BillingStatusType
}

export function computePlatformFeeAmount(params: {
  yearMonth: string
  members: readonly BillableMemberTimestamps[]
  unitPrice: number
  billingTrialEndsAt: number
  enterpriseIsActive: boolean
  zone?: string
}): { active_account_count: number; platform_fee_amount: number; is_trial: boolean } {
  const { monthEnd } = getYearMonthRangeMillis(params.yearMonth, params.zone)
  const active_account_count = params.members.filter((member) =>
    isEnterpriseMemberBillableInYearMonth(member, params.yearMonth, params.zone),
  ).length
  const is_trial = monthEnd <= params.billingTrialEndsAt
  const platform_fee_amount = is_trial || !params.enterpriseIsActive ? 0 : active_account_count * params.unitPrice
  return { active_account_count, platform_fee_amount, is_trial }
}

export function buildBillingSnapshot(input: BuildBillingSnapshotInput): BillingSnapshotFields {
  const { active_account_count, platform_fee_amount, is_trial } = computePlatformFeeAmount({
    yearMonth: input.yearMonth,
    members: input.members,
    unitPrice: input.unitPrice,
    billingTrialEndsAt: input.billingTrialEndsAt,
    enterpriseIsActive: input.enterpriseIsActive,
    zone: input.zone,
  })
  const meal_billing_amount = input.mealBillingAmount
  return {
    year_month: input.yearMonth,
    active_account_count,
    unit_price: input.unitPrice,
    platform_fee_amount,
    is_trial,
    meal_billing_amount,
    total_billing_amount: platform_fee_amount + meal_billing_amount,
    snapshot_at: input.snapshotAt ?? Date.now(),
    billing_status: 'final',
  }
}
