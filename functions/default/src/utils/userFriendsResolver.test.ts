import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('../stores/userFriend.js', () => ({
  listUserFriends: vi.fn(),
  getUserFriend: vi.fn(),
}))

vi.mock('../stores/user.js', () => ({
  getUser: vi.fn(),
  getUsersByUserIds: vi.fn(),
}))

vi.mock('../stores/event.js', () => ({
  getCommunityEventKey: (communityId: string, eventId: string) => `${communityId}\t${eventId}`,
  getEventsInCommunities: vi.fn(),
}))

import { listUserFriends, getUserFriend } from '../stores/userFriend.js'
import { getUser, getUsersByUserIds } from '../stores/user.js'
import { getEventsInCommunities } from '../stores/event.js'
import { resolveUserFriendsList, resolveUserFriendMeetLog } from './userFriendsResolver.js'

type MockEvent = {
  community_id: string
  id: string
  event_name: string
  community_account: string
  is_public: boolean
  is_deleted: boolean
}

const makeEvent = (params: {
  communityId: string
  eventId: string
  eventName: string
  communityAccount: string
  isPublic: boolean
  isDeleted?: boolean
}): MockEvent => ({
  community_id: params.communityId,
  id: params.eventId,
  event_name: params.eventName,
  community_account: params.communityAccount,
  is_public: params.isPublic,
  is_deleted: params.isDeleted ?? false,
})

describe('resolveUserFriendsList', () => {
  beforeEach(() => {
    vi.mocked(listUserFriends).mockReset()
    vi.mocked(getUsersByUserIds).mockReset()
    vi.mocked(getEventsInCommunities).mockReset()
  })

  it('events を読まずサブコレの first_met_at / last_met_at をそのまま返す', async () => {
    vi.mocked(listUserFriends).mockResolvedValue({
      friends: [
        {
          id: 'friend1',
          meet_count: 3,
          first_met_at: 1000,
          last_met_at: 3000,
        },
      ],
      hasMore: false,
      nextCursor: null,
    })
    vi.mocked(getUsersByUserIds).mockResolvedValue(
      new Map([
        [
          'friend1',
          {
            user_name: 'Friend',
            user_image_url: 'https://example.com/a.png',
            is_deleted: false,
          },
        ],
      ] as never),
    )

    const { friends } = await resolveUserFriendsList({
      targetUserId: 'owner',
      sortBy: 'meet_count',
      limit: 10,
      viewerUid: 'viewer',
    })

    expect(getEventsInCommunities).not.toHaveBeenCalled()
    expect(friends).toHaveLength(1)
    expect(friends[0]).toEqual({
      user_id: 'friend1',
      user_name: 'Friend',
      user_image_url: 'https://example.com/a.png',
      meet_count: 3,
      first_met_at: 1000,
      last_met_at: 3000,
    })
  })

  it('退会ユーザーを除外する', async () => {
    vi.mocked(listUserFriends).mockResolvedValue({
      friends: [
        {
          id: 'deleted',
          meet_count: 1,
          first_met_at: 1000,
          last_met_at: 1000,
        },
      ],
      hasMore: false,
      nextCursor: null,
    })
    vi.mocked(getUsersByUserIds).mockResolvedValue(
      new Map([
        [
          'deleted',
          {
            user_name: 'Gone',
            user_image_url: '',
            is_deleted: true,
          },
        ],
      ] as never),
    )

    const { friends } = await resolveUserFriendsList({
      targetUserId: 'owner',
      sortBy: 'meet_count',
      limit: 10,
    })

    expect(friends).toHaveLength(0)
    expect(getEventsInCommunities).not.toHaveBeenCalled()
  })

  it('退会者のみのページを複数読み飛ばして有効な友人を返す（RC-52）', async () => {
    const cursor1 = { value: 10, friend_user_id: 'f10' }
    const cursor2 = { value: 9, friend_user_id: 'f9' }

    vi.mocked(listUserFriends)
      .mockResolvedValueOnce({
        friends: [{ id: 'deleted1', meet_count: 10, first_met_at: 1, last_met_at: 1 }],
        hasMore: true,
        nextCursor: cursor1,
      })
      .mockResolvedValueOnce({
        friends: [{ id: 'deleted2', meet_count: 9, first_met_at: 1, last_met_at: 1 }],
        hasMore: true,
        nextCursor: cursor2,
      })
      .mockResolvedValueOnce({
        friends: [{ id: 'active', meet_count: 8, first_met_at: 100, last_met_at: 200 }],
        hasMore: true,
        nextCursor: { value: 7, friend_user_id: 'f7' },
      })

    vi.mocked(getUsersByUserIds)
      .mockResolvedValueOnce(
        new Map([['deleted1', { user_name: 'D1', user_image_url: '', is_deleted: true }]] as never),
      )
      .mockResolvedValueOnce(
        new Map([['deleted2', { user_name: 'D2', user_image_url: '', is_deleted: true }]] as never),
      )
      .mockResolvedValueOnce(
        new Map([['active', { user_name: 'Active', user_image_url: 'https://x.png', is_deleted: false }]] as never),
      )

    const { friends, hasMore } = await resolveUserFriendsList({
      targetUserId: 'owner',
      sortBy: 'meet_count',
      limit: 1,
    })

    expect(listUserFriends).toHaveBeenCalledTimes(3)
    expect(friends).toHaveLength(1)
    expect(friends[0].user_id).toBe('active')
    expect(hasMore).toBe(true)
  })

  it('不正 doc のみのページを skip cursor で読み飛ばして有効な友人を返す（RC-7）', async () => {
    const skipCursor = { value: 0, friend_user_id: 'invalid2', sort_value_null: true as const }

    vi.mocked(listUserFriends)
      .mockResolvedValueOnce({
        friends: [],
        hasMore: true,
        nextCursor: skipCursor,
      })
      .mockResolvedValueOnce({
        friends: [{ id: 'active', meet_count: 5, first_met_at: 100, last_met_at: 200 }],
        hasMore: false,
        nextCursor: null,
      })

    vi.mocked(getUsersByUserIds).mockResolvedValueOnce(
      new Map([['active', { user_name: 'Active', user_image_url: 'https://x.png', is_deleted: false }]] as never),
    )

    const { friends } = await resolveUserFriendsList({
      targetUserId: 'owner',
      sortBy: 'meet_count',
      limit: 1,
    })

    expect(listUserFriends).toHaveBeenCalledTimes(2)
    expect(listUserFriends).toHaveBeenNthCalledWith(2, 'owner', 'meet_count', 1, skipCursor)
    expect(friends).toHaveLength(1)
    expect(friends[0].user_id).toBe('active')
  })
})

