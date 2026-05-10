import { createModuleLogger } from './utils/logger.js'
import { recalcEventMembers } from './utils/recalcEventMembers.js'
import type { ShokujiiEvent } from './stores/event.js'

const logger = createModuleLogger('orderCanceledSideEffects')

/**
 * 注文キャンセル後に event.members を ordered から再集約する。
 * 将来、キャンセル専用の通知などをここに追加する。
 */
export async function applyOrderCanceledSideEffects(params: { event: ShokujiiEvent; userId: string }): Promise<void> {
  const { event, userId } = params
  const { community_id: communityId, id: eventId } = event

  try {
    const result = await recalcEventMembers(event)
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
}
