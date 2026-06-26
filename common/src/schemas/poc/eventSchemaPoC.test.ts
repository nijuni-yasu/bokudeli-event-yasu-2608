import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { Event, EventDbSchema, convertEventToDb } from '../Event.js'
import { TimestampSchema } from '../firebase/index.js'
import { EventWriteExtendOnlySchemaB } from '../eventWrite.js'
import {
  EventDbSchemaVariantA,
  EventNestedWriteSchemaC,
  flattenNestedWriteToFlat,
  h1WriteToEvent,
} from './eventSchemaPoC.js'
import { enterpriseSubsidyEventFields, minimalPfEventFields } from '../partnerCompatTestDummyData.js'

const UPDATE_USER = 'user-1'
const PF_EVENT_ID = 'event-pf'
const ENT_EVENT_ID = 'event-ent'

describe('G1-1 partner compat baseline', () => {
  it('PF 形 fixture が現行 Event + EventDbSchema で parse 成功', () => {
    const event = new Event(PF_EVENT_ID, minimalPfEventFields)
    expect(event.isValidForDatabase(UPDATE_USER)).toBe(true)
    expect(EventDbSchema.safeParse(convertEventToDb(event, UPDATE_USER)).success).toBe(true)
  })

  it('enterprise_subsidy 形 fixture が現行 Event + EventDbSchema で parse 成功', () => {
    const event = new Event(ENT_EVENT_ID, enterpriseSubsidyEventFields)
    expect(event.isValidForDatabase(UPDATE_USER)).toBe(true)
    expect(EventDbSchema.safeParse(convertEventToDb(event, UPDATE_USER)).success).toBe(true)
  })
})

describe('G1-6 eventlog partial merge', () => {
  const partialLogFields = {
    updated_at: TimestampSchema.parse(Date.now()),
    updated_by: UPDATE_USER,
    event_name: 'partial update',
  }

  it('H1: 現行 EventDbSchema.partial merge が partial 差分を受理', () => {
    const schema = zEventLogDbSchemaH1()
    expect(schema.safeParse(partialLogFields).success).toBe(true)
  })

  it('A: enterprise 分支は subsidy 欠落の初回 Db parse を拒否（現行 DbSchema は pass）', () => {
    const raw = {
      ...convertEventToDb(new Event(ENT_EVENT_ID, enterpriseSubsidyEventFields), UPDATE_USER),
    }
    delete (raw as { enterprise_subsidy_settings?: unknown }).enterprise_subsidy_settings

    expect(EventDbSchema.safeParse(raw).success).toBe(true)
    expect(EventDbSchemaVariantA.safeParse(raw).success).toBe(false)
  })

  it('A: PF 分支は user_advance + enterprise_id string を拒否', () => {
    const dbDoc = {
      ...(new Event(PF_EVENT_ID, minimalPfEventFields).toFirestore(UPDATE_USER) as Record<string, unknown>),
      enterprise_id: 'ent-a',
    }
    expect(EventDbSchemaVariantA.safeParse(dbDoc).success).toBe(false)
  })

  it('A: discriminatedUnion は .partial() 非対応（EventLog 現行 merge パターンと非互換）', () => {
    expect(typeof (EventDbSchemaVariantA as { partial?: unknown }).partial).not.toBe('function')
  })
})

describe('approach B extend only', () => {
  it('enterprise_subsidy でも enterprise_id 省略が parse 成功（write strict 不可）', () => {
    const result = EventWriteExtendOnlySchemaB.safeParse(omitKeys(enterpriseSubsidyEventFields, 'enterprise_id'))
    expect(result.success).toBe(true)
  })
})

describe('approach C nest flatten', () => {
  it('PF nest → flatten → toFirestore が G1-5 golden と一致', () => {
    const nested = EventNestedWriteSchemaC.parse({
      ...minimalPfEventFields,
      event_payment: 'user_advance',
    })
    const flat = flattenNestedWriteToFlat(nested)
    const golden = new Event(PF_EVENT_ID, minimalPfEventFields).toFirestore(UPDATE_USER)
    expectFirestoreEqualIgnoringUpdatedAt(h1WriteToEvent(PF_EVENT_ID, flat).toFirestore(UPDATE_USER), golden)
  })

  it('Enterprise nest → flatten → toFirestore が G1-5 golden と一致', () => {
    const core = omitKeys(enterpriseSubsidyEventFields, 'enterprise_id', 'enterprise_subsidy_settings', 'event_payment')
    const nested = EventNestedWriteSchemaC.parse({
      ...core,
      event_payment: 'enterprise_subsidy',
      enterprise: {
        enterprise_id: enterpriseSubsidyEventFields.enterprise_id,
        enterprise_subsidy_settings: enterpriseSubsidyEventFields.enterprise_subsidy_settings,
      },
    })
    const flat = flattenNestedWriteToFlat(nested)
    const golden = new Event(ENT_EVENT_ID, enterpriseSubsidyEventFields).toFirestore(UPDATE_USER)
    expectFirestoreEqualIgnoringUpdatedAt(h1WriteToEvent(ENT_EVENT_ID, flat).toFirestore(UPDATE_USER), golden)
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

/** H1: EventLog.ts と同等の partial merge（import 循環回避のためテスト内定義） */
function zEventLogDbSchemaH1() {
  return z
    .object({
      updated_at: TimestampSchema,
      updated_by: z.string().nonempty(),
    })
    .merge(EventDbSchema.partial())
}
