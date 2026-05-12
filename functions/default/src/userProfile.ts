import { getFirestore, Timestamp } from 'firebase-admin/firestore'
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
import { getUser, getUserRef } from './stores/user.js'
import { getCommunityEventKey, getEventsInCommunities } from './stores/event.js'
import { runUserProfileBackfill } from './utils/userProfileBackfill.js'
import { resolveUserFriendsList } from './utils/userFriendsResolver.js'
import { createModuleLogger } from './utils/logger.js'
import { computeProfileItemVisibleToViewer } from './utils/profileItemVisibility.js'

const logger = createModuleLogger('userProfile')

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
type UserFoodsCursor = z.infer<typeof FoodCursorSchema>

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

/**
 * Firestore Timestamp / number / undefined を安全に millis に変換する。
 * 取得できないときは fallback を返す。
 */
const toMillis = (value: unknown, fallback = 0): number => {
  if (value == null) return fallback
  if (typeof value === 'number') return value
  if (value instanceof Timestamp) return value.toMillis()
  if (typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis()
  }
  return fallback
}

const buildPublicProfile = (user: {
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
}): UserProfilePublicProfile => ({
  user_id: user.user_id,
  user_name: user.user_name,
  user_description: user.user_description,
  user_image_url: user.user_image_url,
  user_sns_facebook: user.user_sns_facebook,
  user_sns_facebook_name: user.user_sns_facebook_name,
  user_sns_twitter: user.user_sns_twitter,
  user_sns_instagram: user.user_sns_instagram,
  user_sns_website: user.user_sns_website,
  is_deleted: user.is_deleted,
})

const fetchEventPreviews = async (
  targetUserId: string,
  viewerUid: string | null,
): Promise<UserProfileEventPreviewItem[]> => {
  const db = getFirestore()
  const userRef = getUserRef(targetUserId)
  const snapshot = await db
    .collectionGroup('events')
    .where('members', 'array-contains', userRef)
    .where('is_deleted', '==', false)
    .orderBy('event_start_datetime', 'desc')
    .limit(PREVIEW_LIMITS.events)
    .get()

  const items: UserProfileEventPreviewItem[] = []
  for (const doc of snapshot.docs) {
    const data = doc.data()
    const isPublic = data.is_public === true
    const isVisibleToViewer = computeProfileItemVisibleToViewer({ isPublic, viewerUid, targetUserId })
    if (!isVisibleToViewer) continue
    items.push({
      event_id: String(data.event_id ?? doc.id),
      community_id: String(data.community_id ?? ''),
      community_account: String(data.community_account ?? ''),
      event_name: String(data.event_name ?? ''),
      event_start_datetime: toMillis(data.event_start_datetime),
      event_end_datetime: toMillis(data.event_end_datetime),
      is_public: isPublic,
      is_visible_to_viewer: true,
    })
  }
  return items
}

const fetchCommunityPreviews = async (
  arrayField: 'members' | 'managers',
  targetUserId: string,
  viewerUid: string | null,
  limit: number,
): Promise<UserProfileCommunityPreviewItem[]> => {
  const db = getFirestore()
  const userRef = getUserRef(targetUserId)
  const snapshot = await db.collection('communities').where(arrayField, 'array-contains', userRef).limit(limit).get()

  const items: UserProfileCommunityPreviewItem[] = []
  for (const doc of snapshot.docs) {
    const data = doc.data()
    const isPublic = data.is_public === true
    const isVisibleToViewer = computeProfileItemVisibleToViewer({ isPublic, viewerUid, targetUserId })
    if (!isVisibleToViewer) continue
    items.push({
      community_id: String(data.community_id ?? doc.id),
      community_account: String(data.community_account ?? ''),
      community_name: String(data.community_name ?? ''),
      community_desc: String(data.community_desc ?? ''),
      is_public: isPublic,
      is_visible_to_viewer: true,
    })
  }
  return items
}

