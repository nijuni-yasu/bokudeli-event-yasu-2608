import { describe, expect, it } from 'vitest'
import { Event } from './Event.js'
import {
  EnterpriseEventWriteAppSchema,
  EventWriteAppSchema,
  PfEventWriteAppSchema,
  assertEnterpriseEventDraftStrict,
  parseEventWrite,
  writeToEvent,
} from './eventWrite.js'
import { enterpriseSubsidyEventFields, minimalPfEventFields } from './partnerCompatTestDummyData.js'

const UPDATE_USER = 'user-1'
const PF_EVENT_ID = 'event-pf'
const ENT_EVENT_ID = 'event-ent'

describe('G1-2 enterprise write strict', () => {
  it('enterprise_id 欠落を reject', () => {
    const result = EnterpriseEventWriteAppSchema.safeParse(omitKeys(enterpriseSubsidyEventFields, 'enterprise_id'))
    expect(result.success).toBe(false)
  })
})

describe('G1-4 pf write strict', () => {
  it('PfEventWriteAppSchema が enterprise_subsidy を reject', () => {
    const result = PfEventWriteAppSchema.safeParse({
      ...minimalPfEventFields,
      event_payment: 'enterprise_subsidy',
    })
    expect(result.success).toBe(false)
  })

  it('EventWriteAppSchema union が enterprise_subsidy を reject', () => {
    const result = EventWriteAppSchema.safeParse({
      ...minimalPfEventFields,
      event_payment: 'enterprise_subsidy',
    })
    expect(result.success).toBe(false)
  })

  it('PfEventWriteAppSchema が enterprise_id string を reject', () => {
    const result = PfEventWriteAppSchema.safeParse({
      ...minimalPfEventFields,
      enterprise_id: 'ent-a',
    })
    expect(result.success).toBe(false)
  })

  it('PfEventWriteAppSchema が members_visible_min_count 正の整数を受理', () => {
    const result = PfEventWriteAppSchema.safeParse({
      ...minimalPfEventFields,
      members_visible_min_count: 3,
    })
    expect(result.success).toBe(true)
  })

  it('PfEventWriteAppSchema が members_visible_min_count 0 を reject', () => {
    const result = PfEventWriteAppSchema.safeParse({
      ...minimalPfEventFields,
      members_visible_min_count: 0,
    })
    expect(result.success).toBe(false)
  })
})

describe('G1-5 write toFirestore golden', () => {
  it('PF fixture: write union → Event → toFirestore が直構築と一致', () => {
    const golden = new Event(PF_EVENT_ID, minimalPfEventFields).toFirestore(UPDATE_USER)
    const parsed = parseEventWrite(minimalPfEventFields)
    const fromWrite = writeToEvent(PF_EVENT_ID, parsed).toFirestore(UPDATE_USER)
    expectFirestoreEqualIgnoringUpdatedAt(fromWrite, golden)
  })

  it('Enterprise fixture: write union → Event → toFirestore が直構築と一致', () => {
    const golden = new Event(ENT_EVENT_ID, enterpriseSubsidyEventFields).toFirestore(UPDATE_USER)
    const parsed = parseEventWrite(enterpriseSubsidyEventFields)
    const fromWrite = writeToEvent(ENT_EVENT_ID, parsed).toFirestore(UPDATE_USER)
    expectFirestoreEqualIgnoringUpdatedAt(fromWrite, golden)
  })
})

describe('assertEnterpriseEventDraftStrict', () => {
  it('enterprise_subsidy + enterprise_id を受理', () => {
    const event = new Event(ENT_EVENT_ID, enterpriseSubsidyEventFields)
    expect(() => assertEnterpriseEventDraftStrict(event)).not.toThrow()
  })

  it('enterprise_id 欠落を reject', () => {
    const event = new Event(ENT_EVENT_ID, omitKeys(enterpriseSubsidyEventFields, 'enterprise_id'))
    expect(() => assertEnterpriseEventDraftStrict(event)).toThrow()
  })
})

describe('G1-7 enterprise_id null materialize', () => {
  it('PF write → toFirestore で enterprise_id が null', () => {
    const parsed = parseEventWrite(minimalPfEventFields)
    const out = writeToEvent(PF_EVENT_ID, parsed).toFirestore(UPDATE_USER)
    expect(out.enterprise_id).toBeNull()
  })
})

function expectFirestoreEqualIgnoringUpdatedAt(actual: Record<string, unknown>, expected: Record<string, unknown>) {
  const { updated_at, ...actualRest } = actual
  const { updated_at: expectedUpdatedAt, ...expectedRest } = expected
  expect(actualRest).toEqual(expectedRest)
  expect(updated_at).toBeDefined()
  expect(expectedUpdatedAt).toBeDefined()
}

function omitKeys<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K> {
  const copy = { ...obj }
  for (const key of keys) {
    delete copy[key]
  }
  return copy
}
