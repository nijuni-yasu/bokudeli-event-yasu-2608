import { describe, expect, it } from 'vitest'
import {
  computeOrderLineNet,
  computePaymentCommunityBillOffAmount,
  computeTotalPayment,
  isPaymentCommunityBillOffAmountConsistent,
} from './paymentCommunityBillOffAmount.js'
import { EventMemberOrder } from '../schemas/EventMemberOrder.js'

const communityBill = 'community_bill' as const

const makeOrder = (overrides: Partial<EventMemberOrder>): EventMemberOrder =>
  new EventMemberOrder('order-1', {
    order_id: 'order-1',
    user_id: 'user-1',
    event_id: 'event-1',
    community_id: 'community-1',
    status: 'ordered',
    menu_id: 'menu-1',
    menu_name: 'テストメニュー',
    menu_price: 1000,
    ...overrides,
  })

describe('computePaymentCommunityBillOffAmount', () => {
  it('user_advance では undefined', () => {
    expect(
      computePaymentCommunityBillOffAmount('user_advance', { type: 'discount', off_amount: 500 }, 1000),
    ).toBeUndefined()
  })

  it('community_bill で settings なしは例外', () => {
    expect(() => computePaymentCommunityBillOffAmount(communityBill, undefined, 1000)).toThrow(
      'community_bill requires community_bill_settings',
    )
  })

  it('free は menu_price をそのまま返す', () => {
    expect(computePaymentCommunityBillOffAmount(communityBill, { type: 'free' }, 1000)).toBe(1000)
    expect(computePaymentCommunityBillOffAmount(communityBill, { type: 'free' }, 300)).toBe(300)
  })

  it('discount は min(off_amount, menu_price)', () => {
    expect(computePaymentCommunityBillOffAmount(communityBill, { type: 'discount', off_amount: 500 }, 1000)).toBe(500)
    expect(computePaymentCommunityBillOffAmount(communityBill, { type: 'discount', off_amount: 500 }, 300)).toBe(300)
    expect(computePaymentCommunityBillOffAmount(communityBill, { type: 'discount', off_amount: 1000 }, 800)).toBe(800)
  })
})

describe('computeOrderLineNet', () => {
  it('eventPayment 未指定はストアド値のみで line_net を返す', () => {
    expect(computeOrderLineNet(makeOrder({ menu_price: 1000 }))).toBe(1000)
    expect(computeOrderLineNet(makeOrder({ menu_price: 1000, payment_community_bill_off_amount: 300 }))).toBe(700)
  })

  it('user_advance はストアド値のみで line_net を返す（eventPayment あり）', () => {
    expect(computeOrderLineNet(makeOrder({ menu_price: 1000 }), 'user_advance', undefined)).toBe(1000)
  })

  it('community_bill + free は line_net 0', () => {
    const order = makeOrder({ menu_price: 1000, payment_community_bill_off_amount: 1000 })
    expect(computeOrderLineNet(order, communityBill, { type: 'free' })).toBe(0)
  })

  it('community_bill + discount はストアド値分を控除', () => {
    const order = makeOrder({ menu_price: 1000, payment_community_bill_off_amount: 300 })
    expect(computeOrderLineNet(order, communityBill, { type: 'discount', off_amount: 300 })).toBe(700)
  })

  it('community_bill で settings なしは例外', () => {
    const order = makeOrder({ menu_price: 1000 })
    expect(() => computeOrderLineNet(order, communityBill, undefined)).toThrow(
      'community_bill requires community_bill_settings',
    )
  })

  it('community_bill + free で stored があれば優先', () => {
    const order = makeOrder({ menu_price: 1000, payment_community_bill_off_amount: 1000 })
    expect(computeOrderLineNet(order, communityBill, { type: 'free' })).toBe(0)
  })
})

describe('computeTotalPayment', () => {
  it('割引なしはメニュー合計', () => {
    const orders = [makeOrder({ menu_price: 1000 }), makeOrder({ menu_price: 500 })]
    expect(computeTotalPayment(orders)).toBe(1500)
  })

  it('free 参加は全員 ¥0', () => {
    const orders = [
      makeOrder({ menu_price: 1000, payment_community_bill_off_amount: 1000 }),
      makeOrder({ menu_price: 500, payment_community_bill_off_amount: 500 }),
    ]
    expect(computeTotalPayment(orders)).toBe(0)
  })

  it('discount 参加は差額を合算', () => {
    const orders = [
      makeOrder({ menu_price: 1000, payment_community_bill_off_amount: 300 }),
      makeOrder({ menu_price: 1000, payment_community_bill_off_amount: 300 }),
    ]
    expect(computeTotalPayment(orders)).toBe(1400)
  })

  it('キャンセル済みは除外', () => {
    const orders = [
      makeOrder({ status: 'ordered', menu_price: 1000 }),
      makeOrder({ status: 'canceled', menu_price: 500 }),
    ]
    expect(computeTotalPayment(orders)).toBe(1000)
  })

  it('community_bill + free で stored が menu_price と一致すれば 0', () => {
    const orders = [
      makeOrder({ menu_price: 1000, payment_community_bill_off_amount: 1000 }),
      makeOrder({ menu_price: 500, payment_community_bill_off_amount: 500 }),
    ]
    expect(computeTotalPayment(orders, communityBill, { type: 'free' })).toBe(0)
  })

  it('community_bill で settings なしは例外', () => {
    const orders = [makeOrder({ menu_price: 1000 }), makeOrder({ menu_price: 500 })]
    expect(() => computeTotalPayment(orders, communityBill, undefined)).toThrow(
      'community_bill requires community_bill_settings',
    )
  })
})

describe('isPaymentCommunityBillOffAmountConsistent', () => {
  it('整合している場合は true', () => {
    const order = makeOrder({ menu_price: 1000, payment_community_bill_off_amount: 500 })
    expect(isPaymentCommunityBillOffAmountConsistent(communityBill, { type: 'discount', off_amount: 500 }, order)).toBe(
      true,
    )
  })

  it('整合していない場合は false', () => {
    const order = makeOrder({ menu_price: 1000, payment_community_bill_off_amount: 300 })
    expect(isPaymentCommunityBillOffAmountConsistent(communityBill, { type: 'discount', off_amount: 500 }, order)).toBe(
      false,
    )
  })

  it('両方 undefined の場合は true', () => {
    const order = makeOrder({ menu_price: 1000 })
    expect(isPaymentCommunityBillOffAmountConsistent('user_advance', undefined, order)).toBe(true)
  })

  it('community_bill で settings なしは例外', () => {
    const order = makeOrder({ menu_price: 1000 })
    expect(() => isPaymentCommunityBillOffAmountConsistent(communityBill, undefined, order)).toThrow(
      'community_bill requires community_bill_settings',
    )
  })

  it('community_bill + free で stored が menu_price と一致すれば true', () => {
    const order = makeOrder({ menu_price: 1000, payment_community_bill_off_amount: 1000 })
    expect(isPaymentCommunityBillOffAmountConsistent(communityBill, { type: 'free' }, order)).toBe(true)
  })

  it('community_bill + free で stored が中途半端なら false', () => {
    const order = makeOrder({ menu_price: 1000, payment_community_bill_off_amount: 300 })
    expect(isPaymentCommunityBillOffAmountConsistent(communityBill, { type: 'free' }, order)).toBe(false)
  })
})
