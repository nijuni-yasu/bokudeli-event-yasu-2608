import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { createModuleLogger } from './utils/logger.js'
import { recountUserProfileCounts } from './utils/recountUserProfileCounts.js'

const logger = createModuleLogger('communityMemberCountsTrigger')

/**
 * `communities/{communityId}/members/{userId}` の onDocumentWritten で、
 * マイページ用の `joined_community_count` / `managed_community_count` を再集計する。
 *
 * - 参加・脱退（doc 追加・削除）と、`roles` の変更（manager 付与・剥奪）の両方を同 Trigger でカバーする
 * - 件数集計は `recountUserProfileCounts` 内で親 `communities.members` / `managers` 配列を count する（RC-55）。
 *   サブコレ書き込み後に本 Trigger が発火する。legacy 同期完了前の一時ズレは次回再集計で収束する想定。
 */
export const onCommunityMemberWritten = onDocumentWritten(
  {
    document: 'communities/{communityId}/members/{userId}',
    region: 'asia-northeast1',
  },
  async (event) => {
    const userId = event.params.userId
    if (userId === '') {
      logger.warn('Empty userId, skip recount')
      return
    }
    try {
      await recountUserProfileCounts(userId)
    } catch (error) {
      logger.error('recountUserProfileCounts failed in onCommunityMemberWritten', {
        error,
        communityId: event.params.communityId,
        userId,
      })
    }
  },
)
