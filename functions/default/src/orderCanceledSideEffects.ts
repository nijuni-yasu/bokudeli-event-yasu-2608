import { createModuleLogger } from './utils/logger.js'
import { recalcEventMembers } from './utils/recalcEventMembers.js'
import { getMemberIds, getOrders } from './stores/memberOrder.js'
import { syncEventChatMember } from './syncEventChatMember.js'
import type { ShokujiiEvent } from './stores/event.js'
import { removeEventFromFriendHistory } from './utils/friendsService.js'
import { recountUserProfileCounts } from './utils/recountUserProfileCounts.js'

const logger = createModuleLogger('orderCanceledSideEffects')

/**
 * 注文キャンセル後に event.members を ordered から再集約し、友達グラフから当該イベントの履歴を取り除く。
 * cancelOrders から呼び出す（member_orders 単位の onDocumentWritten では N 回発火するため廃止）。
 */
export async function applyOrderCanceledSideEffects(params: { event: ShokujiiEvent; userId: string }): Promise<void> {
  const { event, userId } = params
  const { community_id: communityId, id: eventId } = event

  let recalcSucceeded = false
  try {
    const result = await recalcEventMembers(event)
    recalcSucceeded = true
    if (result.updated) {
      logger.info('Event members 再集約（キャンセル後）', {
        communityId,
        eventId,
        userId,
        memberCount: result.memberCount,
      })
    }
  } catch (error) {
    logger.error('recalcEventMembers failed after cancel', {
      error,
      communityId,
      eventId,
      userId,
    })
  }

  if (recalcSucceeded) {
    try {
      await syncEventChatMember({ event, userId })
    } catch (error) {
      logger.error('syncEventChatMember failed after cancel', {
        error,
        communityId,
        eventId,
        userId,
      })
    }
  }

  // 友達グラフから当該イベントの履歴を取り除く（当該ユーザー×イベントで ordered が 0 件のときのみ。部分キャンセルは RC-45）
  try {
    const remainingOrdered = (await getOrders(communityId, eventId, 'ordered')).filter((o) => o.user_id === userId)
    if (remainingOrdered.length === 0) {
      const memberIds = await getMemberIds(communityId, eventId)
      await removeEventFromFriendHistory({
        event_id: eventId,
        anchor_user_id: userId,
        counterpart_user_ids: memberIds.filter((id) => id !== userId),
      })
    }
  } catch (error) {
    logger.error('removeEventFromFriendHistory failed', {
      error,
      communityId,
      eventId,
      userId,
    })
  }

  // キャンセルしたユーザーのマイページ用カウント（ordered_food_count / participated_event_count）を再集計する
  try {
    await recountUserProfileCounts(userId)
  } catch (error) {
    logger.error('recountUserProfileCounts failed after order canceled', {
      error,
      communityId,
      eventId,
      userId,
    })
  }
}
