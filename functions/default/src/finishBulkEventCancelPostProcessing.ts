import type Stripe from 'stripe'
import type { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import { getEventInCommunity } from './stores/event.js'
import { getOrders } from './stores/memberOrder.js'
import { getEventBulkCancelPipeline, saveEventBulkCancelPipeline } from './stores/eventBulkCancelPipeline.js'
import { writeAuditLog } from './utils/auditLog.js'
import { applyOrderCanceledSideEffects } from './orderCanceledSideEffects.js'
import { refundMemberOrdersStripe } from './utils/refundMemberOrdersStripe.js'
import { sendEventBulkCancellationMails } from './eventBulkCancellationMail.js'
import { getEventEnterpriseId, sumEnterpriseSubsidyAmounts } from './utils/enterpriseSubsidyOrders.js'
import { removeEventFromFriendHistory } from './utils/friendsService.js'
import { createModuleLogger } from './utils/logger.js'
import type { CancelEventBulkInitiator } from './cancelEventBulkCore.js'

const logger = createModuleLogger('finishBulkEventCancelPostProcessing')

export type FinishBulkEventCancelPostProcessingParams = {
  community_id: string
  event_id: string
  cancel_reason: string
  canceled_by: string
  initiator: CancelEventBulkInitiator
  min_required?: number
  stripe: Stripe
  nowMillis: number
  /** 一括中止トランザクション直後の canceled 注文。再開時は省略可（pipeline のスナップショットから復元） */
  canceledOrders?: EventMemberOrder[]
}

export type FinishBulkEventCancelPostProcessingResult = {
  refundErrorsCount: number
  orderCount: number
}

/** 再開時に canceled 注文を pipeline のスナップショットで絞り込む（事前の個別キャンセル分を混入させない） */
async function loadBulkCanceledOrders(
  communityId: string,
  eventId: string,
  bulkCanceledOrderIds: string[],
  canceledOrdersInput: EventMemberOrder[] | undefined,
): Promise<EventMemberOrder[]> {
  if (canceledOrdersInput != null) {
    return canceledOrdersInput
  }
  const bulkCanceledIdSet = new Set(bulkCanceledOrderIds)
  const allCanceled = await getOrders(communityId, eventId, 'canceled')
  return allCanceled.filter((o) => bulkCanceledIdSet.has(o.id))
}

export async function finishBulkEventCancelPostProcessing(
  params: FinishBulkEventCancelPostProcessingParams,
): Promise<FinishBulkEventCancelPostProcessingResult> {
  const {
    community_id,
    event_id,
    cancel_reason,
    canceled_by,
    initiator,
    min_required,
    stripe,
    nowMillis,
    canceledOrders: canceledOrdersInput,
  } = params

  const eventAfter = await getEventInCommunity(community_id, event_id)
  if (eventAfter == null) {
    throw new Error('イベント更新後の読み込みに失敗しました')
  }
  if (eventAfter.event_status.value !== 'event_canceled') {
    throw new Error('一括中止後処理は event_canceled のイベントのみ対象です')
  }

  const pipeline = await getEventBulkCancelPipeline(community_id, event_id)
  if (pipeline == null) {
    // 一括中止トランザクション（applyBulkEventCancelInTransaction）が必ず作成するため、
    // 無い場合は本機能以外の経路で中止されたイベント。後処理してはいけない
    throw new Error('一括中止パイプラインが見つかりません')
  }

  const canceledOrders = await loadBulkCanceledOrders(
    community_id,
    event_id,
    pipeline.bulk_canceled_order_ids,
    canceledOrdersInput,
  )
  const participantUserIds = pipeline.participant_user_ids

  const eventPayment = eventAfter.event_payment
  const enterpriseId = getEventEnterpriseId(eventAfter)

  if (
    eventPayment === 'enterprise_subsidy' &&
    enterpriseId != null &&
    canceledOrders.length > 0 &&
    !pipeline.enterprise_order_cancel_audit_done
  ) {
    const returnedSubsidy = sumEnterpriseSubsidyAmounts(canceledOrders)
    await writeAuditLog({
      enterpriseId,
      userId: canceled_by,
      action: 'order_cancel',
      targetType: 'order_session',
      details: {
        order_ids: canceledOrders.map((o) => o.id),
        returned_subsidy_amount: returnedSubsidy,
        bulk_event_cancel: true,
      },
    })
    pipeline.enterprise_order_cancel_audit_done = true
    await saveEventBulkCancelPipeline(community_id, event_id, pipeline)
  }

  const sideEffectsDone = new Set(pipeline.side_effects_user_ids)
  for (const userId of participantUserIds) {
    if (sideEffectsDone.has(userId)) {
      continue
    }
    try {
      await applyOrderCanceledSideEffects({
        event: eventAfter,
        userId,
        skipFriendHistoryRemoval: true,
      })
      sideEffectsDone.add(userId)
      pipeline.side_effects_user_ids = [...sideEffectsDone]
      await saveEventBulkCancelPipeline(community_id, event_id, pipeline)
    } catch (error) {
      logger.error('applyOrderCanceledSideEffects failed', {
        error,
        community_id,
        event_id,
        userId,
      })
    }
  }

  if (pipeline.friend_history_removed_at == null && participantUserIds.length > 0) {
    try {
      for (const anchorUserId of participantUserIds) {
        const counterparts = participantUserIds.filter((id) => id !== anchorUserId)
        if (counterparts.length === 0) {
          continue
        }
        await removeEventFromFriendHistory({
          event_id,
          anchor_user_id: anchorUserId,
          counterpart_user_ids: counterparts,
        })
      }
      pipeline.friend_history_removed_at = nowMillis
      await saveEventBulkCancelPipeline(community_id, event_id, pipeline)
    } catch (error) {
      logger.error('bulk cancel friend history removal failed', {
        error,
        community_id,
        event_id,
      })
    }
  }

  let refundErrorsCount = 0
  if (pipeline.stripe_refunds_done_at == null) {
    const hasStripePayment = canceledOrders.some((o) => o.stripe_id != null)
    if (hasStripePayment) {
      const { refundErrors } = await refundMemberOrdersStripe({
        communityId: community_id,
        eventId: event_id,
        orders: canceledOrders,
        stripe,
        nowMillis,
      })
      refundErrorsCount = refundErrors.length
    }
    // 失敗が残る場合は確定させず、再開時に再試行する（成功分は refund_id とべき等キーで二重返金しない）
    if (refundErrorsCount === 0) {
      pipeline.stripe_refunds_done_at = nowMillis
      await saveEventBulkCancelPipeline(community_id, event_id, pipeline)
    }
  }

  // 完了マーカー（メール送信フラグ）より先に監査ログを確定させる
  if (
    initiator === 'minimum_participants' &&
    enterpriseId != null &&
    !pipeline.enterprise_event_auto_cancel_audit_done
  ) {
    await writeAuditLog({
      enterpriseId,
      userId: 'system',
      action: 'event_auto_cancel',
      targetType: 'event',
      targetId: event_id,
      details: {
        order_count: canceledOrders.length,
        min_required: min_required ?? null,
      },
    })
    pipeline.enterprise_event_auto_cancel_audit_done = true
    await saveEventBulkCancelPipeline(community_id, event_id, pipeline)
  }

  const needShopMail = pipeline.shop_mail_sent_at == null
  const needParticipantMail = pipeline.participant_mails_sent_at == null && participantUserIds.length > 0
  let mailResult = { shopMailSent: false, participantMailsSent: false }
  if (needShopMail || needParticipantMail) {
    mailResult = await sendEventBulkCancellationMails({
      event: eventAfter,
      cancelReason: cancel_reason,
      participantUserIds,
      includeShopMail: needShopMail,
      includeParticipantMail: needParticipantMail,
    })
  }
  let mailFlagsChanged = false
  if (needShopMail && mailResult.shopMailSent) {
    pipeline.shop_mail_sent_at = nowMillis
    mailFlagsChanged = true
  }
  if (
    pipeline.participant_mails_sent_at == null &&
    (participantUserIds.length === 0 || mailResult.participantMailsSent)
  ) {
    pipeline.participant_mails_sent_at = nowMillis
    mailFlagsChanged = true
  }
  if (mailFlagsChanged) {
    await saveEventBulkCancelPipeline(community_id, event_id, pipeline)
  }

  logger.info('finishBulkEventCancelPostProcessing completed', {
    community_id,
    event_id,
    orderCount: canceledOrders.length,
    refundErrorsCount,
    initiator,
  })

  return { refundErrorsCount, orderCount: canceledOrders.length }
}
