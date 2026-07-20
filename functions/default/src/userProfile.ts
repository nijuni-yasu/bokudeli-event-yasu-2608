import { Timestamp } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { z } from 'zod'
import type {
  BackfillUserProfileCountsRequest,
  BackfillUserProfileCountsResponse,
  GetUserFoodsRequest,
  GetUserFoodsResponse,
  GetUserProfilePreviewRequest,
  GetUserProfilePreviewResponse,
  UserProfileCommunityPreviewItem,
  UserProfileEventPreviewItem,
  UserProfileFoodPreviewItem,
  UserProfileFriendPreviewItem,
  UserProfileOrderPreviewItem,
  UserProfilePublicProfile,
} from '@shokujii/common/apis/userProfile.js'
import { getConfigGlobal } from './stores/config.js'
import { getUser } from './stores/user.js'
import { getCommunityEventKey, listEventsForProfilePreview } from './stores/event.js'
import { listCommunitiesForProfilePreview } from './stores/community.js'
import {
  listOrderedFoodsPageForProfile,
  listOrderedFoodsPreviewForProfile,
  type ProfileFoodsPageCursor,
} from './stores/memberOrder.js'
import { runUserProfileBackfill } from './utils/userProfileBackfill.js'
import { resolveUserFriendsList } from './utils/userFriendsResolver.js'
import { computeProfileItemLinkableToViewer } from './utils/profileItemVisibility.js'
import { createModuleLogger } from './utils/logger.js'
import { assertEnterpriseProfileAccess, isEnterpriseViewer } from './utils/enterpriseProfileAccess.js'
import { computeUserProfileCounts } from './utils/recountUserProfileCounts.js'

const logger = createModuleLogger('userProfile')

/**
 * Issue #2175 の 504 切り分け用の一時計測。
 * 調査完了後は次のいずれかを行う（判断は #2175 クローズ時）:
 * - segment ログと timed ラッパーを削除する
 * - 閾値を見直す（例: 500ms 以上のみ、または totalDurationMs 超過時のみ segment 出力）
 */
const PROFILE_PREVIEW_SEGMENT_LOG_MIN_MS = 200

type PreviewTimedContext = {
  targetUserId: string
  viewerUid: string | null
  isOwner: boolean
}

const timed = async <T>(segment: string, context: PreviewTimedContext, fn: () => Promise<T>): Promise<T> => {
  const startedAt = performance.now()
  let success = true
  try {
    return await fn()
  } catch (error: unknown) {
    success = false
    throw error
  } finally {
    const durationMs = Math.round(performance.now() - startedAt)
    if (!success || durationMs >= PROFILE_PREVIEW_SEGMENT_LOG_MIN_MS) {
      logger.info('getUserProfilePreview segment', {
        segment,
        targetUserId: context.targetUserId,
        viewerUid: context.viewerUid,
        isOwner: context.isOwner,
        success,
        durationMs,
      })
    }
  }
}

const BackfillUserProfileCountsRequestSchema = z.object({
  dry_run: z.boolean().optional(),
  user_id_from: z.string().optional(),
  user_id_to: z.string().optional(),
  resume_token: z.string().optional(),
})

const GetUserProfilePreviewRequestSchema = z.object({
  target_user_id: z.string().min(1),
})

const GetUserFoodsRequestSchema = z.object({
  target_user_id: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional(),
  cursor: z.string().nullable().optional(),
})

const FoodCursorSchema = z.object({
  updated_at: z.number().int().nonnegative(),
  order_id: z.string().min(1),
})
type UserFoodsCursor = ProfileFoodsPageCursor

/**
 * 各プレビューの最大件数（仕様書 4.2 のプレビュー目安）。
 * 必要に応じてフラットな optional 引数を追加する余地があるため、サーバ既定として定数で持つ。
 */
const PREVIEW_LIMITS = {
  events: 12,
  friends: 30,
  joinedCommunities: 12,
  managedCommunities: 12,
  foods: 12,
  orders: 5,
} as const

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

/**
 * Firestore Timestamp / number / undefined を安全に millis に変換する。
 * 取得できないときは fallback を返す。
 */
const toMillis = (value: unknown, fallback = 0): number => {
  if (value == null) return fallback
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (value instanceof Timestamp) return value.toMillis()
  if (!isRecord(value)) return fallback

  const toMillisFn = value['toMillis']
  if (typeof toMillisFn !== 'function') return fallback

  const result = toMillisFn.call(value)
  return typeof result === 'number' && Number.isFinite(result) ? result : fallback
}

