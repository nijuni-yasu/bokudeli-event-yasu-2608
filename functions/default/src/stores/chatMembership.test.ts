import { describe, expect, it } from 'vitest'
import { ChatMembership } from '@shokujii/common/schemas/ChatMembership.js'
import { createEventChatMembership, incrementMembershipUnread, updateMembershipLastMessage } from './chatMembership.js'

describe('chatMembership store', () => {
  it('createEventChatMembership does not require title', () => {
    const membership = createEventChatMembership({
      roomId: 'event_comm_evt',
      isActive: true,
    })
    expect(membership.room_type).toBe('event')
    expect(membership.is_active).toBe(true)
    expect('title' in membership).toBe(false)
    expect(membership.toFirestore()).not.toHaveProperty('title')
  })

  it('createEventChatMembership inherits last message preview from existing room', () => {
    const membership = createEventChatMembership({
      roomId: 'event_comm_evt',
      isActive: true,
      lastMessageAt: 5000,
      lastMessagePreview: 'hello world',
    })
    expect(membership.last_message_at).toBe(5000)
    expect(membership.last_message_preview).toBe('hello world')
  })

  it('createEventChatMembership defaults last_message_at to now when omitted', () => {
    const before = Date.now()
    const membership = createEventChatMembership({
      roomId: 'event_comm_evt',
      isActive: false,
    })
    const after = Date.now()
    expect(membership.last_message_at).toBeGreaterThanOrEqual(before)
    expect(membership.last_message_at).toBeLessThanOrEqual(after)
  })

  it('sender receives last_message preview without unread increment (onChatMessageCreated behavior)', () => {
    const senderId = 'sender1'
    const membership = new ChatMembership('event_comm_evt', {
      room_id: 'event_comm_evt',
      room_type: 'event',
      unread_count: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    })

    const preview = 'hello'
    const lastMessageAt = Date.now()
    const memberUserId = senderId
    const senderUserId = senderId
    const shouldIncrementUnread = true

    let updated = updateMembershipLastMessage(membership, { preview, lastMessageAt })
    if (shouldIncrementUnread && memberUserId !== senderUserId) {
      updated = incrementMembershipUnread(updated)
    }

    expect(updated.last_message_preview).toBe(preview)
    expect(updated.last_message_at).toBe(lastMessageAt)
    expect(updated.unread_count).toBe(0)
  })

  it('non-sender receives last_message preview with unread increment', () => {
    const membership = new ChatMembership('event_comm_evt', {
      room_id: 'event_comm_evt',
      room_type: 'event',
      unread_count: 2,
      created_at: Date.now(),
      updated_at: Date.now(),
    })

    const preview = 'hello'
    const lastMessageAt = Date.now()
    const memberUserId = 'receiver1'
    const senderUserId = 'sender1'
    const shouldIncrementUnread = true

    let updated = updateMembershipLastMessage(membership, { preview, lastMessageAt })
    if (shouldIncrementUnread && memberUserId !== senderUserId) {
      updated = incrementMembershipUnread(updated)
    }

    expect(updated.last_message_preview).toBe(preview)
    expect(updated.unread_count).toBe(3)
  })

  it('updateMembershipLastMessage skips older lastMessageAt', () => {
    const membership = new ChatMembership('event_comm_evt', {
      room_id: 'event_comm_evt',
      room_type: 'event',
      last_message_at: 2000,
      created_at: Date.now(),
      updated_at: Date.now(),
    })

    const updated = updateMembershipLastMessage(membership, { preview: 'old', lastMessageAt: 1000 })
    expect(updated).toBeNull()
  })

  it('updateMembershipLastMessage allows older lastMessageAt when forced', () => {
    const membership = new ChatMembership('event_comm_evt', {
      room_id: 'event_comm_evt',
      room_type: 'event',
      last_message_at: 2000,
      created_at: Date.now(),
      updated_at: Date.now(),
    })

    const updated = updateMembershipLastMessage(membership, { preview: 'recalc', lastMessageAt: 1000 }, { force: true })
    expect(updated?.last_message_preview).toBe('recalc')
    expect(updated?.last_message_at).toBe(1000)
  })
})
