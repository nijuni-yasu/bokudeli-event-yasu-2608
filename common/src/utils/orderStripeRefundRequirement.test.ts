import { describe, expect, it } from 'vitest'
import { EventMemberOrder } from '../schemas/EventMemberOrder.js'
import { orderRequiresStripeIdForCancelRefund } from './orderStripeRefundRequirement.js'

const baseOrder = (): EventMemberOrder =>
  new EventMemberOrder('o1', {
    order_id: 'o1',
    user_id: 'u1',
    community_id: 'c1',
    event_id: 'e1',
    menu_id: 'm1',
    menu_name: 'menu',
    menu_price: 1000,
    status: 'ordered',
  })

describe('orderRequiresStripeIdForCancelRefund', () => {
  it('user_on_day では selfPay 正でも stripe_id 不要', () => {
    expect(orderRequiresStripeIdForCancelRefund(baseOrder(), 'user_on_day')).toBe(false)
  })

  it('community_bill では selfPay 正でも stripe_id 不要', () => {
    expect(orderRequiresStripeIdForCancelRefund(baseOrder(), 'community_bill')).toBe(false)
  })

  it('user_advance で selfPay 正なら stripe_id 必須対象', () => {
    expect(orderRequiresStripeIdForCancelRefund(baseOrder(), 'user_advance')).toBe(true)
  })

  it('user_advance で selfPay 0 なら不要', () => {
    const order = baseOrder()
    order.menu_price = 0
    expect(orderRequiresStripeIdForCancelRefund(order, 'user_advance')).toBe(false)
  })

  it('enterprise_subsidy で selfPay 正なら stripe_id 必須対象', () => {
    const order = baseOrder()
    order.pay_enterprise_subsidy_amount = 500
    expect(orderRequiresStripeIdForCancelRefund(order, 'enterprise_subsidy')).toBe(true)
  })
})