export const buildPublicProfile = (
  user: {
    user_id: string
    user_name: string
    user_description: string
    user_image_url: string
    user_sns_facebook: string
    user_sns_facebook_name: string
    user_sns_twitter: string
    user_sns_instagram: string
    user_sns_website: string
    is_deleted: boolean
  },
  options?: { omitSns?: boolean },
): UserProfilePublicProfile => ({
  user_id: user.user_id,
  user_name: user.user_name,
  user_description: user.user_description,
  user_image_url: user.user_image_url,
  user_sns_facebook: options?.omitSns === true ? '' : user.user_sns_facebook,
  user_sns_facebook_name: options?.omitSns === true ? '' : user.user_sns_facebook_name,
  user_sns_twitter: options?.omitSns === true ? '' : user.user_sns_twitter,
  user_sns_instagram: options?.omitSns === true ? '' : user.user_sns_instagram,
  user_sns_website: options?.omitSns === true ? '' : user.user_sns_website,
  is_deleted: user.is_deleted,
})

const fetchEventPreviews = async (
  targetUserId: string,
  viewerUid: string | null,
  enterpriseId?: string,
): Promise<UserProfileEventPreviewItem[]> => {
  const events = await listEventsForProfilePreview({
    targetUserId,
    limit: PREVIEW_LIMITS.events,
    enterpriseId,
  })
  return events.map((event) => {
    const isPublic = event.is_public === true
    return {
      event_id: event.event_id,
      community_id: event.community_id,
      community_account: event.community_account,
      event_name: event.event_name,
      event_start_datetime: event.event_start_datetime,
      event_end_datetime: event.event_end_datetime,
      is_public: isPublic,
      is_visible_to_viewer: true,
      is_linkable: computeProfileItemLinkableToViewer({ isPublic, viewerUid, targetUserId }),
    }
  })
}

const fetchCommunityPreviews = async (
  arrayField: 'members' | 'managers',
  targetUserId: string,
  viewerUid: string | null,
  limit: number,
  enterpriseId?: string,
): Promise<UserProfileCommunityPreviewItem[]> => {
  const communities = await listCommunitiesForProfilePreview({
    targetUserId,
    arrayField,
    limit,
    enterpriseId,
  })
  return communities.map((community) => {
    const isPublic = community.is_public === true
    return {
      community_id: community.community_id,
      community_account: community.community_account,
      community_name: community.community_name,
      community_desc: community.community_desc,
      is_public: isPublic,
      is_visible_to_viewer: true,
      is_linkable: computeProfileItemLinkableToViewer({ isPublic, viewerUid, targetUserId }),
    }
  })
}

const fetchFriendPreviews = async (
  targetUserId: string,
  viewerUid: string | null,
  enterpriseId?: string,
): Promise<UserProfileFriendPreviewItem[]> => {
  const { friends } = await resolveUserFriendsList({
    targetUserId,
    sortBy: 'meet_count',
    limit: PREVIEW_LIMITS.friends,
    cursor: undefined,
    viewerUid,
    ...(enterpriseId != null && enterpriseId !== '' ? { enterpriseScope: { enterpriseId } } : {}),
  })
  return friends.map((friend) => ({
    user_id: friend.user_id,
    user_name: friend.user_name,
    user_image_url: friend.user_image_url,
    meet_count: friend.meet_count,
    first_met_at: friend.first_met_at,
    last_met_at: friend.last_met_at,
    ...(friend.is_guest_friend === true ? { is_guest_friend: true } : {}),
    ...(friend.is_linkable === false
      ? { is_linkable: false }
      : friend.is_linkable === true
        ? { is_linkable: true }
        : {}),
  }))
}

const decodeFoodCursor = (cursor: string | null | undefined): UserFoodsCursor | undefined => {
  if (cursor == null || cursor === '') {
    return undefined
  }
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'))
    return FoodCursorSchema.parse(parsed)
  } catch {
    throw new HttpsError('invalid-argument', 'Invalid cursor')
  }
}

const encodeFoodCursor = (cursor: UserFoodsCursor | null): string | null => {
  if (cursor == null) {
    return null
  }
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64')
}

const mapOrderToFoodPreview = (
  order: Awaited<ReturnType<typeof listOrderedFoodsPageForProfile>>['orders'][number],
  eventsByKey: Awaited<ReturnType<typeof listOrderedFoodsPageForProfile>>['eventsByKey'],
  viewerUid: string | null,
  targetUserId: string,
): UserProfileFoodPreviewItem | null => {
  const event = eventsByKey.get(getCommunityEventKey(order.community_id, order.event_id))
  if (event == null || event.is_deleted) {
    return null
  }
  const isPublic = event.is_public === true
  return {
    order_id: order.order_id,
    community_id: order.community_id,
    event_id: order.event_id,
    menu_id: order.menu_id,
    menu_name: order.menu_name,
    menu_price: order.menu_price,
    shop_name: event.shop_name ?? '',
    ordered_at: toMillis(order.ordered_at) || order.updated_at,
    event_status_value: event.event_status?.value ?? '',
    partner_id: event.partner_id ?? '',
    event_name: event.event_name,
    community_account: event.community_account,
    is_public: isPublic,
    is_visible_to_viewer: true,
    is_linkable: computeProfileItemLinkableToViewer({ isPublic, viewerUid, targetUserId }),
  }
}

