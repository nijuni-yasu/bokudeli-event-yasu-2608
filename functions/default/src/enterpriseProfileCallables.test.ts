import { beforeEach, describe, expect, it, vi } from 'vitest'

const { HttpsError } = vi.hoisted(() => {
  class HttpsError extends Error {
    constructor(
      public code: string,
      message: string,
    ) {
      super(message)
    }
  }
  return { HttpsError }
})

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError,
  onCall: (_opts: unknown, handler: unknown) => handler,
}))

vi.mock('firebase-functions/https', () => ({
  HttpsError,
  onCall: (_opts: unknown, handler: unknown) => handler,
}))

vi.mock('firebase-admin/firestore', () => ({
  Timestamp: {
    fromMillis: (ms: number) => ({ toMillis: () => ms }),
  },
}))

vi.mock('./stores/config.js', () => ({ getConfigGlobal: vi.fn() }))
vi.mock('./stores/user.js', () => ({ getUser: vi.fn() }))
vi.mock('./stores/enterprise.js', () => ({ getEnterpriseMember: vi.fn() }))
vi.mock('./stores/event.js', () => ({
  getCommunityEventKey: vi.fn(() => 'key'),
  listEventsForProfilePreview: vi.fn(),
}))
vi.mock('./stores/community.js', () => ({
  listCommunitiesForProfilePreview: vi.fn(),
}))
vi.mock('./stores/memberOrder.js', () => ({
  listOrderedFoodsPageForProfile: vi.fn(),
  listOrderedFoodsPreviewForProfile: vi.fn(),
}))
vi.mock('./utils/userFriendsResolver.js', () => ({
  resolveUserFriendsList: vi.fn(),
  resolveUserFriendMeetLog: vi.fn(),
}))
vi.mock('./utils/recountUserProfileCounts.js', () => ({
  computeUserProfileCounts: vi.fn(),
}))
vi.mock('./utils/logger.js', () => ({
  createModuleLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}))
vi.mock('./utils/userProfileBackfill.js', () => ({ runUserProfileBackfill: vi.fn() }))
vi.mock('./utils/friendsService.js', () => ({ runBackfill: vi.fn() }))

import { getUser } from './stores/user.js'
import { getEnterpriseMember } from './stores/enterprise.js'
import { listEventsForProfilePreview } from './stores/event.js'
import { listCommunitiesForProfilePreview } from './stores/community.js'
import { listOrderedFoodsPageForProfile } from './stores/memberOrder.js'
import { resolveUserFriendsList, resolveUserFriendMeetLog } from './utils/userFriendsResolver.js'
import { computeUserProfileCounts } from './utils/recountUserProfileCounts.js'
import { getUserProfilePreview, getUserFoods } from './userProfile.js'
import { getUserFriends, getUserFriendMeetLog } from './userFriends.js'

const TARGET_USER_ID = 'target-1'
const FRIEND_USER_ID = 'friend-1'

const enterpriseAuth = {
  uid: 'viewer-1',
  token: { enterprise_id: 'ent-a', user_type: 'enterprise' },
}

/** enterprise 分岐に入るが uid なし → assertEnterpriseProfileAccess が unauthenticated */
const unauthenticatedEnterpriseAuth = {
  token: { enterprise_id: 'ent-a' },
}

/**
 * auth 完全未定義は isEnterpriseViewer=false のため PF path に入る。
 * enterprise アプリは F-2 でログイン必須のため本番では稀だが、Callable 単体では not-found 等になる。
 */

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  user_id: TARGET_USER_ID,
  user_name: 'Alice',
  user_description: 'bio',
  user_image_url: 'https://example.com/a.png',
  user_sns_facebook: 'fb',
  user_sns_facebook_name: 'FB',
  user_sns_twitter: 'x',
  user_sns_instagram: 'ig',
  user_sns_website: 'https://example.com',
  is_deleted: false,
  enterprise_id: 'ent-a',
  counts_updated_at: null,
  participated_event_count: 0,
  friend_count: 0,
  joined_community_count: 0,
  managed_community_count: 0,
  ordered_food_count: 0,
  ...overrides,
})

type EnterpriseCallableAuth = { uid?: string; token: Record<string, unknown> }

