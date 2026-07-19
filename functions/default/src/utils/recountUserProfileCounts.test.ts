import { describe, expect, it, vi, beforeEach } from 'vitest'

const getUsersByUserIdsMock = vi.fn()
const countJoinedCommunitiesForUserMock = vi.fn()
const countManagedCommunitiesForUserMock = vi.fn()
const countParticipatedEventsForUserMock = vi.fn()
const countOrderedFoodsForUserMock = vi.fn()
const listFriendUserIdsMock = vi.fn()
const getEnterpriseMemberMock = vi.fn()

vi.mock('../stores/community.js', () => ({
  countJoinedCommunitiesForUser: (...args: unknown[]) => countJoinedCommunitiesForUserMock(...args),
  countManagedCommunitiesForUser: (...args: unknown[]) => countManagedCommunitiesForUserMock(...args),
}))

vi.mock('../stores/memberOrder.js', () => ({
  countParticipatedEventsForUser: (...args: unknown[]) => countParticipatedEventsForUserMock(...args),
  countOrderedFoodsForUser: (...args: unknown[]) => countOrderedFoodsForUserMock(...args),
}))

vi.mock('../stores/userFriend.js', () => ({
  listFriendUserIds: (...args: unknown[]) => listFriendUserIdsMock(...args),
}))

vi.mock('../stores/user.js', () => ({
  getUsersByUserIds: (...args: unknown[]) => getUsersByUserIdsMock(...args),
  getUser: vi.fn(),
  getUserRef: vi.fn(() => 'mockUserRef'),
  updateUserProfileCounts: vi.fn(),
}))

vi.mock('../stores/enterprise.js', () => ({
  getEnterpriseMember: (...args: unknown[]) => getEnterpriseMemberMock(...args),
}))

import { computeActiveFriendCount, computeUserProfileCounts } from './recountUserProfileCounts.js'

beforeEach(() => {
  getUsersByUserIdsMock.mockReset()
  countJoinedCommunitiesForUserMock.mockReset()
  countManagedCommunitiesForUserMock.mockReset()
  countParticipatedEventsForUserMock.mockReset()
  countOrderedFoodsForUserMock.mockReset()
  listFriendUserIdsMock.mockReset()
  getEnterpriseMemberMock.mockReset()
  countParticipatedEventsForUserMock.mockResolvedValue(5)
  countOrderedFoodsForUserMock.mockResolvedValue(4)
  listFriendUserIdsMock.mockResolvedValue([])
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

  it('enterpriseId 指定時は他社友人を除外しゲストを含める', async () => {
    getUsersByUserIdsMock.mockResolvedValueOnce(
      new Map([
        ['other', { user_id: 'other', is_deleted: false, enterprise_id: 'other-eid' }],
        ['guest', { user_id: 'guest', is_deleted: false, enterprise_id: null }],
        ['colleague', { user_id: 'colleague', is_deleted: false, enterprise_id: 'my-eid' }],
      ]),
    )
    getEnterpriseMemberMock.mockResolvedValue({ is_active: true })

    const result = await computeActiveFriendCount(['other', 'guest', 'colleague'], { enterpriseId: 'my-eid' })
    expect(result).toBe(2)
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
    expect(countParticipatedEventsForUserMock).toHaveBeenCalledWith('uid-x', undefined)
    expect(countOrderedFoodsForUserMock).toHaveBeenCalledWith('uid-x', undefined)
    expect(listFriendUserIdsMock).toHaveBeenCalledWith('uid-x')
    expect(countJoinedCommunitiesForUserMock).toHaveBeenCalledWith('uid-x', undefined)
    expect(countManagedCommunitiesForUserMock).toHaveBeenCalledWith('uid-x', undefined)
  })

  it('enterpriseId を各 store 集計に渡す', async () => {
    countJoinedCommunitiesForUserMock.mockResolvedValue(1)
    countManagedCommunitiesForUserMock.mockResolvedValue(0)
    countParticipatedEventsForUserMock.mockResolvedValue(2)
    countOrderedFoodsForUserMock.mockResolvedValue(3)
    listFriendUserIdsMock.mockResolvedValue(['f1'])
    getUsersByUserIdsMock.mockResolvedValue(
      new Map([['f1', { user_id: 'f1', is_deleted: false, enterprise_id: 'my-eid' }]]),
    )
    getEnterpriseMemberMock.mockResolvedValue({ is_active: true })

    const result = await computeUserProfileCounts('uid-x', { enterpriseId: 'my-eid' })

    expect(result.friend_count).toBe(1)
    expect(countParticipatedEventsForUserMock).toHaveBeenCalledWith('uid-x', 'my-eid')
    expect(countOrderedFoodsForUserMock).toHaveBeenCalledWith('uid-x', 'my-eid')
    expect(countJoinedCommunitiesForUserMock).toHaveBeenCalledWith('uid-x', 'my-eid')
    expect(countManagedCommunitiesForUserMock).toHaveBeenCalledWith('uid-x', 'my-eid')
  })
})