const fetchFoodsPage = async (params: {
  targetUserId: string
  viewerUid: string | null
  limit: number
  cursor?: UserFoodsCursor
  enterpriseId?: string
}): Promise<{ foods: UserProfileFoodPreviewItem[]; nextCursor: UserFoodsCursor | null; hasMore: boolean }> => {
  const { targetUserId, viewerUid, limit, cursor, enterpriseId } = params
  const page = await listOrderedFoodsPageForProfile({
    targetUserId,
    limit,
    cursor,
    enterpriseId,
  })

  const foods: UserProfileFoodPreviewItem[] = []
  for (const order of page.orders) {
    const item = mapOrderToFoodPreview(order, page.eventsByKey, viewerUid, targetUserId)
    if (item != null) {
      foods.push(item)
    }
  }

  return {
    foods,
    nextCursor: page.nextCursor,
    hasMore: page.hasMore,
  }
}

const fetchFoodPreviews = async (
  targetUserId: string,
  viewerUid: string | null,
  enterpriseId?: string,
): Promise<UserProfileFoodPreviewItem[]> => {
  const { foods } = await fetchFoodsPage({
    targetUserId,
    viewerUid,
    limit: PREVIEW_LIMITS.foods,
    enterpriseId,
  })
  return foods
}

const fetchOrderPreviews = async (
  targetUserId: string,
  enterpriseId?: string,
): Promise<UserProfileOrderPreviewItem[]> => {
  const { orders, eventsByKey } = await listOrderedFoodsPreviewForProfile(
    targetUserId,
    PREVIEW_LIMITS.orders,
    enterpriseId,
  )
  const items: UserProfileOrderPreviewItem[] = []
  for (const order of orders) {
    const event = eventsByKey.get(getCommunityEventKey(order.community_id, order.event_id))
    items.push({
      order_id: order.order_id,
      community_id: order.community_id,
      event_id: order.event_id,
      event_name: event?.event_name ?? '',
      event_start_datetime: event != null ? event.event_start_datetime : 0,
      ordered_at: toMillis(order.ordered_at) || order.updated_at,
    })
  }
  return items
}

/**
 * プロフィールタブ初期表示用のプレビューデータを 1 往復で返す Callable。
 * 仕様書 5.2.1 を参照。
 *
 * - 未ログインでも呼べる（`invoker: 'public'`）
 * - 退会済み / 存在しないユーザーは `not-found`
 * - `previews.orders` は本人のみ返し、それ以外は `null`
 * - 各プレビューには `is_visible_to_viewer`（常に true）と `is_linkable`（§4.2.0）を付与する
 * - App Check は Phase 1 では必須としない。Firebase Functions の Callable 既定どおり `enforceAppCheck` は付けず、未ログイン呼び出しや運用バッチを阻害しない。強制を有効化する場合は別イシューでクライアント対応と合わせて検討する（仕様書 5.2.1 F1）
 * - #2175 調査用: segment / totalDurationMs の Cloud Logging 計測あり。寿命は Issue #2175 の follow-up を参照
 */
