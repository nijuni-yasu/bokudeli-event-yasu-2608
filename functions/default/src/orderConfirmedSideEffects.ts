import { createModuleLogger } from './utils/logger.js'
import { recalcEventMembers } from './utils/recalcEventMembers.js'
import { getCommunity } from './stores/community.js'
import { sendOrderCompletionMails } from './orderCompletionMail.js'
import { trySendPopularEventMailAfterMembersSync } from './popularEventMail.js'
import type { ShokujiiEvent } from './stores/event.js'

const logger = createModuleLogger('orderConfirmedSideEffects')

/**
 * 注文確定（member_orders が ordered になった）後に 1 回だけ呼ぶ。
 * confirmOrder / stripeWebhook から呼び出す（member_orders 単位の onDocumentWritten では N 回発火するため廃止）。
 */
export async function applyOrderConfirmedSideEffects(params: { event: ShokujiiEvent; userId: string }): Promise<void> {
  const { event, userId } = params
  const { community_id: communityId, id: eventId } = event

  let recalcResult = { updated: false, memberCount: 0 }
  let recalcSucceeded = false
  // ordered な member_orders から event.members / event_num_members を再集約する
  try {
    recalcResult = await recalcEventMembers(event)
    recalcSucceeded = true
    if (recalcResult.updated) {
      logger.info('Event members 更新', {
        communityId,
        eventId,
        memberCount: recalcResult.memberCount,
      })
    }
  } catch (error) {
    logger.error('recalcEventMembers failed', {
      error,
      communityId,
      eventId,
      userId,
    })
  }

  // コミュニティの members にユーザーを追加する
  try {
    const community = await getCommunity(communityId)
    if (community != null) {
      await community.addMember(userId)
    }
  } catch (error) {
    logger.error('community.addMember failed', {
      error,
      communityId,
      eventId,
      userId,
    })
  }

  // 注文完了メール（参加者・主催者）・公開イベント向け新着通知など
  try {
    await sendOrderCompletionMails(event, userId)
  } catch (error) {
    logger.error('Failed to send order completion mails', {
      error,
      eventId,
      userId,
    })
  }

  if (recalcSucceeded) {
    // 閾値を満たすときのみ全ユーザー向け人気イベントメール（トランザクション内で冪等フラグ）
    try {
      await trySendPopularEventMailAfterMembersSync({
        communityId,
        eventId,
        triggerUserId: userId,
      })
    } catch (error) {
      logger.error('Popular event mail after members sync failed', {
        error,
        communityId,
        eventId,
      })
    }
  }
}