type CallableHandler<TData, TResult> = (req: { auth?: EnterpriseCallableAuth; data: TData }) => Promise<TResult>

const setupActiveMember = () => {
  vi.mocked(getUser).mockResolvedValue(makeUser() as never)
  vi.mocked(getEnterpriseMember).mockResolvedValue({
    is_active: true,
    department: '営業部',
  } as never)
}

const setupDownstreamMocks = () => {
  vi.mocked(listEventsForProfilePreview).mockResolvedValue([])
  vi.mocked(listCommunitiesForProfilePreview).mockResolvedValue([])
  vi.mocked(resolveUserFriendsList).mockResolvedValue({ friends: [], hasMore: false, nextCursor: null })
  vi.mocked(listOrderedFoodsPageForProfile).mockResolvedValue({
    orders: [],
    eventsByKey: new Map(),
    nextCursor: null,
    hasMore: false,
  })
  vi.mocked(computeUserProfileCounts).mockResolvedValue({
    participated_event_count: 1,
    friend_count: 2,
    joined_community_count: 3,
    managed_community_count: 4,
    ordered_food_count: 5,
  })
  vi.mocked(resolveUserFriendMeetLog).mockResolvedValue({
    friend_user_id: FRIEND_USER_ID,
    meet_count: 1,
    events: [],
  })
}

const expectCallableRejects = async <TData>(
  handler: CallableHandler<TData, unknown>,
  auth: EnterpriseCallableAuth | undefined,
  data: TData,
  setup: () => void,
  code: string,
) => {
  setup()
  await expect(handler({ auth, data })).rejects.toMatchObject({ code })
}

beforeEach(() => {
  vi.mocked(getUser).mockReset()
  vi.mocked(getEnterpriseMember).mockReset()
  vi.mocked(listEventsForProfilePreview).mockReset()
  vi.mocked(listCommunitiesForProfilePreview).mockReset()
  vi.mocked(resolveUserFriendsList).mockReset()
  vi.mocked(listOrderedFoodsPageForProfile).mockReset()
  vi.mocked(computeUserProfileCounts).mockReset()
  vi.mocked(resolveUserFriendMeetLog).mockReset()
  setupDownstreamMocks()
})