export const getUserProfilePreview = onCall<GetUserProfilePreviewRequest, Promise<GetUserProfilePreviewResponse>>(
  { region: 'asia-northeast1', invoker: 'public' },
  async (request) => {
    const input = GetUserProfilePreviewRequestSchema.parse(request.data)
    const targetUserId = input.target_user_id
    const viewerUid = request.auth?.uid ?? null
    const isOwner = viewerUid != null && viewerUid === targetUserId
    const isEnterprise = isEnterpriseViewer(request.auth)

    const totalStartedAt = performance.now()

    let targetUser
    let enterpriseId: string | undefined
    let department: string | null | undefined

    if (isEnterprise) {
      const access = await assertEnterpriseProfileAccess(request.auth, targetUserId)
      targetUser = access.targetUser
      enterpriseId = access.viewerEnterpriseId
      department = access.department
    } else {
      targetUser = await getUser(targetUserId, false)
      if (targetUser == null || targetUser.is_deleted) {
        throw new HttpsError('not-found', '存在しないユーザーです')
      }
    }

    const previewTimedContext: PreviewTimedContext = { targetUserId, viewerUid, isOwner }

    const [eventPreviews, friendPreviews, joinedCommunities, managedCommunities, foodPreviews, orderPreviews] =
      await Promise.all([
        timed('events', previewTimedContext, () => fetchEventPreviews(targetUserId, viewerUid, enterpriseId)),
        timed('friends', previewTimedContext, () => fetchFriendPreviews(targetUserId, viewerUid, enterpriseId)),
        timed('joined_communities', previewTimedContext, () =>
          fetchCommunityPreviews('members', targetUserId, viewerUid, PREVIEW_LIMITS.joinedCommunities, enterpriseId),
        ),
        timed('managed_communities', previewTimedContext, () =>
          fetchCommunityPreviews('managers', targetUserId, viewerUid, PREVIEW_LIMITS.managedCommunities, enterpriseId),
        ),
        timed('foods', previewTimedContext, () => fetchFoodPreviews(targetUserId, viewerUid, enterpriseId)),
        isOwner
          ? timed('orders', previewTimedContext, () => fetchOrderPreviews(targetUserId, enterpriseId))
          : Promise.resolve(null as UserProfileOrderPreviewItem[] | null),
      ])

    const counts =
      isEnterprise && enterpriseId != null
        ? {
            ...(await computeUserProfileCounts(targetUserId, { enterpriseId })),
            counts_updated_at: targetUser.counts_updated_at ?? null,
          }
        : {
            participated_event_count: targetUser.participated_event_count ?? 0,
            friend_count: targetUser.friend_count ?? 0,
            joined_community_count: targetUser.joined_community_count ?? 0,
            managed_community_count: targetUser.managed_community_count ?? 0,
            ordered_food_count: targetUser.ordered_food_count ?? 0,
            counts_updated_at: targetUser.counts_updated_at ?? null,
          }

    // #2175 調査用。totalDurationMs 含む returned ログの継続要否も Issue #2175 follow-up で判断
    logger.info('getUserProfilePreview returned', {
      targetUserId,
      viewerUid,
      isOwner,
      totalDurationMs: Math.round(performance.now() - totalStartedAt),
      friendCount: targetUser.friend_count ?? 0,
      orderedFoodCount: targetUser.ordered_food_count ?? 0,
    })

    return {
      user_profile: buildPublicProfile(targetUser, isEnterprise ? { omitSns: true } : undefined),
      counts,
      ...(department !== undefined ? { department } : {}),
      previews: {
        events: eventPreviews,
        friends: friendPreviews,
        joined_communities: joinedCommunities,
        managed_communities: managedCommunities,
        foods: foodPreviews,
        orders: orderPreviews,
      },
    }
  },
)

/** フードタブ一覧のページング取得（プロフィールの `previews.foods` とは別 API）。 */
export const getUserFoods = onCall<GetUserFoodsRequest, Promise<GetUserFoodsResponse>>(
  { region: 'asia-northeast1', invoker: 'public' },
  async (request) => {
    const input = GetUserFoodsRequestSchema.parse(request.data)
    const isEnterprise = isEnterpriseViewer(request.auth)

    let enterpriseId: string | undefined
    if (isEnterprise) {
      const access = await assertEnterpriseProfileAccess(request.auth, input.target_user_id)
      enterpriseId = access.viewerEnterpriseId
    } else {
      const targetUser = await getUser(input.target_user_id, false)
      if (targetUser == null || targetUser.is_deleted) {
        throw new HttpsError('not-found', '存在しないユーザーです')
      }
    }

    const pageSize = input.limit ?? PREVIEW_LIMITS.foods
    const viewerUid = request.auth?.uid ?? null
    const { foods, nextCursor, hasMore } = await fetchFoodsPage({
      targetUserId: input.target_user_id,
      viewerUid,
      limit: pageSize,
      cursor: decodeFoodCursor(input.cursor),
      enterpriseId,
    })

    return {
      foods,
      next_cursor: encodeFoodCursor(nextCursor),
      has_more: hasMore,
    }
  },
)

/**
 * support 権限のユーザーが、`users` コレクションを順にスキャンし、
 * マイページ用カウントフィールドを backfill するための管理者 Callable。
 * 仕様書 5.2.2 / 03_参加者獲得/02_マイページ.md を参照。
 *
 * App Check は必須としない。認証は Firebase Auth と support 判定のみとし、運用バッチからの呼び出しを可能にする。`getUserProfilePreview` と同様に `enforceAppCheck` は付けない。
 */
export const backfillUserProfileCounts = onCall<
  BackfillUserProfileCountsRequest,
  Promise<BackfillUserProfileCountsResponse>
>({ region: 'asia-northeast1', timeoutSeconds: 540, memory: '1GiB' }, async (request) => {
  const uid = request.auth?.uid
  if (uid == null) {
    throw new HttpsError('unauthenticated', '認証が必要です')
  }
  const config = await getConfigGlobal()
  const isSupport = config?.isSupport(uid) ?? false
  if (!isSupport) {
    throw new HttpsError('permission-denied', '権限がありません')
  }

  const input = BackfillUserProfileCountsRequestSchema.parse(request.data)
  return runUserProfileBackfill(input)
})
