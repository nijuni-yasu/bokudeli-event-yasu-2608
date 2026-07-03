import { createModuleLogger } from './utils/logger.js'
import { recalcEventMembers } from './utils/recalcEventMembers.js'
import { getCommunity } from './stores/community.js'
import { getOrders } from './stores/memberOrder.js'
import { sendOrderCompletionMails } from './orderCompletionMail.js'
import { trySendPopularEventMailAfterMembersSync } from './popularEventMail.js'
import { syncEventChatMember } from './syncEventChatMember.js'
import type { ShokujiiEvent } from './stores/event.js'
import { addEventToFriendHistoryForAnchor } from './utils/friendsService.js'
import { recountUserProfileCounts } from './utils/recountUserProfileCounts.js'

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
    logger.info('sideEffect:start', { step: 'recalcEventMembers', communityId, eventId, userId })
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

  // ordered な member_orders から友達グラフ（user_friends）に当該イベントの履歴を反映する
  try {
    logger.info('sideEffect:start', { step: 'addEventToFriendHistoryForAnchor', communityId, eventId, userId })
    const orderedOrders = await getOrders(communityId, eventId, 'ordered')
    const orderedUserIds = [...new Set(orderedOrders.map((order) => order.user_id))]
    const counterpartUserIds = orderedUserIds.filter((id) => id !== userId)
    await addEventToFriendHistoryForAnchor({
      event_id: eventId,
      community_id: communityId,
      event_at: event.event_start_datetime,
      anchor_user_id: userId,
      counterpart_user_ids: counterpartUserIds,
    })
  } catch (error) {
    logger.error('addEventToFriendHistoryForAnchor failed', {
      error,
      communityId,
      eventId,
      userId,
    })
  }

  // コミュニティの members にユーザーを追加する
  try {
    logger.info('sideEffect:start', { step: 'community.addMember', communityId, eventId, userId })
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
    logger.info('sideEffect:start', { step: 'sendOrderCompletionMails', communityId, eventId, userId })
    await sendOrderCompletionMails(event, userId)
  } catch (error) {
    logger.error('Failed to send order completion mails', {
      error,
      eventId,
      userId,
    })
  }

  if (recalcSucceeded) {
    try {
      await syncEventChatMember({ event, userId })
    } catch (error) {
      logger.error('syncEventChatMember failed after order confirm', {
        error,
        communityId,
        eventId,
        userId,
      })
    }

    // 閾値を満たすときのみ全ユーザー向け人気イベントメール（トランザクション内で冪等フラグ）
    try {
      logger.info('sideEffect:start', { step: 'trySendPopularEventMailAfterMembersSync', communityId, eventId, userId })
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

  // 注文確定したユーザーのマイページ用カウント（ordered_food_count / participated_event_count）を再集計する
  try {
    logger.info('sideEffect:start', { step: 'recountUserProfileCounts', communityId, eventId, userId })
    await recountUserProfileCounts(userId)
  } catch (error) {
    logger.error('recountUserProfileCounts failed after order confirmed', {
      error,
      communityId,
      eventId,
      userId,
    })
  }
}
