import { describe, expect, it } from 'vitest'
import { ChatMembership } from './ChatMembership.js'

describe('ChatMembership toFirestore', () => {
  it('omits optional fields when they are undefined (first event participant)', () => {
    const now = Date.now()
    const membership = new ChatMembership('event_comm_evt', {
      room_id: 'event_comm_evt',
      room_type: 'event',
      is_active: true,
      unread_count: 0,
      last_message_at: now,
      last_message_preview: undefined,
      created_at: now,
      updated_at: now,
    })

    expect(membership.isValidForDatabase()).toBe(true)
    const firestore = membership.toFirestore()
    expect(firestore.room_id).toBe('event_comm_evt')
    expect(firestore.room_type).toBe('event')
    expect(firestore.last_message_at).toBeDefined()
    expect(firestore.last_message_preview).toBeUndefined()
    expect(firestore.last_read_at).toBeUndefined()
    expect('last_message_preview' in firestore).toBe(false)
    expect('last_read_at' in firestore).toBe(false)
  })

  it('includes last_message_preview when set', () => {
    const now = Date.now()
    const membership = new ChatMembership('event_comm_evt', {
      room_id: 'event_comm_evt',
      room_type: 'event',
      is_active: true,
      unread_count: 0,
      last_message_at: now,
      last_message_preview: 'こんにちは',
      created_at: now,
      updated_at: now,
    })

    const firestore = membership.toFirestore()
    expect(firestore.last_message_preview).toBe('こんにちは')
  })
})
