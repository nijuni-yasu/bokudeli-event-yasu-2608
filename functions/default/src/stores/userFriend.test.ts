import { describe, expect, it, vi, beforeEach } from 'vitest'

const friendsGetMock = vi.fn()
const selectMock = vi.fn()

const queryChain = {
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  get: friendsGetMock,
}

queryChain.orderBy.mockReturnValue(queryChain)
queryChain.limit.mockReturnValue(queryChain)
queryChain.startAfter.mockReturnValue(queryChain)

const friendsCollectionMock = {
  select: vi.fn((...fields: string[]) => {
    selectMock(...fields)
    return queryChain
  }),
}

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: () => ({
      doc: () => ({
        collection: () => friendsCollectionMock,
      }),
    }),
  }),
  Timestamp: {
    fromMillis: (ms: number) => ({ toMillis: () => ms }),
  },
  FieldPath: {
    documentId: () => '__name__',
  },
}))

vi.mock('../utils/logger.js', () => ({
  createModuleLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}))

import { listUserFriends } from './userFriend.js'

const makeDoc = (id: string, data: Record<string, unknown>) => ({
  id,
  data: () => data,
})

beforeEach(() => {
  friendsGetMock.mockReset()
  selectMock.mockReset()
  queryChain.orderBy.mockClear()
  queryChain.limit.mockClear()
  queryChain.startAfter.mockClear()
  friendsCollectionMock.select.mockClear()
})

describe('listUserFriends', () => {
  it('select で meet_count / first_met_at / last_met_at のみ取得する', async () => {
    friendsGetMock.mockResolvedValueOnce({
      docs: [
        makeDoc('friend1', {
          meet_count: 3,
          first_met_at: { toMillis: () => 1000 },
          last_met_at: { toMillis: () => 3000 },
        }),
      ],
    })

    const result = await listUserFriends('owner', 'meet_count', 10)

    expect(selectMock).toHaveBeenCalledWith('meet_count', 'first_met_at', 'last_met_at')
    expect(result.friends).toEqual([
      {
        id: 'friend1',
        meet_count: 3,
        first_met_at: 1000,
        last_met_at: 3000,
      },
    ])
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeNull()
  })

  it('meet_count ソートで nextCursor.value は number', async () => {
    friendsGetMock.mockResolvedValueOnce({
      docs: [
        makeDoc('friend1', {
          meet_count: 10,
          first_met_at: { toMillis: () => 1000 },
          last_met_at: { toMillis: () => 2000 },
        }),
        makeDoc('friend2', {
          meet_count: 9,
          first_met_at: { toMillis: () => 1100 },
          last_met_at: { toMillis: () => 2100 },
        }),
      ],
    })

    const result = await listUserFriends('owner', 'meet_count', 1)

    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toEqual({
      value: 10,
      friend_user_id: 'friend1',
    })
  })

  it('last_met_at ソートで nextCursor.value は millis', async () => {
    friendsGetMock.mockResolvedValueOnce({
      docs: [
        makeDoc('friend1', {
          meet_count: 2,
          first_met_at: { toMillis: () => 1000 },
          last_met_at: { toMillis: () => 5000 },
        }),
        makeDoc('friend2', {
          meet_count: 1,
          first_met_at: { toMillis: () => 2000 },
          last_met_at: { toMillis: () => 4000 },
        }),
      ],
    })

    const result = await listUserFriends('owner', 'last_met_at', 1)

    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toEqual({
      value: 5000,
      friend_user_id: 'friend1',
    })
    expect(queryChain.orderBy).toHaveBeenCalledWith('last_met_at', 'desc')
  })

  it('必須フィールド欠損の doc は除外する', async () => {
    friendsGetMock.mockResolvedValueOnce({
      docs: [
        makeDoc('invalid', {
          first_met_at: { toMillis: () => 1000 },
          last_met_at: { toMillis: () => 2000 },
        }),
        makeDoc('valid', {
          meet_count: 1,
          first_met_at: { toMillis: () => 1000 },
          last_met_at: { toMillis: () => 2000 },
        }),
      ],
    })

    const result = await listUserFriends('owner', 'meet_count', 10)

    expect(result.friends).toHaveLength(1)
    expect(result.friends[0].id).toBe('valid')
  })

  it('cursor 指定時は startAfter を使う', async () => {
    friendsGetMock.mockResolvedValueOnce({ docs: [] })

    await listUserFriends('owner', 'last_met_at', 10, {
      value: 3000,
      friend_user_id: 'friend-prev',
    })

    expect(queryChain.startAfter).toHaveBeenCalledWith({ toMillis: expect.any(Function) }, 'friend-prev')
  })

  it('page 末尾が不正でも sentinel doc から nextCursor を組み立てる（RC-1）', async () => {
    friendsGetMock.mockResolvedValueOnce({
      docs: [
        makeDoc('invalid', {
          first_met_at: { toMillis: () => 1000 },
          last_met_at: { toMillis: () => 2000 },
        }),
        makeDoc('friend2', {
          meet_count: 9,
          first_met_at: { toMillis: () => 1100 },
          last_met_at: { toMillis: () => 2100 },
        }),
      ],
    })

    const result = await listUserFriends('owner', 'meet_count', 1)

    expect(result.friends).toHaveLength(0)
    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toEqual({
      value: 9,
      friend_user_id: 'friend2',
    })
  })

  it('cursor を組み立てられないとき hasMore は false（RC-1）', async () => {
    friendsGetMock.mockResolvedValueOnce({
      docs: [
        makeDoc('invalid1', {
          first_met_at: { toMillis: () => 1000 },
          last_met_at: { toMillis: () => 2000 },
        }),
        makeDoc('invalid2', {
          first_met_at: { toMillis: () => 900 },
          last_met_at: { toMillis: () => 1900 },
        }),
      ],
    })

    const result = await listUserFriends('owner', 'meet_count', 1)

    expect(result.friends).toHaveLength(0)
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeNull()
  })
})
