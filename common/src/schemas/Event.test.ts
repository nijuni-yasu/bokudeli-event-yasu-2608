import { describe, expect, it } from 'vitest'
import { Event, convertEventToDb } from './Event.js'
import { getDeleteFieldValue } from './firebase/index.js'
import { minimalPfEventFields } from './partnerCompatTestDummyData.js'

const minimalEventFields = {
  community_id: 'community-1',
  community_name: 'Test Community',
  community_account: 'test-account',
  created_by: 'user-1',
}

describe('Event members_visible_min_count', () => {
  it('toFirestore で正の整数を保存できる', () => {
    const event = new Event('event-1', {
      ...minimalPfEventFields,
      members_visible_min_count: 3,
    })
    const out = event.toFirestore('user-1')
    expect(out.members_visible_min_count).toBe(3)
  })

  it('未設定時 toFirestore で deleteField になる', () => {
    const event = new Event('event-1', minimalPfEventFields)
    const out = event.toFirestore('user-1')
    expect(out.members_visible_min_count).toEqual(getDeleteFieldValue())
  })

  it('Firestore から members_visible_min_count を読み取れる', () => {
    const event = new Event('event-1', {
      ...minimalEventFields,
      members_visible_min_count: 5,
    })
    expect(event.members_visible_min_count).toBe(5)
  })
})

describe('Event enterprise_id', () => {
  it('convertEventToDb で enterprise_id 未設定時は null を明示する', () => {
    const event = new Event('event-1', minimalEventFields)
    const db = convertEventToDb(event, 'user-1')
    expect(db.enterprise_id).toBeNull()
  })

  it('convertEventToDb で enterprise_id string はそのまま保持する', () => {
    const event = new Event('event-1', {
      ...minimalEventFields,
      enterprise_id: 'ent-a',
    })
    const db = convertEventToDb(event, 'user-1')
    expect(db.enterprise_id).toBe('ent-a')
  })

  it('Firestore の enterprise_id: null を読み取れる', () => {
    const event = new Event('event-1', {
      ...minimalEventFields,
      enterprise_id: null,
    })
    expect(event.enterprise_id).toBeNull()
  })
})
