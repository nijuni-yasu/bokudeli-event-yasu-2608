import { describe, expect, it } from 'vitest'
import { Community } from './Community.js'
import { Event } from './Event.js'
import { EventMember, EventMemberOrder } from './EventMemberOrder.js'
import { User } from './User.js'
import {
  enterpriseCommunityFields,
  enterpriseEventMemberFields,
  enterpriseMemberOrderFields,
  enterpriseSubsidyEventFields,
  enterpriseUserFields,
  minimalPfCommunityFields,
  minimalPfEventFields,
  minimalMemberOrderFields,
  pfUserFields,
} from './partnerCompatTestDummyData.js'

describe('partner base形 parse 互換（PA-11e / C-5）', () => {
  it('PF 形 Event を parse できる', () => {
    const event = new Event('event-pf', minimalPfEventFields)
    expect(event.event_payment).toBe('user_advance')
    expect(event.enterprise_id).toBeNull()
  })

  it('enterprise_subsidy + optional 拡張付き Event を parse できる', () => {
    const event = new Event('event-ent', enterpriseSubsidyEventFields)
    expect(event.event_payment).toBe('enterprise_subsidy')
    expect(event.enterprise_id).toBe('ent-a')
  })

  it('Enterprise 形 Event が DbSchema を通る', () => {
    const event = new Event('event-ent', enterpriseSubsidyEventFields)
    expect(event.isValidForDatabase('user-1')).toBe(true)
    const out = event.toFirestore('user-1')
    expect(out.event_payment).toBe('enterprise_subsidy')
    expect(out.enterprise_id).toBe('ent-a')
  })

  it('PF / Enterprise 形 Community を parse できる', () => {
    const pf = new Community('community-pf', minimalPfCommunityFields)
    expect(pf.isValidForDatabase()).toBe(true)
    expect(pf.toFirestore().enterprise_id).toBeNull()

    const ent = new Community('community-ent', enterpriseCommunityFields)
    expect(ent.isValidForDatabase()).toBe(true)
    expect(ent.toFirestore().enterprise_id).toBe('ent-a')
  })

  it('PF / Enterprise 形 EventMemberOrder を parse できる', () => {
    const pf = new EventMemberOrder('order-pf', minimalMemberOrderFields)
    expect(pf.isValidForDatabase()).toBe(true)
    expect(pf.toFirestore().enterprise_id).toBeNull()
    expect(pf.toFirestore().pay_enterprise_subsidy_amount).toBeUndefined()

    const ent = new EventMemberOrder('order-ent', enterpriseMemberOrderFields)
    expect(ent.isValidForDatabase()).toBe(true)
    expect(ent.toFirestore().enterprise_id).toBe('ent-a')
    expect(ent.toFirestore().pay_enterprise_subsidy_amount).toBe(500)
  })

  it('PF / Enterprise 形 User を parse できる', () => {
    const pf = new User('user-pf', pfUserFields)
    expect(pf.user_name).toBe('PF User')
    expect(pf.enterprise_id).toBeUndefined()

    const ent = new User('user-ent', enterpriseUserFields)
    expect(ent.user_type).toBe('enterprise')
    expect(ent.enterprise_id).toBe('ent-a')
    expect(ent.isValidForDatabase()).toBe(true)
  })

  it('Enterprise 形 EventMember を parse できる', () => {
    const member = new EventMember('user-ent', enterpriseEventMemberFields)
    expect(member.enterprise_id).toBe('ent-a')
    expect(member.isValidForDatabase()).toBe(true)
  })
})
