import { countJoinedCommunitiesForUser, countManagedCommunitiesForUser } from '../stores/community.js'
import { countOrderedFoodsForUser, countParticipatedEventsForUser } from '../stores/memberOrder.js'
import { listFriendUserIds } from '../stores/userFriend.js'
import {
  getUser,
  getUsersByUserIds,
  updateUserProfileCounts,
  type ShokujiiUser,
  type UserProfileCountsUpdate,
} from '../stores/user.js'
import { createModuleLogger } from './logger.js'
import { classifyEnterpriseFriend } from './enterpriseFriendVisibility.js'

const logger = createModuleLogger('recountUserProfileCounts')

export type UserProfileCounts = UserProfileCountsUpdate

export type ComputeUserProfileCountsOptions = {
  enterpriseId?: string
}

/**
 * ユーザーの友人 ID 一覧から、表示可能な友人件数を返す。
 * PF: 退会者除外。エンプラ: §5.3.2 と同じ除外ルール。
 */
export const computeActiveFriendCount = async (
  friendUserIds: string[],
  options?: ComputeUserProfileCountsOptions,
): Promise<number> => {
  if (friendUserIds.length === 0) {
    return 0
  }
  const userMap = await getUsersByUserIds(friendUserIds)
  const enterpriseId = options?.enterpriseId

  if (enterpriseId == null || enterpriseId === '') {
    let active = 0
    for (const id of friendUserIds) {
      const user = userMap.get(id)
      if (user != null && !user.is_deleted) {
        active += 1
      }
    }
    return active
  }

  let active = 0
  for (const id of friendUserIds) {
    const user = userMap.get(id)
    if (user == null) {
      continue
    }
    const visibility = await classifyEnterpriseFriend(user, enterpriseId)
    if (visibility.include) {
      active += 1
    }
  }
  return active
}

/**
 * 指定ユーザーの最新カウントを集計のみ行う（書き込みなし）。
 * 仕様書 5.1.3 のクエリ・ルールに従う:
 *   - friend_count: `users/{uid}/friends` から退会者を除外した件数
 *   - participated_event_count: `member_orders` の ordered からイベントをユニーク化（キャンセル・削除除外。RC-57）
 *   - ordered_food_count: `member_orders` collection group で `user_id == uid + status == 'ordered'`
 *   - joined_community_count: `communities.members` array-contains userRef（RC-55）
 *   - managed_community_count: `communities.managers` array-contains userRef（RC-55）
 */
export const computeUserProfileCounts = async (
  userId: string,
  options?: ComputeUserProfileCountsOptions,
): Promise<UserProfileCounts> => {
  const enterpriseId = options?.enterpriseId
  const friendUserIds = await listFriendUserIds(userId)

  const [participatedCount, orderedFoodCount, joinedCount, managedCount, activeFriendCount] = await Promise.all([
    countParticipatedEventsForUser(userId, enterpriseId),
    countOrderedFoodsForUser(userId, enterpriseId),
    countJoinedCommunitiesForUser(userId, enterpriseId),
    countManagedCommunitiesForUser(userId, enterpriseId),
    computeActiveFriendCount(friendUserIds, options),
  ])

  return {
    participated_event_count: participatedCount,
    friend_count: activeFriendCount,
    joined_community_count: joinedCount,
    managed_community_count: managedCount,
    ordered_food_count: orderedFoodCount,
  }
}

/**
 * 既存の `User` ドキュメントの値と新カウントを比較し、いずれかが異なれば true を返す。
 * `counts_updated_at` の有無は判定に含めない（値そのもの）。
 */
export const hasCountsChanged = (existing: UserProfileCountsUpdate, next: UserProfileCounts): boolean => {
  return (
    (existing.participated_event_count ?? 0) !== next.participated_event_count ||
    (existing.friend_count ?? 0) !== next.friend_count ||
    (existing.joined_community_count ?? 0) !== next.joined_community_count ||
    (existing.managed_community_count ?? 0) !== next.managed_community_count ||
    (existing.ordered_food_count ?? 0) !== next.ordered_food_count
  )
}

const resolveCountOptions = (user: ShokujiiUser): ComputeUserProfileCountsOptions | undefined => {
  const enterpriseId = user.enterprise_id
  if (enterpriseId == null || enterpriseId === '') {
    return undefined
  }
  return { enterpriseId }
}

/**
 * 指定ユーザーのプロフィールカウントを再集計し、`users/{uid}` に書き戻す。
 *
 * - 退会済みユーザーは何もせず終了する（再集計対象外）
 * - 集計値は count() aggregation を `Promise.all` で並列実行する
 * - 失敗時は何も書き戻さない（古い値を温存）
 *
 * @param userId 再集計対象のユーザー ID
 */
export const recountUserProfileCounts = async (userId: string): Promise<void> => {
  if (userId === '') {
    logger.warn('Empty userId, skip recount')
    return
  }

  try {
    const user = await getUser(userId, false)
    if (user == null) {
      logger.warn('User not found, skip recount', { userId })
      return
    }
    if (user.is_deleted) {
      logger.info('User is deleted, skip recount', { userId })
      return
    }

    const next = await computeUserProfileCounts(userId, resolveCountOptions(user))

    await updateUserProfileCounts(userId, next)

    logger.info('Recount completed', { userId, ...next })
  } catch (error) {
    logger.error('Recount failed', { userId, error })
  }
}

/**
 * 複数ユーザーのプロフィールカウントを並列で再集計する。
 * 1 つでも失敗しても他には影響しない（`recountUserProfileCounts` 内で吸収）。
 */
export const recountUserProfileCountsForUsers = async (userIds: string[]): Promise<void> => {
  const unique = [...new Set(userIds.filter((id) => id !== ''))]
  if (unique.length === 0) {
    return
  }
  await Promise.allSettled(unique.map((id) => recountUserProfileCounts(id)))
}
