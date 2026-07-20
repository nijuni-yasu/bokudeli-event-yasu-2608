import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { sendCommunityManagerRoleChangeMails } from './communityMail.js'
import { getCommunity } from './stores/community.js'
import { isEnterpriseCommunity } from './utils/enterpriseMail.js'
import { createModuleLogger } from './utils/logger.js'
import { recalcCommunityMembers } from './utils/recalcCommunityMembers.js'
import { recountUserProfileCounts } from './utils/recountUserProfileCounts.js'

const logger = createModuleLogger('communityMemberCountsTrigger')

/**
 * `communities/{communityId}/members/{userId}` の onDocumentWritten ハンドラ本体。
 * Trigger 定義とテストの両方から呼び出す。
 *
 * - 親 `communities` の `community_num_members` / `members` / `managers` を再集計（legacy 統合）
 * - マネージャー追加・削除メールを送信（legacy 統合）
 * - マイページ用の `joined_community_count` / `managed_community_count` を再集計
 *
 * 同一パスに legacy `on_write_community_members` が存在していたため、本 Trigger に統合する。
 */
export async function handleCommunityMemberWritten(communityId: string, userId: string): Promise<void> {
  if (userId === '') {
    logger.warn('Empty userId, skip processing')
    return
  }

  const recalcResult = await recalcCommunityMembers(communityId)
  if (recalcResult.addedManagerIds.length > 0 || recalcResult.removedManagerIds.length > 0) {
    const community = await getCommunity(communityId)
    if (!isEnterpriseCommunity(community)) {
      await sendCommunityManagerRoleChangeMails({
        communityAccount: recalcResult.communityAccount,
        communityName: recalcResult.communityName,
        addedManagerIds: recalcResult.addedManagerIds,
        removedManagerIds: recalcResult.removedManagerIds,
      })
    }
  }

  try {
    await recountUserProfileCounts(userId)
  } catch (error) {
    logger.error('recountUserProfileCounts failed in onCommunityMemberWritten', {
      error,
      communityId,
      userId,
    })
  }
}

export const onCommunityMemberWritten = onDocumentWritten(
  {
    document: 'communities/{communityId}/members/{userId}',
    region: 'asia-northeast1',
    secrets: ['SENDGRID_API_KEY'],
  },
  async (event) => {
    const { communityId, userId } = event.params
    await handleCommunityMemberWritten(communityId, userId)
  },
)