describe('resolveUserFriendMeetLog', () => {
  beforeEach(() => {
    vi.mocked(getUserFriend).mockReset()
    vi.mocked(getUser).mockReset()
    vi.mocked(getEventsInCommunities).mockReset()
    vi.mocked(getUser).mockResolvedValue({
      user_id: 'friend1',
      user_name: 'Friend',
      user_image_url: '',
      is_deleted: false,
    } as never)
  })

  it('友人が退会済みのとき null を返し events を読まない（RC-58）', async () => {
    vi.mocked(getUserFriend).mockResolvedValue({
      meet_count: 1,
      event_history: [{ event_id: 'e1', community_id: 'c1', event_at: 1000 }],
    } as never)
    vi.mocked(getUser).mockResolvedValue({
      user_id: 'friend1',
      is_deleted: true,
    } as never)

    const result = await resolveUserFriendMeetLog({
      targetUserId: 'owner',
      friendUserId: 'friend1',
      viewerUid: 'viewer',
    })

    expect(result).toBeNull()
    expect(getEventsInCommunities).not.toHaveBeenCalled()
  })

  it('友人 users が存在しないとき null を返す（RC-58）', async () => {
    vi.mocked(getUserFriend).mockResolvedValue({
      meet_count: 1,
      event_history: [{ event_id: 'e1', community_id: 'c1', event_at: 1000 }],
    } as never)
    vi.mocked(getUser).mockResolvedValue(undefined)

    const result = await resolveUserFriendMeetLog({
      targetUserId: 'owner',
      friendUserId: 'friend1',
      viewerUid: 'viewer',
    })

    expect(result).toBeNull()
    expect(getEventsInCommunities).not.toHaveBeenCalled()
  })

  it('限定公開を含め日付降順で返す（他者は is_linkable false）', async () => {
    vi.mocked(getUserFriend).mockResolvedValue({
      meet_count: 2,
      event_history: [
        { event_id: 'e1', community_id: 'c1', event_at: 1000 },
        { event_id: 'e2', community_id: 'c1', event_at: 2000 },
      ],
    } as never)
    vi.mocked(getEventsInCommunities).mockResolvedValue(
      new Map([
        [
          'c1\te1',
          makeEvent({
            communityId: 'c1',
            eventId: 'e1',
            eventName: 'Private',
            communityAccount: 'comm',
            isPublic: false,
          }),
        ],
        [
          'c1\te2',
          makeEvent({
            communityId: 'c1',
            eventId: 'e2',
            eventName: 'Public',
            communityAccount: 'comm',
            isPublic: true,
          }),
        ],
      ]) as never,
    )

    const result = await resolveUserFriendMeetLog({
      targetUserId: 'owner',
      friendUserId: 'friend1',
      viewerUid: 'viewer',
    })

    expect(getEventsInCommunities).toHaveBeenCalled()
    expect(result?.meet_log).toHaveLength(2)
    expect(result?.meet_log[0].event_id).toBe('e2')
    expect(result?.meet_log[1].event_id).toBe('e1')
    expect(result?.meet_log[0].is_linkable).toBe(true)
    expect(result?.meet_log[1].is_linkable).toBe(false)
    expect(result?.meet_log[1].is_public).toBe(false)
    expect(result?.meet_count).toBe(2)
  })

  it('プロフィール本人閲覧では限定公開も is_linkable true', async () => {
    vi.mocked(getUserFriend).mockResolvedValue({
      meet_count: 1,
      event_history: [{ event_id: 'e1', community_id: 'c1', event_at: 1000 }],
    } as never)
    vi.mocked(getEventsInCommunities).mockResolvedValue(
      new Map([
        [
          'c1\te1',
          makeEvent({
            communityId: 'c1',
            eventId: 'e1',
            eventName: 'Private',
            communityAccount: 'comm',
            isPublic: false,
          }),
        ],
      ]) as never,
    )

    const result = await resolveUserFriendMeetLog({
      targetUserId: 'owner',
      friendUserId: 'friend1',
      viewerUid: 'owner',
    })

    expect(result?.meet_log).toHaveLength(1)
    expect(result?.meet_log[0].is_linkable).toBe(true)
  })

  it('eventMap に該当イベントが無いときプレースホルダ行を返す（RC-75）', async () => {
    vi.mocked(getUserFriend).mockResolvedValue({
      meet_count: 1,
      event_history: [{ event_id: 'e1', community_id: 'c1', event_at: 1000 }],
    } as never)
    vi.mocked(getEventsInCommunities).mockResolvedValue(new Map())

    const result = await resolveUserFriendMeetLog({
      targetUserId: 'owner',
      friendUserId: 'friend1',
      viewerUid: 'viewer',
    })

    expect(result?.meet_log).toHaveLength(1)
    expect(result?.meet_log[0]).toEqual({
      event_id: 'e1',
      community_id: 'c1',
      event_at: 1000,
      event_name: null,
      community_account: null,
      is_public: false,
      is_linkable: false,
    })
  })

  it('削除済みイベントはプレースホルダ行を返す（RC-75）', async () => {
    vi.mocked(getUserFriend).mockResolvedValue({
      meet_count: 1,
      event_history: [{ event_id: 'e1', community_id: 'c1', event_at: 1000 }],
    } as never)
    vi.mocked(getEventsInCommunities).mockResolvedValue(
      new Map([
        [
          'c1\te1',
          makeEvent({
            communityId: 'c1',
            eventId: 'e1',
            eventName: 'Deleted',
            communityAccount: 'comm',
            isPublic: true,
            isDeleted: true,
          }),
        ],
      ]) as never,
    )

    const result = await resolveUserFriendMeetLog({
      targetUserId: 'owner',
      friendUserId: 'friend1',
      viewerUid: 'owner',
    })

    expect(result?.meet_log).toHaveLength(1)
    expect(result?.meet_log[0].event_name).toBeNull()
    expect(result?.meet_log[0].community_account).toBeNull()
    expect(result?.meet_log[0].is_linkable).toBe(false)
  })
})
