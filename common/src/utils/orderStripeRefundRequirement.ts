import type { EventPaymentType } from '../schemas/Event.js'
import type { EventMemberOrder } from '../schemas/EventMemberOrder.js'
import { getMemberOrderDiscountAmount } from './paymentEnterpriseSubsidyAmount.js'

/** キャンセル時に Stripe 返金が必要な注文か（stripe_id 欠落を拒否する対象） */
export function orderRequiresStripeIdForCancelRefund(
  order: EventMemberOrder,
  eventPayment: EventPaymentType,
): boolean {
  if (eventPayment === 'user_on_day' || eventPayment === 'community_bill') {
    return false
  }
  const selfPay = order.menu_price - getMemberOrderDiscountAmount(order)
  if (selfPay <= 0) {
    return false
  }
  return eventPayment === 'user_advance' || eventPayment === 'enterprise_subsidy'
}
