import { getFirestore, type Query } from 'firebase-admin/firestore'
import type {
  BackfillUserProfileCountsRequest,
  BackfillUserProfileCountsResponse,
} from '@shokujii/common/apis/userProfile.js'
import { computeUserProfileCounts, hasCountsChanged, type UserProfileCounts } from './recountUserProfileCounts.js'
import { updateUserProfileCounts } from '../stores/user.js'
import { createModuleLogger } from './logger.js'

const logger = createModuleLogger('userProfileBackfill')

const MAX_USERS_PER_RUN = 10

type UserCursor = {
  user_id: string
}

const encodeCursor = (cursor: UserCursor): string => Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64')

const decodeCursor = (token?: string): UserCursor | undefined => {
  if (token == null || token === '') {
    return undefined
  }
  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64').toString('utf8')) as UserCursor
    return typeof parsed.user_id === 'string' ? parsed : undefined
  } catch {
    return undefined
  }
}

/**
 * `users` を `user_id` 昇順に最大 `MAX_USERS_PER_RUN` 件スキャンし、
 * 各ユーザーについて `computeUserProfileCounts` を呼び、差分があれば書き込む（`dry_run` の場合は書き込まない）。
 *
 * 1 回呼ぶたびに `resume_token` を返し、続きをこの呼び出しに渡すと再開できる。
 * 仕様書 5.2.2 の運用フロー（dev で dry_run、prod で resume_token を回す）に対応する。
 */
export const runUserProfileBackfill = async (
  input: BackfillUserProfileCountsRequest,
): Promise<BackfillUserProfileCountsResponse> => {
  const db = getFirestore()
  const dryRun = input.dry_run ?? true
  const cursor = decodeCursor(input.resume_token)
  const scanFrom = input.user_id_from ?? cursor?.user_id

  let query: Query = db.collection('users').orderBy('user_id').limit(MAX_USERS_PER_RUN)
  if (scanFrom != null && scanFrom !== '') {
    // user_id_from は inclusive にしたいが、resume_token から復元する場合は exclusive（次のページ）にしたい
    // 単純化のため startAfter を使い、user_id_from は exclusive 扱いにする
    query = query.startAfter(scanFrom)
  }

  const snapshot = await query.get()
  if (snapshot.empty) {
    return {
      dry_run: dryRun,
      scanned_users_count: 0,
      updated_users_count: 0,
      no_change_users_count: 0,
      skipped_users_count: 0,
      resume_token: null,
    }
  }

  let scannedUsersCount = 0
  let updatedUsersCount = 0
  let noChangeUsersCount = 0
  let skippedUsersCount = 0
  let lastUserId: string | null = null

  for (const userDoc of snapshot.docs) {
    const userId = String(userDoc.get('user_id') ?? userDoc.id)
    if (userId === '') continue
    if (input.user_id_to != null && input.user_id_to !== '' && userId > input.user_id_to) {
      lastUserId = null
      break
    }

    const isDeleted = userDoc.get('is_deleted') === true
    if (isDeleted) {
      skippedUsersCount += 1
      lastUserId = userId
      continue
    }

    scannedUsersCount += 1
    try {
      const next: UserProfileCounts = await computeUserProfileCounts(userId)
      const existing = {
        participated_event_count: Number(userDoc.get('participated_event_count') ?? 0),
        friend_count: Number(userDoc.get('friend_count') ?? 0),
        joined_community_count: Number(userDoc.get('joined_community_count') ?? 0),
        managed_community_count: Number(userDoc.get('managed_community_count') ?? 0),
        ordered_food_count: Number(userDoc.get('ordered_food_count') ?? 0),
      }
      const changed = hasCountsChanged(existing, next)
      if (changed) {
        updatedUsersCount += 1
        if (!dryRun) {
          await updateUserProfileCounts(userId, next)
        }
      } else {
        noChangeUsersCount += 1
        if (!dryRun) {
          // 既存値と一致していても counts_updated_at は更新しておく（バックフィル完了の証跡として）
          await updateUserProfileCounts(userId, next)
        }
      }
    } catch (error) {
      logger.error('Failed to backfill user profile counts', { userId, error })
      skippedUsersCount += 1
    }
    lastUserId = userId
  }

  const hasMore = snapshot.size >= MAX_USERS_PER_RUN && lastUserId != null
  const resumeToken = hasMore && lastUserId != null ? encodeCursor({ user_id: lastUserId }) : null

  logger.info('User profile counts backfill batch completed', {
    dry_run: dryRun,
    scanned_users_count: scannedUsersCount,
    updated_users_count: updatedUsersCount,
    no_change_users_count: noChangeUsersCount,
    skipped_users_count: skippedUsersCount,
    resume_token: resumeToken,
  })

  return {
    dry_run: dryRun,
    scanned_users_count: scannedUsersCount,
    updated_users_count: updatedUsersCount,
    no_change_users_count: noChangeUsersCount,
    skipped_users_count: skippedUsersCount,
    resume_token: resumeToken,
  }
}
