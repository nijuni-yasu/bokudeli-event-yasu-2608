import { getFirestore } from 'firebase-admin/firestore'
import { DateTime } from 'luxon'
import Stripe from 'stripe'
import { getEventInCommunity } from './stores/event.js'
import { getEventBulkCancelPipeline } from './stores/eventBulkCancelPipeline.js'
import { recalcEventMembers } from './utils/recalcEventMembers.js'
import { applyBulkEventCancelInTransaction } from './applyBulkEventCancelInTransaction.js'
import { finishBulkEventCancelPostProcessing } from './finishBulkEventCancelPostProcessing.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('cancelEventBulkCore')

export type CancelEventBulkInitiator = 'minimum_participants' | 'organizer_manual' | 'support'

export type CancelEventBulkCoreParams = {
  community_id: string
  event_id: string
  cancel_reason: string
  canceled_by: string
  initiator: CancelEventBulkInitiator
  /** minimum_participants 監査ログ用 */
  min_required?: number
  stripe: Stripe
}

export type CancelEventBulkCoreResult =
  | { outcome: 'already_canceled'; refundErrorsCount: number; orderCount: number }
  | {
      outcome: 'canceled'
      orderCount: number
      refundErrorsCount: number
    }

/**
 * 中止済みイベントに対する呼び出し。本機能の一括中止で pipeline が作られ後処理が未完了の場合のみ再開する。
 * pipeline が無い（本機能以外の経路で中止済み）・完了済みの場合は何もしない（べき等）。
 */
async function resumeAlreadyCanceled(
  params: CancelEventBulkCoreParams,
  nowMillis: number,
): Promise<CancelEventBulkCoreResult> {
  const { community_id, event_id } = params
  const pipeline = await getEventBulkCancelPipeline(community_id, event_id)
  if (pipeline == null || !pipeline.isPostProcessingIncomplete) {
    logger.info('cancelEventBulkCore idempotent skip', { community_id, event_id })
    return {
      outcome: 'already_canceled',
      orderCount: pipeline?.bulk_canceled_order_ids.length ?? 0,
      refundErrorsCount: 0,
    }
  }

  logger.info('cancelEventBulkCore resume post-processing', { community_id, event_id })
  const resumed = await finishBulkEventCancelPostProcessing({ ...params, nowMillis })
  return {
    outcome: 'already_canceled',
    orderCount: resumed.orderCount,
    refundErrorsCount: resumed.refundErrorsCount,
  }
}

export async function cancelEventBulkCore(params: CancelEventBulkCoreParams): Promise<CancelEventBulkCoreResult> {
  const { community_id, event_id, cancel_reason, canceled_by, initiator, min_required, stripe } = params
  const nowMillis = DateTime.now().toMillis()

  const eventBefore = await getEventInCommunity(community_id, event_id)
  if (eventBefore == null || eventBefore.is_deleted) {
    throw new Error('イベントが見つかりません')
  }

  if (eventBefore.event_status.value === 'event_canceled') {
    return resumeAlreadyCanceled(params, nowMillis)
  }

  const calculatedStatus = eventBefore.calculatedEventStatus
  if (calculatedStatus !== 'applying_reservation' && calculatedStatus !== 'accepting_order') {
    throw new Error(`このステータスでは一括中止できません: ${calculatedStatus}`)
  }

  await recalcEventMembers(eventBefore)

  const canceledOrders = await getFirestore().runTransaction(async (transaction) => {
    return applyBulkEventCancelInTransaction({
      community_id,
      event_id,
      cancel_reason,
      canceled_by,
      nowMillis,
      transaction,
    })
  })

  if (canceledOrders === null) {
    return resumeAlreadyCanceled(params, nowMillis)
  }

  const post = await finishBulkEventCancelPostProcessing({
    community_id,
    event_id,
    cancel_reason,
    canceled_by,
    initiator,
    min_required,
    stripe,
    nowMillis,
    canceledOrders,
  })

  logger.info('cancelEventBulkCore completed', {
    community_id,
    event_id,
    orderCount: post.orderCount,
    refundErrorsCount: post.refundErrorsCount,
    initiator,
  })

  return { outcome: 'canceled', orderCount: post.orderCount, refundErrorsCount: post.refundErrorsCount }
}