const fetchFriendPreviews = async (
  targetUserId: string,
  viewerUid: string | null,
): Promise<UserProfileFriendPreviewItem[]> => {
  const { friends } = await resolveUserFriendsList({
    targetUserId,
    sortBy: 'meet_count',
    limit: PREVIEW_LIMITS.friends,
    cursor: undefined,
    viewerUid,
  })
  return friends.map((friend) => ({
    user_id: friend.user_id,
    user_name: friend.user_name,
    user_image_url: friend.user_image_url,
    meet_count: friend.meet_count,
    first_met_at: friend.first_met_at,
    last_met_at: friend.last_met_at,
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

const fetchFoodsPage = async (params: {
  targetUserId: string
  viewerUid: string | null
  limit: number
  cursor?: UserFoodsCursor
}): Promise<{ foods: UserProfileFoodPreviewItem[]; nextCursor: UserFoodsCursor | null; hasMore: boolean }> => {
  const { targetUserId, viewerUid, limit, cursor } = params
  const db = getFirestore()
  let q = db
    .collectionGroup('member_orders')
    .where('user_id', '==', targetUserId)
    .where('status', '==', 'ordered')
    .orderBy('updated_at', 'desc')
    .orderBy('order_id', 'desc')

  if (cursor != null) {
    q = q.startAfter(Timestamp.fromMillis(cursor.updated_at), cursor.order_id)
  }
  const snapshot = await q.limit(limit + 1).get()

  if (snapshot.empty) {
    return { foods: [], nextCursor: null, hasMore: false }
  }

  const hasMore = snapshot.docs.length > limit
  const pageDocs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs

  // 画像 storage パスを組み立てるため、event の status と partner_id をまとめて解決する
  const eventRefs = pageDocs
    .map((doc) => ({
      community_id: String(doc.get('community_id') ?? ''),
      event_id: String(doc.get('event_id') ?? ''),
    }))
    .filter((ref) => ref.community_id !== '' && ref.event_id !== '')
  const eventMap = await getEventsInCommunities(eventRefs)

  const items: UserProfileFoodPreviewItem[] = []
  for (const doc of pageDocs) {
    const data = doc.data()
    const community_id = String(data.community_id ?? '')
    const event_id = String(data.event_id ?? '')
    const event = eventMap.get(getCommunityEventKey(community_id, event_id))
    const isPublic = event?.is_public === true
    const isDeleted = event?.is_deleted === true
    const isVisibleToViewer =
      event != null && !isDeleted && computeProfileItemVisibleToViewer({ isPublic, viewerUid, targetUserId })
    if (!isVisibleToViewer) continue
    items.push({
      order_id: String(data.order_id ?? doc.id),
      community_id,
      event_id,
      menu_id: String(data.menu_id ?? ''),
      menu_name: String(data.menu_name ?? ''),
      menu_price: Number(data.menu_price ?? 0),
      ordered_at: toMillis(data.ordered_at) || toMillis(data.updated_at),
      event_status_value: event?.event_status?.value ?? '',
      partner_id: event?.partner_id ?? '',
      event_name: isDeleted || event == null ? '' : event.event_name,
      community_account: isDeleted || event == null ? '' : event.community_account,
      is_visible_to_viewer: true,
    })
  }

  const lastDoc = pageDocs[pageDocs.length - 1]
  const nextCursor = hasMore
    ? {
        updated_at: toMillis(lastDoc.get('updated_at')),
        order_id: String(lastDoc.get('order_id') ?? lastDoc.id),
      }
    : null
  return {
    foods: items,
    nextCursor,
    hasMore,
  }
}

const fetchFoodPreviews = async (
  targetUserId: string,
  viewerUid: string | null,
): Promise<UserProfileFoodPreviewItem[]> => {
  const { foods } = await fetchFoodsPage({
    targetUserId,
    viewerUid,
    limit: PREVIEW_LIMITS.foods,
  })
  return foods
}

const fetchOrderPreviews = async (targetUserId: string): Promise<UserProfileOrderPreviewItem[]> => {
  const db = getFirestore()
  const snapshot = await db
    .collectionGroup('member_orders')
    .where('user_id', '==', targetUserId)
    .where('status', '==', 'ordered')
    .orderBy('updated_at', 'desc')
    .limit(PREVIEW_LIMITS.orders)
    .get()

  if (snapshot.empty) {
    return []
  }

  const eventRefs = snapshot.docs
    .map((doc) => ({
      community_id: String(doc.get('community_id') ?? ''),
      event_id: String(doc.get('event_id') ?? ''),
    }))
    .filter((ref) => ref.community_id !== '' && ref.event_id !== '')
  const eventMap = await getEventsInCommunities(eventRefs)

  const items: UserProfileOrderPreviewItem[] = []
  for (const doc of snapshot.docs) {
    const data = doc.data()
    const community_id = String(data.community_id ?? '')
    const event_id = String(data.event_id ?? '')
    const event = eventMap.get(getCommunityEventKey(community_id, event_id))
    items.push({
      order_id: String(data.order_id ?? doc.id),
      community_id,
      event_id,
      event_name: event?.event_name ?? '',
      event_start_datetime: event != null ? event.event_start_datetime : 0,
      ordered_at: toMillis(data.ordered_at) || toMillis(data.updated_at),
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
 * - 各プレビューには `is_visible_to_viewer` を付与する（返却項目は常に true。本人以外には非公開を含めない）
 * - App Check は Phase 1 では必須としない。Firebase Functions の Callable 既定どおり `enforceAppCheck` は付けず、未ログイン呼び出しや運用バッチを阻害しない。強制を有効化する場合は別イシューでクライアント対応と合わせて検討する（仕様書 5.2.1 F1）
 */
export const getUserProfilePreview = onCall<GetUserProfilePreviewRequest, Promise<GetUserProfilePreviewResponse>>(
  { region: 'asia-northeast1', invoker: 'public' },
  async (request) => {
    const input = GetUserProfilePreviewRequestSchema.parse(request.data)
    const targetUserId = input.target_user_id
    const viewerUid = request.auth?.uid ?? null
    const isOwner = viewerUid != null && viewerUid === targetUserId

    const targetUser = await getUser(targetUserId, false)
    if (targetUser == null || targetUser.is_deleted) {
      throw new HttpsError('not-found', '存在しないユーザーです')
    }

    const [eventPreviews, friendPreviews, joinedCommunities, managedCommunities, foodPreviews, orderPreviews] =
      await Promise.all([
        fetchEventPreviews(targetUserId, viewerUid),
        fetchFriendPreviews(targetUserId, viewerUid),
        fetchCommunityPreviews('members', targetUserId, viewerUid, PREVIEW_LIMITS.joinedCommunities),
        fetchCommunityPreviews('managers', targetUserId, viewerUid, PREVIEW_LIMITS.managedCommunities),
        fetchFoodPreviews(targetUserId, viewerUid),
        isOwner ? fetchOrderPreviews(targetUserId) : Promise.resolve(null as UserProfileOrderPreviewItem[] | null),
      ])

    const counts = {
      participated_event_count: targetUser.participated_event_count ?? 0,
      friend_count: targetUser.friend_count ?? 0,
      joined_community_count: targetUser.joined_community_count ?? 0,
      managed_community_count: targetUser.managed_community_count ?? 0,
      ordered_food_count: targetUser.ordered_food_count ?? 0,
      counts_updated_at: targetUser.counts_updated_at ?? null,
    }

    logger.info('getUserProfilePreview returned', {
      targetUserId,
      viewerUid,
      isOwner,
    })

    return {
      user_profile: buildPublicProfile(targetUser),
      counts,
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
    const targetUser = await getUser(input.target_user_id, false)
    if (targetUser == null || targetUser.is_deleted) {
      throw new HttpsError('not-found', '存在しないユーザーです')
    }

    const pageSize = input.limit ?? PREVIEW_LIMITS.foods
    const viewerUid = request.auth?.uid ?? null
    const { foods, nextCursor, hasMore } = await fetchFoodsPage({
      targetUserId: input.target_user_id,
      viewerUid,
      limit: pageSize,
      cursor: decodeFoodCursor(input.cursor),
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
