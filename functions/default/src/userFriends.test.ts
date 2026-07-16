import { describe, expect, it, vi } from 'vitest'

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(
      public code: string,
      message: string,
    ) {
      super(message)
    }
  },
  onCall: () => () => undefined,
}))

vi.mock('./stores/config.js', () => ({ getConfigGlobal: vi.fn() }))
vi.mock('./stores/user.js', () => ({ getUser: vi.fn() }))
vi.mock('./utils/friendsService.js', () => ({ runBackfill: vi.fn() }))
vi.mock('./utils/userFriendsResolver.js', () => ({
  resolveUserFriendsList: vi.fn(),
  resolveUserFriendMeetLog: vi.fn(),
}))

import { decodeUserFriendsListCursor, encodeUserFriendsListCursor } from './userFriends.js'

describe('userFriends cursor encode/decode', () => {
  it('通常 cursor を往復できる', () => {
    const cursor = { value: 42, friend_user_id: 'friend1' }
    const encoded = encodeUserFriendsListCursor(cursor)
    expect(encoded).not.toBeNull()
    expect(decodeUserFriendsListCursor(encoded)).toEqual(cursor)
  })

  it('sort_value_null 付き skip cursor を往復できる', () => {
    const cursor = { value: 0, friend_user_id: 'invalid2', sort_value_null: true as const }
    const encoded = encodeUserFriendsListCursor(cursor)
    expect(encoded).not.toBeNull()
    expect(decodeUserFriendsListCursor(encoded)).toEqual(cursor)
  })

  it('null / 空文字は undefined を返す', () => {
    expect(decodeUserFriendsListCursor(null)).toBeUndefined()
    expect(decodeUserFriendsListCursor('')).toBeUndefined()
    expect(encodeUserFriendsListCursor(null)).toBeNull()
  })
})
