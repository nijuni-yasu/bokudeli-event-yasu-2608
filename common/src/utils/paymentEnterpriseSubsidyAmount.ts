import type { EventPaymentType } from '../schemas/Event.js'
import type { EnterpriseSubsidySettingsType } from '../schemas/EnterpriseSubsidySettings.js'
import type { Enterprise } from '../schemas/Enterprise.js'
import type { EventMemberOrder } from '../schemas/EventMemberOrder.js'

/**
 * Enterprise マスター（フラット discount_*）→ Event スナップショット変換。
 */
export function enterpriseSubsidySettingsFromEnterprise(
  enterprise: Pick<Enterprise, 'discount_type' | 'discount_value' | 'monthly_limit_per_user'>,
): EnterpriseSubsidySettingsType {
  return {
    type: enterprise.discount_type,
    value: enterprise.discount_value,
    monthly_limit_per_user: enterprise.monthly_limit_per_user,
  }
}

/**
 * 1 つの member_orders ドキュメントに適用する企業補助額を算出する。
 *
 * - fixed: min(value, menu_price)
 * - percentage: min(floor(menu_price * value / 100), menu_price)
 * - 非 enterprise_subsidy: undefined
 * - remainingMonthlyLimit <= 0: undefined（月額上限超過分は自己負担）
 */
export function computePaymentEnterpriseSubsidyAmount(
  eventPayment: EventPaymentType,
  settings: EnterpriseSubsidySettingsType | undefined,
  menu_price: number,
  remainingMonthlyLimit: number,
): number | undefined {
  if (eventPayment !== 'enterprise_subsidy') return undefined
  if (settings == null) {
    throw new Error('enterprise_subsidy requires enterprise_subsidy_settings')
  }
  if (remainingMonthlyLimit <= 0) return undefined

  let baseAmount: number
  if (settings.type === 'fixed') {
    baseAmount = Math.min(settings.value, menu_price)
  } else {
    baseAmount = Math.min(Math.floor((menu_price * settings.value) / 100), menu_price)
  }
  return Math.min(baseAmount, remainingMonthlyLimit)
}

function effectiveEnterpriseSubsidyAmount(
  order: EventMemberOrder,
  eventPayment: EventPaymentType,
  settings: EnterpriseSubsidySettingsType | undefined,
  remainingMonthlyLimit: number,
): number {
  const stored = order.pay_enterprise_subsidy_amount
  if (stored != null) return stored
  if (eventPayment === 'enterprise_subsidy') {
    return computePaymentEnterpriseSubsidyAmount(eventPayment, settings, order.menu_price, remainingMonthlyLimit) ?? 0
  }
  return 0
}

/**
 * 1 注文ごとの参加者支払額（line net = menu_price - 企業補助相当）。
 */
export function computeEnterpriseOrderLineNet(
  order: EventMemberOrder,
  eventPayment?: EventPaymentType,
  settings?: EnterpriseSubsidySettingsType,
  remainingMonthlyLimit = Number.MAX_SAFE_INTEGER,
): number {
  const subsidy =
    eventPayment !== undefined
      ? effectiveEnterpriseSubsidyAmount(order, eventPayment, settings, remainingMonthlyLimit)
      : (order.pay_enterprise_subsidy_amount ?? 0)
  return order.menu_price - subsidy
}

/**
 * サーバー側再計算とストアード値の整合チェック（confirmOrder / createStripeCheckoutSession 用）。
 */
export function isPaymentEnterpriseSubsidyAmountConsistent(
  eventPayment: EventPaymentType,
  settings: EnterpriseSubsidySettingsType | undefined,
  order: EventMemberOrder,
  remainingMonthlyLimit: number,
): boolean {
  const expected = computePaymentEnterpriseSubsidyAmount(
    eventPayment,
    settings,
    order.menu_price,
    remainingMonthlyLimit,
  )
  return expected === order.pay_enterprise_subsidy_amount
}

/** enterprise_subsidy 注文セッションの参加者支払合計 */
export function computeEnterpriseSubsidyTotalPayment(orders: EventMemberOrder[]): number {
  return orders.reduce((sum, o) => sum + o.menu_price - (o.pay_enterprise_subsidy_amount ?? 0), 0)
}

/** community_bill / enterprise_subsidy いずれかの割引額（表示・合計用） */
export function getMemberOrderDiscountAmount(order: EventMemberOrder): number {
  return order.pay_enterprise_subsidy_amount ?? order.pay_community_bill_off_amount ?? 0
}

/** カート表示・合計用（キャンセル済み除外） */
export function computeMemberOrdersTotalPayment(orders: EventMemberOrder[]): number {
  return orders
    .filter((o) => o.status !== 'canceled')
    .reduce((sum, o) => sum + o.menu_price - getMemberOrderDiscountAmount(o), 0)
}

/**
 * addToCart / confirmOrder / createStripeCheckoutSession で同一順序の order 列を
 * イベント開催月 usage 起点でループ再現し、order ごとの期待補助額を返す。
 */
export function replayEnterpriseSubsidyAmountsForOrders(
  eventPayment: EventPaymentType,
  settings: EnterpriseSubsidySettingsType | undefined,
  orders: EventMemberOrder[],
  monthlyUsageForEventMonth: number,
): { expectedAmounts: (number | undefined)[]; subsidyTotal: number; totalPayment: number } {
  if (eventPayment !== 'enterprise_subsidy') {
    throw new Error('replayEnterpriseSubsidyAmountsForOrders is only for enterprise_subsidy')
  }
  if (settings == null) {
    throw new Error('enterprise_subsidy requires enterprise_subsidy_settings')
  }
  let runningUsage = monthlyUsageForEventMonth
  const expectedAmounts: (number | undefined)[] = []
  for (const order of orders) {
    const remaining = Math.max(0, settings.monthly_limit_per_user - runningUsage)
    const expected = computePaymentEnterpriseSubsidyAmount(eventPayment, settings, order.menu_price, remaining)
    expectedAmounts.push(expected)
    runningUsage += expected ?? 0
  }
  const subsidyTotal = expectedAmounts.reduce<number>((sum, a) => sum + (a ?? 0), 0)
  const totalPayment = orders.reduce<number>((sum, o, i) => sum + o.menu_price - (expectedAmounts[i] ?? 0), 0)
  return { expectedAmounts, subsidyTotal, totalPayment }
}
