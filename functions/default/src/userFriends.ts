import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { z } from 'zod'
import type {
  BackfillUserFriendsRequest,
  BackfillUserFriendsResponse,
  GetUserFriendMeetLogRequest,
  GetUserFriendMeetLogResponse,
  GetUserFriendsRequest,
  GetUserFriendsResponse,
  UserFriendsSortBy,
} from '@shokujii/common/apis/userFriends.js'
import { EpochMillisSchema } from '@shokujii/common/schemas/firebase/index.js'
import { getConfigGlobal } from './stores/config.js'
import { type UserFriendsListCursor } from './stores/userFriend.js'
import { getUser } from './stores/user.js'
import { runBackfill } from './utils/friendsService.js'
import { resolveUserFriendsList, resolveUserFriendMeetLog } from './utils/userFriendsResolver.js'

const GetUserFriendsRequestSchema = z.object({
  target_user_id: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional(),
  sort_by: z.enum(['meet_count', 'last_met_at']).optional(),
  cursor: z.string().nullable().optional(),
})

const GetUserFriendMeetLogRequestSchema = z.object({
  target_user_id: z.string().min(1),
  friend_user_id: z.string().min(1),
})

const BackfillUserFriendsRequestSchema = z.object({
  dry_run: z.boolean().optional(),
  community_id: z.string().optional(),
  event_id_from: z.string().optional(),
  event_id_to: z.string().optional(),
  resume_token: z.string().optional(),
})

const CursorSchema = z.object({
  value: EpochMillisSchema.or(z.number().int().nonnegative()),
  friend_user_id: z.string().nonempty(),
})

const decodeCursor = (cursor: string | null | undefined): UserFriendsListCursor | undefined => {
  if (cursor == null || cursor === '') {
    return undefined
  }
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'))
    const normalized = CursorSchema.parse(parsed)
    return {
      value: normalized.value,
      friend_user_id: normalized.friend_user_id,
    }
  } catch {
    throw new HttpsError('invalid-argument', 'Invalid cursor')
  }
}

const encodeCursor = (cursor: UserFriendsListCursor | null): string | null => {
  if (cursor == null) {
    return null
  }
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64')
}

export const getUserFriends = onCall<GetUserFriendsRequest, Promise<GetUserFriendsResponse>>(
  { region: 'asia-northeast1', invoker: 'public' },
  async (request) => {
    const input = GetUserFriendsRequestSchema.parse(request.data)
    const targetUser = await getUser(input.target_user_id, false)
    if (targetUser == null || targetUser.is_deleted) {
      throw new HttpsError('not-found', '存在しないユーザーです')
    }
    // TODO Phase 2: 公開範囲設定（オプトアウト）を参照し、不可なら permission-denied

    const limit = input.limit ?? 10
    const sortBy: UserFriendsSortBy = input.sort_by ?? 'meet_count'
    const decodedCursor = decodeCursor(input.cursor)
    const viewerUid = request.auth?.uid ?? null

    const { friends, hasMore, nextCursor } = await resolveUserFriendsList({
      targetUserId: input.target_user_id,
      sortBy,
      limit,
      cursor: decodedCursor,
      viewerUid,
    })

    return {
      friends,
      has_more: hasMore,
      next_cursor: encodeCursor(nextCursor),
    }
  },
)

export const getUserFriendMeetLog = onCall<GetUserFriendMeetLogRequest, Promise<GetUserFriendMeetLogResponse>>(
  { region: 'asia-northeast1', invoker: 'public' },
  async (request) => {
    const input = GetUserFriendMeetLogRequestSchema.parse(request.data)
    const targetUser = await getUser(input.target_user_id, false)
    if (targetUser == null || targetUser.is_deleted) {
      throw new HttpsError('not-found', '存在しないユーザーです')
    }

    const viewerUid = request.auth?.uid ?? null
    const result = await resolveUserFriendMeetLog({
      targetUserId: input.target_user_id,
      friendUserId: input.friend_user_id,
      viewerUid,
    })

    if (result == null) {
      throw new HttpsError('not-found', '友人が見つかりません')
    }

    return result
  },
)

export const backfillUserFriends = onCall<BackfillUserFriendsRequest, Promise<BackfillUserFriendsResponse>>(
  { region: 'asia-northeast1', timeoutSeconds: 540, memory: '1GiB' },
  async (request) => {
    const uid = request.auth?.uid
    if (uid == null) {
      throw new HttpsError('unauthenticated', '認証が必要です')
    }
    const config = await getConfigGlobal()
    const isSupport = config?.isSupport(uid) ?? false
    if (!isSupport) {
      throw new HttpsError('permission-denied', '権限がありません')
    }

    const input = BackfillUserFriendsRequestSchema.parse(request.data)
    return runBackfill(input)
  },
)
