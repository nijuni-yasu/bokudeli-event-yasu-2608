import { describe, expect, it } from 'vitest'
import { EventMember, EventMemberOrder } from './EventMemberOrder.js'
import { minimalMemberOrderFields } from './partnerCompatTestDummyData.js'

describe('EventMemberOrder enterprise_id', () => {
  it('toFirestore で enterprise_id 未設定時は null を明示保存する', () => {
    const order = new EventMemberOrder('order-pf', minimalMemberOrderFields)
    expect(order.isValidForDatabase()).toBe(true)
    const out = order.toFirestore()
    expect(out.enterprise_id).toBeNull()
  })

  it('toFirestore で enterprise_id string はそのまま保存する', () => {
    const order = new EventMemberOrder('order-ent', {
      ...minimalMemberOrderFields,
      enterprise_id: 'ent-a',
    })
    const out = order.toFirestore()
    expect(out.enterprise_id).toBe('ent-a')
  })

  it('Firestore の enterprise_id: null を読み取れる', () => {
    const order = new EventMemberOrder('order-pf', {
      ...minimalMemberOrderFields,
      enterprise_id: null,
    })
    expect(order.enterprise_id).toBeNull()
  })
})

describe('EventMember enterprise_id', () => {
  it('toFirestore で enterprise_id 未設定時は null を明示保存する', () => {
    const member = new EventMember('user-pf', {
      user_id: 'user-pf',
      event_id: 'event-1',
      community_id: 'community-1',
    })
    expect(member.isValidForDatabase()).toBe(true)
    const out = member.toFirestore()
    expect(out.enterprise_id).toBeNull()
  })

  it('toFirestore で enterprise_id string はそのまま保存する', () => {
    const member = new EventMember('user-ent', {
      user_id: 'user-ent',
      event_id: 'event-1',
      community_id: 'community-1',
      enterprise_id: 'ent-a',
    })
    const out = member.toFirestore()
    expect(out.enterprise_id).toBe('ent-a')
  })
})
