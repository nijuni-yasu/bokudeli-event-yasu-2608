import { describe, expect, it } from 'vitest'
import { EventMemberOrder } from '../schemas/EventMemberOrder.js'
import {
  computePaymentEnterpriseSubsidyAmount,
  enterpriseSubsidySettingsFromEnterprise,
  getMemberOrderDiscountAmount,
  isPaymentEnterpriseSubsidyAmountConsistent,
  replayEnterpriseSubsidyAmountsForOrders,
} from './paymentEnterpriseSubsidyAmount.js'

describe('enterpriseSubsidySettingsFromEnterprise', () => {
  it('フラット discount_* をスナップショット形式に変換する', () => {
    expect(
      enterpriseSubsidySettingsFromEnterprise({
        discount_type: 'fixed',
        discount_value: 500,
        monthly_limit_per_user: 7500,
      }),
    ).toEqual({
      type: 'fixed',
      value: 500,
      monthly_limit_per_user: 7500,
    })
  })
})

describe('computePaymentEnterpriseSubsidyAmount', () => {
  const settings = { type: 'fixed' as const, value: 500, monthly_limit_per_user: 7500 }

  it('非 enterprise_subsidy は undefined', () => {
    expect(computePaymentEnterpriseSubsidyAmount('user_advance', settings, 1000, 7500)).toBeUndefined()
  })

  it('fixed: min(value, menu_price)', () => {
    expect(computePaymentEnterpriseSubsidyAmount('enterprise_subsidy', settings, 1000, 7500)).toBe(500)
    expect(computePaymentEnterpriseSubsidyAmount('enterprise_subsidy', settings, 300, 7500)).toBe(300)
  })

  it('percentage: floor(menu_price * value / 100)', () => {
    const pct = { type: 'percentage' as const, value: 50, monthly_limit_per_user: 7500 }
    expect(computePaymentEnterpriseSubsidyAmount('enterprise_subsidy', pct, 1001, 7500)).toBe(500)
  })

  it('月額上限残枠 0 以下は undefined', () => {
    expect(computePaymentEnterpriseSubsidyAmount('enterprise_subsidy', settings, 1000, 0)).toBeUndefined()
  })

  it('残枠で切り下げ', () => {
    expect(computePaymentEnterpriseSubsidyAmount('enterprise_subsidy', settings, 1000, 200)).toBe(200)
  })
})

describe('isPaymentEnterpriseSubsidyAmountConsistent', () => {
  const settings = { type: 'fixed' as const, value: 500, monthly_limit_per_user: 7500 }

  it('一致する場合 true', () => {
    const order = new EventMemberOrder('oid', {
      order_id: 'oid',
      user_id: 'u1',
      event_id: 'e1',
      community_id: 'c1',
      menu_id: 'm1',
      menu_name: 'menu',
      menu_price: 1000,
      pay_enterprise_subsidy_amount: 500,
    })
    expect(isPaymentEnterpriseSubsidyAmountConsistent('enterprise_subsidy', settings, order, 7500)).toBe(true)
  })

  it('不一致の場合 false', () => {
    const order = new EventMemberOrder('oid', {
      order_id: 'oid',
      user_id: 'u1',
      event_id: 'e1',
      community_id: 'c1',
      menu_id: 'm1',
      menu_name: 'menu',
      menu_price: 1000,
      pay_enterprise_subsidy_amount: 400,
    })
    expect(isPaymentEnterpriseSubsidyAmountConsistent('enterprise_subsidy', settings, order, 7500)).toBe(false)
  })
})

describe('getMemberOrderDiscountAmount', () => {
  it('pay_enterprise_subsidy_amount を優先し、自己負担は menu_price から差し引く', () => {
    const order = new EventMemberOrder('oid', {
      order_id: 'oid',
      user_id: 'u1',
      event_id: 'e1',
      community_id: 'c1',
      menu_id: 'm1',
      menu_name: 'menu',
      menu_price: 2200,
      pay_enterprise_subsidy_amount: 1500,
    })
    expect(getMemberOrderDiscountAmount(order)).toBe(1500)
    expect(order.menu_price - getMemberOrderDiscountAmount(order)).toBe(700)
  })
})

describe('replayEnterpriseSubsidyAmountsForOrders', () => {
  const settings = { type: 'fixed' as const, value: 300, monthly_limit_per_user: 7500 }

  it('残枠途中で品ごとに補助額が変わる', () => {
    const orders = [
      new EventMemberOrder('o1', {
        order_id: 'o1',
        user_id: 'u1',
        event_id: 'e1',
        community_id: 'c1',
        menu_id: 'm1',
        menu_name: 'menu',
        menu_price: 600,
        pay_enterprise_subsidy_amount: 300,
      }),
      new EventMemberOrder('o2', {
        order_id: 'o2',
        user_id: 'u1',
        event_id: 'e1',
        community_id: 'c1',
        menu_id: 'm1',
        menu_name: 'menu',
        menu_price: 600,
        pay_enterprise_subsidy_amount: 300,
      }),
      new EventMemberOrder('o3', {
        order_id: 'o3',
        user_id: 'u1',
        event_id: 'e1',
        community_id: 'c1',
        menu_id: 'm1',
        menu_name: 'menu',
        menu_price: 600,
      }),
    ]
    const replay = replayEnterpriseSubsidyAmountsForOrders('enterprise_subsidy', settings, orders, 7200)
    expect(replay.expectedAmounts).toEqual([300, undefined, undefined])
    expect(replay.subsidyTotal).toBe(300)
    expect(replay.totalPayment).toBe(1500)
  })
})
