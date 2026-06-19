import { describe, expect, it } from 'vitest'
import { normalizeEnterpriseEventPaymentForCopy } from './eventCopy.js'

describe('normalizeEnterpriseEventPaymentForCopy', () => {
  it('enterprise_id なしはそのまま', () => {
    expect(normalizeEnterpriseEventPaymentForCopy(undefined, 'community_bill', { type: 'free' })).toEqual({
      event_payment: 'community_bill',
      community_bill_settings: { type: 'free' },
    })
  })

  it('enterprise_id が null は PF としてそのまま', () => {
    expect(normalizeEnterpriseEventPaymentForCopy(null, 'community_bill', { type: 'free' })).toEqual({
      event_payment: 'community_bill',
      community_bill_settings: { type: 'free' },
    })
  })

  it('enterprise_id 付き community_bill は enterprise_subsidy に変換', () => {
    expect(
      normalizeEnterpriseEventPaymentForCopy('ent1', 'community_bill', { type: 'discount', off_amount: 300 }),
    ).toEqual({
      event_payment: 'enterprise_subsidy',
      community_bill_settings: undefined,
    })
  })

  it('enterprise_id 付き user_on_day は enterprise_subsidy に変換', () => {
    expect(normalizeEnterpriseEventPaymentForCopy('ent1', 'user_on_day', undefined)).toEqual({
      event_payment: 'enterprise_subsidy',
      community_bill_settings: undefined,
    })
  })

  it('enterprise_id 付き user_advance は維持', () => {
    expect(normalizeEnterpriseEventPaymentForCopy('ent1', 'user_advance', undefined)).toEqual({
      event_payment: 'user_advance',
      community_bill_settings: undefined,
    })
  })
})
