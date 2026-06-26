import { describe, expect, it } from 'vitest'
import { Event, convertEventToDb } from './Event.js'

const minimalEventFields = {
  community_id: 'community-1',
  community_name: 'Test Community',
  community_account: 'test-account',
  created_by: 'user-1',
}

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
