import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { describe, expect, it } from 'vitest'
import { CHAT_UNREAD_COUNT_MAX, ChatMembership } from '@shokujii/common/schemas/ChatMembership.js'
import {
  buildMembershipLastMessageUpdatePatch,
  createEventChatMembership,
  incrementMembershipUnread,
  shouldIncrementMembershipUnread,
  updateMembershipLastMessage,
} from './chatMembership.js'

describe('chatMembership store', () => {
  it('createEventChatMembership does not require title', () => {
    const membership = createEventChatMembership({
      roomId: 'kR3mX9pL2nQ8',
      communityId: 'comm',
      eventId: 'evt',
      isActive: true,
    })
    expect(membership.room_type).toBe('event')
    expect(membership.community_id).toBe('comm')
    expect(membership.event_id).toBe('evt')
    expect(membership.is_active).toBe(true)
    expect('title' in membership).toBe(false)
    expect(membership.toFirestore()).not.toHaveProperty('title')
  })

  it('createEventChatMembership inherits last message preview from existing room', () => {
    const membership = createEventChatMembership({
      roomId: 'kR3mX9pL2nQ8',
      communityId: 'comm',
      eventId: 'evt',
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
      roomId: 'kR3mX9pL2nQ8',
      communityId: 'comm',
      eventId: 'evt',
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

  it('shouldIncrementMembershipUnread skips when last_read_at is at or after message time', () => {
    expect(
      shouldIncrementMembershipUnread({
        messageType: 'user',
        shouldApplyLastMessage: true,
        memberUserId: 'receiver1',
        senderUserId: 'sender1',
        membershipLastMessageAt: 4000,
        lastReadAt: 5000,
        lastMessageAt: 5000,
      }),
    ).toBe(false)
    expect(
      shouldIncrementMembershipUnread({
        messageType: 'user',
        shouldApplyLastMessage: true,
        memberUserId: 'receiver1',
        senderUserId: 'sender1',
        membershipLastMessageAt: 4000,
        lastReadAt: 6000,
        lastMessageAt: 5000,
      }),
    ).toBe(false)
  })

  it('shouldIncrementMembershipUnread increments when last_read_at is before message time', () => {
    expect(
      shouldIncrementMembershipUnread({
        messageType: 'user',
        shouldApplyLastMessage: true,
        memberUserId: 'receiver1',
        senderUserId: 'sender1',
        membershipLastMessageAt: 4000,
        lastReadAt: 4000,
        lastMessageAt: 5000,
      }),
    ).toBe(true)
  })

  it('shouldIncrementMembershipUnread increments when last_read_at is unset', () => {
    expect(
      shouldIncrementMembershipUnread({
        messageType: 'user',
        shouldApplyLastMessage: true,
        memberUserId: 'receiver1',
        senderUserId: 'sender1',
        membershipLastMessageAt: undefined,
        lastReadAt: undefined,
        lastMessageAt: 5000,
      }),
    ).toBe(true)
  })

  it('shouldIncrementMembershipUnread increments on retry when membership is not yet updated (RC-129)', () => {
    expect(
      shouldIncrementMembershipUnread({
        messageType: 'user',
        shouldApplyLastMessage: true,
        memberUserId: 'receiver1',
        senderUserId: 'sender1',
        membershipLastMessageAt: 4000,
        lastReadAt: undefined,
        lastMessageAt: 5000,
      }),
    ).toBe(true)
  })

  it('shouldIncrementMembershipUnread skips when membership already reflects message (retry after success)', () => {
    expect(
      shouldIncrementMembershipUnread({
        messageType: 'user',
        shouldApplyLastMessage: true,
        memberUserId: 'receiver1',
        senderUserId: 'sender1',
        membershipLastMessageAt: 5000,
        lastReadAt: undefined,
        lastMessageAt: 5000,
      }),
    ).toBe(false)
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

  describe('buildMembershipLastMessageUpdatePatch', () => {
    const baseMembership = new ChatMembership('room1', {
      room_id: 'room1',
      room_type: 'event',
      unread_count: 2,
      last_message_at: 4000,
      created_at: Date.now(),
      updated_at: Date.now(),
    })

    it('includes FieldValue.increment when receiver should increment unread', () => {
      const patch = buildMembershipLastMessageUpdatePatch({
        membership: baseMembership,
        preview: 'hello',
        lastMessageAt: 5000,
        messageType: 'user',
        shouldApplyLastMessage: true,
        memberUserId: 'receiver1',
        senderUserId: 'sender1',
      })
      expect(patch).not.toBeNull()
      expect(patch?.last_message_preview).toBe('hello')
      expect(patch?.last_message_at).toBeInstanceOf(Timestamp)
      expect(patch?.last_message_at.toMillis()).toBe(5000)
      expect(patch?.unread_count).toEqual(FieldValue.increment(1))
    })

    it('omits unread_count increment for sender', () => {
      const patch = buildMembershipLastMessageUpdatePatch({
        membership: baseMembership,
        preview: 'hello',
        lastMessageAt: 5000,
        messageType: 'user',
        shouldApplyLastMessage: true,
        memberUserId: 'sender1',
        senderUserId: 'sender1',
      })
      expect(patch?.unread_count).toBeUndefined()
    })

    it('omits unread_count increment when unread_count is already at max', () => {
      const membership = new ChatMembership('room1', {
        room_id: 'room1',
        room_type: 'event',
        unread_count: CHAT_UNREAD_COUNT_MAX,
        last_message_at: 4000,
        created_at: Date.now(),
        updated_at: Date.now(),
      })
      const patch = buildMembershipLastMessageUpdatePatch({
        membership,
        preview: 'hello',
        lastMessageAt: 5000,
        messageType: 'user',
        shouldApplyLastMessage: true,
        memberUserId: 'receiver1',
        senderUserId: 'sender1',
      })
      expect(patch?.unread_count).toBeUndefined()
    })

    it('returns null when lastMessageAt is older than membership last_message_at', () => {
      const patch = buildMembershipLastMessageUpdatePatch({
        membership: baseMembership,
        preview: 'old',
        lastMessageAt: 1000,
        messageType: 'user',
        shouldApplyLastMessage: true,
        memberUserId: 'receiver1',
        senderUserId: 'sender1',
      })
      expect(patch).toBeNull()
    })
  })
})
