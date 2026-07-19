import { describe, expect, it } from 'vitest'
import { EventStripe } from './EventStripe.js'

const minimalStripeFields = {
  stripe_id: 'stripe-pf',
  order_ids: ['order-1'],
  user_id: 'user-pf',
  event_id: 'event-1',
  community_id: 'community-1',
  payment_intent: 'pi_test',
  pay_amount: 1000,
  menus: [{ menu_name: 'ランチ', menu_price: 1000, count: 1 }],
}

describe('EventStripe enterprise_id', () => {
  it('toFirestore で enterprise_id 未設定時は null を明示保存する', () => {
    const stripe = new EventStripe('stripe-pf', minimalStripeFields)
    expect(stripe.isValidForDatabase()).toBe(true)
    const out = stripe.toFirestore()
    expect(out.enterprise_id).toBeNull()
  })

  it('toFirestore で enterprise_id string はそのまま保存する', () => {
    const stripe = new EventStripe('stripe-ent', {
      ...minimalStripeFields,
      stripe_id: 'stripe-ent',
      enterprise_id: 'ent-a',
    })
    const out = stripe.toFirestore()
    expect(out.enterprise_id).toBe('ent-a')
  })

  it('Firestore の enterprise_id: null を読み取れる', () => {
    const stripe = new EventStripe('stripe-pf', {
      ...minimalStripeFields,
      enterprise_id: null,
    })
    expect(stripe.enterprise_id).toBeNull()
  })
})
