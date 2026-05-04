import type { CommunityBillSettingsType, EventPaymentType } from '../schemas/Event.js'
import type { EventMemberOrder } from '../schemas/EventMemberOrder.js'

/**
 * 1 つの member_orders ドキュメントに適用する主催者負担額を算出する。
 *
 * - `free`     : menu_price をそのまま返す（全額主催者負担）
 * - `discount` : min(off_amount, menu_price) を返す
 * - 非 community_bill : undefined（フィールドを付けない）
 *
 * `event_payment === 'community_bill'` のときは `community_bill_settings` が必須（Firestore はマイグレーション済み前提）。
 *
 * @see documents/01_マネタイズと決済/03_無料参加・割引参加_EventMemberOrder対応.md
 */
export function computePaymentCommunityBillOffAmount(
  eventPayment: EventPaymentType,
  settings: CommunityBillSettingsType | undefined,
  menu_price: number,
): number | undefined {
  if (eventPayment !== 'community_bill') return undefined
  if (settings == null) {
    throw new Error('community_bill requires community_bill_settings')
  }
  if (settings.type === 'free') return menu_price
  if (settings.type === 'discount') return Math.min(settings.off_amount, menu_price)
  return undefined
}

function effectiveCommunityBillOffAmount(
  order: EventMemberOrder,
  eventPayment: EventPaymentType,
  settings: CommunityBillSettingsType | undefined,
): number {
  const stored = order.pay_community_bill_off_amount
  if (stored != null) return stored
  if (eventPayment === 'community_bill') {
    return computePaymentCommunityBillOffAmount(eventPayment, settings, order.menu_price) ?? 0
  }
  return 0
}

/**
 * 1 注文ごとの参加者支払額（line net = menu_price - 主催者負担相当）を算出する。
 * キャンセル判定は呼び出し側の責務。
 *
 * `eventPayment` を省略した場合は、ストアドの `pay_community_bill_off_amount` のみを見る（`?? 0`）。
 */
export function computeOrderLineNet(
  order: EventMemberOrder,
  eventPayment?: EventPaymentType,
  settings?: CommunityBillSettingsType | undefined,
): number {
  const off =
    eventPayment !== undefined
      ? effectiveCommunityBillOffAmount(order, eventPayment, settings)
      : (order.pay_community_bill_off_amount ?? 0)
  return order.menu_price - off
}

/**
 * order_ids 全体の参加者支払合計を算出する。
 * キャンセル済みを除くすべての order を対象に (menu_price - 主催者負担相当) を合算。
 *
 * `eventPayment` を省略した場合は、ストアドの `pay_community_bill_off_amount` のみを見る（`?? 0`）。
 */
export function computeTotalPayment(
  orders: EventMemberOrder[],
  eventPayment?: EventPaymentType,
  settings?: CommunityBillSettingsType | undefined,
): number {
  return orders
    .filter((o) => o.status !== 'canceled')
    .reduce((sum, o) => sum + computeOrderLineNet(o, eventPayment, settings), 0)
}

/**
 * サーバー側再計算とストアード値の整合チェック（confirmOrder / createStripeCheckoutSession 用）。
 * 非 community_bill では expected / stored がともに undefined のとき一致。
 */
export function isPaymentCommunityBillOffAmountConsistent(
  eventPayment: EventPaymentType,
  settings: CommunityBillSettingsType | undefined,
  order: EventMemberOrder,
): boolean {
  const expected = computePaymentCommunityBillOffAmount(eventPayment, settings, order.menu_price)
  return expected === order.pay_community_bill_off_amount
}