describe('enterprise profile callables (§6.1)', () => {
  describe('getUserProfilePreview', () => {
    const handler = getUserProfilePreview as CallableHandler<{ target_user_id: string }, unknown>
    const data = { target_user_id: TARGET_USER_ID }

    it('未ログイン（uid なし enterprise token）は unauthenticated', async () => {
      await expectCallableRejects(handler, unauthenticatedEnterpriseAuth, data, () => {}, 'unauthenticated')
    })

    it('auth 未定義は PF path（target 不在で not-found）', async () => {
      vi.mocked(getUser).mockResolvedValue(undefined)
      await expect(handler({ auth: undefined, data })).rejects.toMatchObject({ code: 'not-found' })
    })

    it('他社閲覧は permission-denied', async () => {
      await expectCallableRejects(
        handler,
        enterpriseAuth,
        data,
        () => {
          vi.mocked(getUser).mockResolvedValue(makeUser({ enterprise_id: 'ent-b' }) as never)
        },
        'permission-denied',
      )
    })

    it('停止ユーザーは not-found', async () => {
      await expectCallableRejects(
        handler,
        enterpriseAuth,
        data,
        () => {
          vi.mocked(getUser).mockResolvedValue(makeUser() as never)
          vi.mocked(getEnterpriseMember).mockResolvedValue({ is_active: false } as never)
        },
        'not-found',
      )
    })

    it('ゲスト target は not-found', async () => {
      await expectCallableRejects(
        handler,
        enterpriseAuth,
        data,
        () => {
          vi.mocked(getUser).mockResolvedValue(makeUser({ enterprise_id: undefined }) as never)
        },
        'not-found',
      )
    })

    it('同社 active メンバーは omitSns と department を返す', async () => {
      setupActiveMember()
      const result = (await handler({ auth: enterpriseAuth, data })) as {
        department?: string
        user_profile: { user_sns_twitter: string }
      }
      expect(result.department).toBe('営業部')
      expect(result.user_profile.user_sns_twitter).toBe('')
    })
  })

  describe('getUserFriends', () => {
    const handler = getUserFriends as CallableHandler<{ target_user_id: string }, unknown>
    const data = { target_user_id: TARGET_USER_ID }

    it('未ログイン（uid なし enterprise token）は unauthenticated', async () => {
      await expectCallableRejects(handler, unauthenticatedEnterpriseAuth, data, () => {}, 'unauthenticated')
    })

    it('他社閲覧は permission-denied', async () => {
      await expectCallableRejects(
        handler,
        enterpriseAuth,
        data,
        () => {
          vi.mocked(getUser).mockResolvedValue(makeUser({ enterprise_id: 'ent-b' }) as never)
        },
        'permission-denied',
      )
    })

    it('停止ユーザーは not-found', async () => {
      await expectCallableRejects(
        handler,
        enterpriseAuth,
        data,
        () => {
          vi.mocked(getUser).mockResolvedValue(makeUser() as never)
          vi.mocked(getEnterpriseMember).mockResolvedValue({ is_active: false } as never)
        },
        'not-found',
      )
    })

    it('ゲスト target は not-found', async () => {
      await expectCallableRejects(
        handler,
        enterpriseAuth,
        data,
        () => {
          vi.mocked(getUser).mockResolvedValue(makeUser({ enterprise_id: undefined }) as never)
        },
        'not-found',
      )
    })
  })

  describe('getUserFriendMeetLog', () => {
    const handler = getUserFriendMeetLog as CallableHandler<{ target_user_id: string; friend_user_id: string }, unknown>
    const data = { target_user_id: TARGET_USER_ID, friend_user_id: FRIEND_USER_ID }

    it('未ログイン（uid なし enterprise token）は unauthenticated', async () => {
      await expectCallableRejects(handler, unauthenticatedEnterpriseAuth, data, () => {}, 'unauthenticated')
    })

    it('他社閲覧は permission-denied', async () => {
      await expectCallableRejects(
        handler,
        enterpriseAuth,
        data,
        () => {
          vi.mocked(getUser).mockResolvedValue(makeUser({ enterprise_id: 'ent-b' }) as never)
        },
        'permission-denied',
      )
    })

    it('停止ユーザーは not-found', async () => {
      await expectCallableRejects(
        handler,
        enterpriseAuth,
        data,
        () => {
          vi.mocked(getUser).mockResolvedValue(makeUser() as never)
          vi.mocked(getEnterpriseMember).mockResolvedValue({ is_active: false } as never)
        },
        'not-found',
      )
    })

    it('ゲスト target は not-found', async () => {
      await expectCallableRejects(
        handler,
        enterpriseAuth,
        data,
        () => {
          vi.mocked(getUser).mockResolvedValue(makeUser({ enterprise_id: undefined }) as never)
        },
        'not-found',
      )
    })
  })

  describe('getUserFoods', () => {
    const handler = getUserFoods as CallableHandler<{ target_user_id: string }, unknown>
    const data = { target_user_id: TARGET_USER_ID }

    it('未ログイン（uid なし enterprise token）は unauthenticated', async () => {
      await expectCallableRejects(handler, unauthenticatedEnterpriseAuth, data, () => {}, 'unauthenticated')
    })

    it('他社閲覧は permission-denied', async () => {
      await expectCallableRejects(
        handler,
        enterpriseAuth,
        data,
        () => {
          vi.mocked(getUser).mockResolvedValue(makeUser({ enterprise_id: 'ent-b' }) as never)
        },
        'permission-denied',
      )
    })

    it('停止ユーザーは not-found', async () => {
      await expectCallableRejects(
        handler,
        enterpriseAuth,
        data,
        () => {
          vi.mocked(getUser).mockResolvedValue(makeUser() as never)
          vi.mocked(getEnterpriseMember).mockResolvedValue({ is_active: false } as never)
        },
        'not-found',
      )
    })

    it('ゲスト target は not-found', async () => {
      await expectCallableRejects(
        handler,
        enterpriseAuth,
        data,
        () => {
          vi.mocked(getUser).mockResolvedValue(makeUser({ enterprise_id: undefined }) as never)
        },
        'not-found',
      )
    })
  })
})
