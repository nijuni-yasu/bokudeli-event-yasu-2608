import { DateTime } from 'luxon'
import { convertToDate, DEFAULT_TIME_ZONE } from './datetime.js'
import type { BillingSnapshotFields } from './billingSnapshot.js'
import { computeInclusive8ExTaxAndTax, type InvoiceTaxBreakdown } from './invoice.js'
import { parseYearMonth } from './isEnterpriseMemberBillableInYearMonth.js'

export const ENTERPRISE_INVOICE_ITEMS_PADDING = 12

export const ENTERPRISE_BILLING_NOTE =
  'プラットフォーム利用料は各暦月の有効アカウント数に基づきます。食事関連従量はイベント開催月の利用実績に基づきます。'

export type EnterpriseInvoiceLineItem = {
  name: string
  count: number | string
  price: string
  totalPrice: string
}

export function calculateEnterpriseInvoiceTaxBreakdown(
  platformFeeInclusive: number,
  mealBillingInclusive: number,
): InvoiceTaxBreakdown {
  const tax10Inclusive = platformFeeInclusive
  const tax08Inclusive = mealBillingInclusive
  const total = tax08Inclusive + tax10Inclusive
  const { exTaxPrice: tax8SubTotal, taxPrice: tax8 } = computeInclusive8ExTaxAndTax(tax08Inclusive)
  const tax10SubTotal = Math.floor(tax10Inclusive / 1.1)
  const tax10 = tax10Inclusive - tax10SubTotal
  const tax = tax8 + tax10
  const subTotal = tax8SubTotal + tax10SubTotal
  return {
    total,
    subTotal,
    tax,
    tax8Inclusive: tax08Inclusive,
    tax8SubTotal,
    tax8,
    tax10Inclusive,
    tax10SubTotal,
    tax10,
  }
}

export function buildEnterpriseInvoiceLineItems(snapshot: BillingSnapshotFields): EnterpriseInvoiceLineItem[] {
  const items: EnterpriseInvoiceLineItem[] = []
  if (snapshot.platform_fee_amount > 0) {
    items.push({
      name: `プラットフォーム利用料（${snapshot.active_account_count}アカウント×${snapshot.unit_price.toLocaleString('ja-JP')}円）`,
      count: 1,
      price: `${snapshot.platform_fee_amount.toLocaleString('ja-JP')}円`,
      totalPrice: `${snapshot.platform_fee_amount.toLocaleString('ja-JP')}円`,
    })
  }
  if (snapshot.meal_billing_amount > 0) {
    items.push({
      name: '食事関連従量（福利厚生補助分）',
      count: 1,
      price: `${snapshot.meal_billing_amount.toLocaleString('ja-JP')}円`,
      totalPrice: `${snapshot.meal_billing_amount.toLocaleString('ja-JP')}円`,
    })
  }
  while (items.length < ENTERPRISE_INVOICE_ITEMS_PADDING) {
    items.push({ name: '', count: '', price: '', totalPrice: '' })
  }
  return items
}

export function getEnterpriseInvoicePaymentDeadlineMillis(yearMonth: string, zone = DEFAULT_TIME_ZONE): number {
  const { year, month } = parseYearMonth(yearMonth)
  return DateTime.fromObject({ year, month, day: 1 }, { zone }).plus({ months: 1 }).endOf('month').toMillis()
}

export function buildEnterpriseInvoiceNumber(enterpriseId: string, yearMonth: string): string {
  const prefix = enterpriseId.replace(/-/g, '').slice(0, 8)
  return `${prefix}-${yearMonth.replace('-', '')}`
}

export type EnterpriseInvoiceMergeInput = {
  enterpriseId: string
  companyName: string
  snapshot: BillingSnapshotFields
  issuedAtMillis?: number
}

export function buildEnterpriseInvoiceMergeData(input: EnterpriseInvoiceMergeInput) {
  const { snapshot, companyName, enterpriseId } = input
  const taxBreakdown = calculateEnterpriseInvoiceTaxBreakdown(
    snapshot.platform_fee_amount,
    snapshot.meal_billing_amount,
  )
  const yen = (amount: number) => `${amount.toLocaleString('ja-JP')}円`
  const issuedAt = input.issuedAtMillis ?? snapshot.snapshot_at

  return {
    number: buildEnterpriseInvoiceNumber(enterpriseId, snapshot.year_month),
    date: convertToDate(issuedAt),
    companyName,
    title: `${snapshot.year_month} ご請求`,
    items: buildEnterpriseInvoiceLineItems(snapshot),
    subTotal: yen(taxBreakdown.subTotal),
    tax: yen(taxBreakdown.tax),
    total: yen(taxBreakdown.total),
    tax10SubTotal: yen(taxBreakdown.tax10SubTotal),
    tax10: yen(taxBreakdown.tax10),
    tax8SubTotal: yen(taxBreakdown.tax8SubTotal),
    tax8: yen(taxBreakdown.tax8),
    deadline: convertToDate(getEnterpriseInvoicePaymentDeadlineMillis(snapshot.year_month)),
    billingNote: ENTERPRISE_BILLING_NOTE,
  }
}
