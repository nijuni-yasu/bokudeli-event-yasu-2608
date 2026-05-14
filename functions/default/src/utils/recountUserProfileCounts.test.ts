import { describe, expect, it, vi, beforeEach } from 'vitest'

const getUsersByUserIdsMock = vi.fn()
const countJoinedCommunitiesForUserMock = vi.fn()
const countManagedCommunitiesForUserMock = vi.fn()
const countParticipatedEventsForUserMock = vi.fn()
const aggregationCountGetMock = vi.fn()

vi.mock('../stores/community.js', () => ({
  countJoinedCommunitiesForUser: (...args: unknown[]) => countJoinedCommunitiesForUserMock(...args),
  countManagedCommunitiesForUser: (...args: unknown[]) => countManagedCommunitiesForUserMock(...args),
}))

vi.mock('../stores/memberOrder.js', () => ({
  countParticipatedEventsForUser: (...args: unknown[]) => countParticipatedEventsForUserMock(...args),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: () => ({
      doc: () => ({
        collection: () => ({
          get: () => Promise.resolve({ docs: [] }),
        }),
      }),
    }),
    collectionGroup: () => ({
      where: vi.fn().mockReturnThis(),
      count: () => ({
        get: () => aggregationCountGetMock(),
      }),
    }),
  }),
}))

vi.mock('../stores/user.js', () => ({
  getUsersByUserIds: (...args: unknown[]) => getUsersByUserIdsMock(...args),
  getUser: vi.fn(),
  getUserRef: vi.fn(() => 'mockUserRef'),
  updateUserProfileCounts: vi.fn(),
}))

import { computeActiveFriendCount, computeUserProfileCounts } from './recountUserProfileCounts.js'

beforeEach(() => {
  getUsersByUserIdsMock.mockReset()
  countJoinedCommunitiesForUserMock.mockReset()
  countManagedCommunitiesForUserMock.mockReset()
  countParticipatedEventsForUserMock.mockReset()
  aggregationCountGetMock.mockReset()
  countParticipatedEventsForUserMock.mockResolvedValue(5)
  aggregationCountGetMock.mockResolvedValue({ data: () => ({ count: 4 }) })
})

describe('computeActiveFriendCount', () => {
  it('空配列のときは 0 を返す（getUsersByUserIds は呼ばれない）', async () => {
    const result = await computeActiveFriendCount([])
    expect(result).toBe(0)
    expect(getUsersByUserIdsMock).not.toHaveBeenCalled()
  })

  it('退会済みユーザーは除外する（getUserFriends と同じルール）', async () => {
    getUsersByUserIdsMock.mockResolvedValueOnce(
      new Map([
        ['u1', { is_deleted: false }],
        ['u2', { is_deleted: true }],
        ['u3', { is_deleted: false }],
      ]),
    )
    const result = await computeActiveFriendCount(['u1', 'u2', 'u3'])
    expect(result).toBe(2)
  })

  it('ユーザードキュメントが存在しない場合は除外する', async () => {
    getUsersByUserIdsMock.mockResolvedValueOnce(
      new Map([
        ['u1', { is_deleted: false }],
        // u2 は users コレクションに存在しない
      ]),
    )
    const result = await computeActiveFriendCount(['u1', 'u2'])
    expect(result).toBe(1)
  })

  it('全員退会していたら 0 を返す', async () => {
    getUsersByUserIdsMock.mockResolvedValueOnce(
      new Map([
        ['u1', { is_deleted: true }],
        ['u2', { is_deleted: true }],
      ]),
    )
    const result = await computeActiveFriendCount(['u1', 'u2'])
    expect(result).toBe(0)
  })
})

describe('computeUserProfileCounts', () => {
  it('participated は memberOrder、joined/managed は community store を使う（RC-55/57）', async () => {
    countJoinedCommunitiesForUserMock.mockResolvedValue(7)
    countManagedCommunitiesForUserMock.mockResolvedValue(2)

    const result = await computeUserProfileCounts('uid-x')

    expect(result.joined_community_count).toBe(7)
    expect(result.managed_community_count).toBe(2)
    expect(result.participated_event_count).toBe(5)
    expect(result.ordered_food_count).toBe(4)
    expect(countParticipatedEventsForUserMock).toHaveBeenCalledWith('uid-x')
    expect(countJoinedCommunitiesForUserMock).toHaveBeenCalledWith('uid-x')
    expect(countManagedCommunitiesForUserMock).toHaveBeenCalledWith('uid-x')
  })
})
