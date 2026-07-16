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

  it('page 末尾が不正でも sentinel doc を返却し nextCursor を組み立てる（RC-4）', async () => {
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

    expect(result.friends).toEqual([
      {
        id: 'friend2',
        meet_count: 9,
        first_met_at: 1100,
        last_met_at: 2100,
      },
    ])
    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toEqual({
      value: 9,
      friend_user_id: 'friend2',
    })
  })

  it('page に有効行があるとき sentinel は返却に含めない（RC-4）', async () => {
    friendsGetMock.mockResolvedValueOnce({
      docs: [
        makeDoc('friend1', {
          meet_count: 10,
          first_met_at: { toMillis: () => 1000 },
          last_met_at: { toMillis: () => 2000 },
        }),
        makeDoc('invalid', {
          first_met_at: { toMillis: () => 900 },
          last_met_at: { toMillis: () => 1900 },
        }),
        makeDoc('friend3', {
          meet_count: 8,
          first_met_at: { toMillis: () => 800 },
          last_met_at: { toMillis: () => 1800 },
        }),
      ],
    })

    const result = await listUserFriends('owner', 'meet_count', 2)

    expect(result.friends).toHaveLength(1)
    expect(result.friends[0].id).toBe('friend1')
    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toEqual({
      value: 10,
      friend_user_id: 'friend1',
    })
  })

  it('page と sentinel がともに不正でも skip cursor でスキャンを進める（RC-7）', async () => {
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
    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toEqual({
      value: 0,
      friend_user_id: 'invalid2',
      sort_value_null: true,
    })
  })

  it('skip cursor で次ページの有効友人を取得する（RC-7）', async () => {
    friendsGetMock
      .mockResolvedValueOnce({
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
      .mockResolvedValueOnce({
        docs: [
          makeDoc('valid', {
            meet_count: 5,
            first_met_at: { toMillis: () => 800 },
            last_met_at: { toMillis: () => 1800 },
          }),
        ],
      })

    const firstPage = await listUserFriends('owner', 'meet_count', 1)
    expect(firstPage.nextCursor).toEqual({
      value: 0,
      friend_user_id: 'invalid2',
      sort_value_null: true,
    })

    const secondPage = await listUserFriends('owner', 'meet_count', 1, firstPage.nextCursor ?? undefined)

    expect(queryChain.startAfter).toHaveBeenCalledWith(null, 'invalid2')
    expect(secondPage.friends).toEqual([
      {
        id: 'valid',
        meet_count: 5,
        first_met_at: 800,
        last_met_at: 1800,
      },
    ])
    expect(secondPage.hasMore).toBe(false)
  })

  it('last_met_at ソートで page+sentinel が不正のとき sort_value_null skip cursor（RC-7）', async () => {
    friendsGetMock.mockResolvedValueOnce({
      docs: [
        makeDoc('invalid1', {
          meet_count: 1,
          first_met_at: { toMillis: () => 1000 },
        }),
        makeDoc('invalid2', {
          meet_count: 2,
          first_met_at: { toMillis: () => 900 },
        }),
      ],
    })

    const result = await listUserFriends('owner', 'last_met_at', 1)

    expect(result.friends).toHaveLength(0)
    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toEqual({
      value: 0,
      friend_user_id: 'invalid2',
      sort_value_null: true,
    })
    expect(queryChain.orderBy).toHaveBeenCalledWith('last_met_at', 'desc')
  })

  it('last_met_at ソートで skip cursor 適用時は startAfter(null, id) を使う（RC-7）', async () => {
    friendsGetMock
      .mockResolvedValueOnce({
        docs: [
          makeDoc('invalid1', {
            meet_count: 1,
            first_met_at: { toMillis: () => 1000 },
          }),
          makeDoc('invalid2', {
            meet_count: 2,
            first_met_at: { toMillis: () => 900 },
          }),
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          makeDoc('valid', {
            meet_count: 1,
            first_met_at: { toMillis: () => 800 },
            last_met_at: { toMillis: () => 5000 },
          }),
        ],
      })

    const firstPage = await listUserFriends('owner', 'last_met_at', 1)
    const secondPage = await listUserFriends('owner', 'last_met_at', 1, firstPage.nextCursor ?? undefined)

    expect(queryChain.startAfter).toHaveBeenLastCalledWith(null, 'invalid2')
    expect(secondPage.friends).toEqual([
      {
        id: 'valid',
        meet_count: 1,
        first_met_at: 800,
        last_met_at: 5000,
      },
    ])
    expect(secondPage.hasMore).toBe(false)
  })

  it('page 全不正で sentinel を friends に含め継続 cursor を返す（RC-4 / RC-11 tradeoff）', async () => {
    friendsGetMock.mockResolvedValueOnce({
      docs: [
        makeDoc('invalid', {
          first_met_at: { toMillis: () => 1000 },
          last_met_at: { toMillis: () => 2000 },
        }),
        makeDoc('validLast', {
          meet_count: 3,
          first_met_at: { toMillis: () => 900 },
          last_met_at: { toMillis: () => 1900 },
        }),
      ],
    })

    const result = await listUserFriends('owner', 'meet_count', 1)

    expect(result.friends).toEqual([
      {
        id: 'validLast',
        meet_count: 3,
        first_met_at: 900,
        last_met_at: 1900,
      },
    ])
    // limit+1 取得では sentinel 存在時 firestoreHasMore=true のため継続 cursor を返す（末尾空 fetch は許容）
    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toEqual({
      value: 3,
      friend_user_id: 'validLast',
    })
  })
})
