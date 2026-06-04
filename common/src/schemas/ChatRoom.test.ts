import { describe, expect, it } from 'vitest'
import {
  buildCommunityChatRoomId,
  buildDirectChatRoomId,
  buildEventChatRoomId,
  parseCommunityChatRoomId,
  parseDirectChatRoomId,
  parseEventChatRoomId,
} from './ChatRoom.js'

describe('ChatRoom roomId builders and parsers', () => {
  it('buildEventChatRoomId and parseEventChatRoomId round-trip', () => {
    const communityId = 'abc123'
    const eventId = 'evt456'
    const roomId = buildEventChatRoomId(communityId, eventId)
    expect(roomId).toBe('event_abc123_evt456')
    expect(parseEventChatRoomId(roomId)).toEqual({ communityId, eventId })
  })

  it('parseEventChatRoomId returns null for invalid roomId', () => {
    expect(parseEventChatRoomId('community_abc')).toBeNull()
    expect(parseEventChatRoomId('event_onlyonepart')).toBeNull()
    expect(parseEventChatRoomId('event__evt')).toBeNull()
    expect(parseEventChatRoomId('')).toBeNull()
  })

  it('buildCommunityChatRoomId and parseCommunityChatRoomId round-trip', () => {
    const communityId = 'comm789'
    const roomId = buildCommunityChatRoomId(communityId)
    expect(roomId).toBe('community_comm789')
    expect(parseCommunityChatRoomId(roomId)).toEqual({ communityId })
  })

  it('parseCommunityChatRoomId returns null for invalid roomId', () => {
    expect(parseCommunityChatRoomId('event_a_b')).toBeNull()
    expect(parseCommunityChatRoomId('community_')).toBeNull()
  })

  it('buildDirectChatRoomId and parseDirectChatRoomId round-trip', () => {
    const uidA = 'userA'
    const uidB = 'userB'
    const roomId = buildDirectChatRoomId(uidA, uidB)
    expect(roomId).toBe('userA_userB')
    expect(parseDirectChatRoomId(roomId, uidA)).toBe(uidB)
    expect(parseDirectChatRoomId(roomId, uidB)).toBe(uidA)
  })

  it('parseDirectChatRoomId returns null when current user is not a member', () => {
    const roomId = buildDirectChatRoomId('userA', 'userB')
    expect(parseDirectChatRoomId(roomId, 'userC')).toBeNull()
    expect(parseDirectChatRoomId('userA_userB_userC', 'userA')).toBeNull()
  })
})
