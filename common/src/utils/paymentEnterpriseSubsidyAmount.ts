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
