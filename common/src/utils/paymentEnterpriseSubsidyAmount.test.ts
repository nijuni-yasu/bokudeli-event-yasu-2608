import { describe, expect, it } from 'vitest'
import { EventMemberOrder } from '../schemas/EventMemberOrder.js'
import {
  computePaymentEnterpriseSubsidyAmount,
  enterpriseSubsidySettingsFromEnterprise,
  isPaymentEnterpriseSubsidyAmountConsistent,
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
