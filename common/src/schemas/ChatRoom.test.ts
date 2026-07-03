import { describe, expect, it } from 'vitest'
import { ChatRoom } from './ChatRoom.js'

describe('ChatRoom toFirestore', () => {
  it('omits optional fields when they are undefined (new event room)', () => {
    const now = Date.now()
    const room = new ChatRoom('kR3mX9pL2nQ8wZf3', {
      room_type: 'event',
      community_id: 'comm',
      event_id: 'evt',
      member_user_ids: ['user1'],
      is_active: true,
      created_at: now,
      updated_at: now,
    })

    expect(room.isValidForDatabase()).toBe(true)
    const firestore = room.toFirestore()
    expect(firestore.room_type).toBe('event')
    expect(firestore.community_id).toBe('comm')
    expect(firestore.event_id).toBe('evt')
    expect(firestore.last_message_at).toBeUndefined()
    expect(firestore.last_message_preview).toBeUndefined()
    expect('last_message_at' in firestore).toBe(false)
    expect('last_message_preview' in firestore).toBe(false)
    expect('title' in firestore).toBe(false)
  })

  it('uses opaque document id as room id', () => {
    const roomId = 'abc123XYZ789'
    const room = new ChatRoom(roomId, {
      room_type: 'event',
      community_id: 'comm1',
      event_id: 'evt1',
      member_user_ids: [],
      is_active: true,
    })
    expect(room.id).toBe(roomId)
  })
})
