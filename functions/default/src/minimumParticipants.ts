import { DateTime } from 'luxon'
import Stripe from 'stripe'
import { defineSecret } from 'firebase-functions/params'
import {
  getAcceptingOrderEventsByMinimumParticipantsJudgmentTime,
  getAcceptingOrderEventsWithPastMinimumParticipantsJudgment,
  getEventCanceledMinimumParticipantsForPostProcessing,
  type ShokujiiEvent,
} from './stores/event.js'
import { getEventBulkCancelPipeline } from './stores/eventBulkCancelPipeline.js'
import { finishBulkEventCancelPostProcessing } from './finishBulkEventCancelPostProcessing.js'
import { runMinimumParticipantsJudgmentTransaction } from './minimumParticipantsJudgment.js'
import { createModuleLogger } from './utils/logger.js'
import { MINIMUM_PARTICIPANTS_CANCEL_REASON } from '@shokujii/common/utils/minimumParticipants.js'

const logger = createModuleLogger('minimumParticipants')

const STRIPE_API_KEY = defineSecret('STRIPE_API_KEY')

/**
 * 中止済みイベントの後処理再開を試みる期間（判定日時からの経過）。
 * 全期間の collectionGroup スキャンを避けるための上限。超過分は手動対応とする（エラーログ参照）
 */
const BULK_CANCEL_RESUME_LOOKBACK_MILLIS = 7 * 24 * 60 * 60 * 1000

function isUnevaluatedMinimumParticipants(event: ShokujiiEvent): boolean {
  const mp = event.minimum_participants
  return mp?.enabled === true && mp.judgment_evaluated_at == null
}

function dedupeEventsByKey(events: ShokujiiEvent[]): ShokujiiEvent[] {
  const map = new Map<string, ShokujiiEvent>()
  for (const event of events) {
    map.set(`${event.community_id}\t${event.id}`, event)
  }
  return [...map.values()]
}

async function evaluateOneMinimumParticipantsEvent(event: ShokujiiEvent, stripe: Stripe): Promise<void> {
  const mp = event.minimum_participants
  if (mp == null) {
    return
  }

  const nowMillis = DateTime.now().toMillis()

  if (event.event_status.value === 'event_canceled' && mp.judgment_evaluated_at != null) {
    try {
      await finishBulkEventCancelPostProcessing({
        community_id: event.community_id,
        event_id: event.id,
        cancel_reason: MINIMUM_PARTICIPANTS_CANCEL_REASON,
        canceled_by: 'system',
        initiator: 'minimum_participants',
        min_required: mp.count,
        stripe,
        nowMillis,
      })
    } catch (error) {
      // pipeline が未完了のままなら次回のポーリングで再開されるため、ここでは握りつぶして他イベントの処理を優先する
      logger.error('finishBulkEventCancelPostProcessing resume failed', {
        error,
        communityId: event.community_id,
        eventId: event.id,
      })
    }
    return
  }

  if (mp.judgment_evaluated_at != null) {
    return
  }

  const judgment = await runMinimumParticipantsJudgmentTransaction({
    community_id: event.community_id,
    event_id: event.id,
    nowMillis,
  })

  if (judgment.kind === 'skipped' || judgment.kind === 'continued') {
    return
  }

  try {
    await finishBulkEventCancelPostProcessing({
      community_id: event.community_id,
      event_id: event.id,
      cancel_reason: judgment.cancel_reason,
      canceled_by: 'system',
      initiator: 'minimum_participants',
      min_required: mp.count,
      stripe,
      nowMillis,
      canceledOrders: judgment.canceledOrders,
    })
  } catch (error) {
    logger.error('finishBulkEventCancelPostProcessing failed for minimum participants', {
      error,
      communityId: event.community_id,
      eventId: event.id,
    })
    throw error
  }
}

export async function processMinimumParticipantsChecks(startTimeMillis: number, endTimeMillis: number): Promise<void> {
  const stripe = new Stripe(STRIPE_API_KEY.value(), {
    apiVersion: '2026-02-25.clover',
    maxNetworkRetries: 3,
  })

  const [windowEvents, catchUpEvents, resumeCandidates] = await Promise.all([
    getAcceptingOrderEventsByMinimumParticipantsJudgmentTime(startTimeMillis, endTimeMillis),
    getAcceptingOrderEventsWithPastMinimumParticipantsJudgment(endTimeMillis),
    getEventCanceledMinimumParticipantsForPostProcessing(endTimeMillis - BULK_CANCEL_RESUME_LOOKBACK_MILLIS),
  ])

  const unevaluatedTargets = dedupeEventsByKey([...windowEvents, ...catchUpEvents]).filter(
    isUnevaluatedMinimumParticipants,
  )

  const dedupedResumeCandidates = dedupeEventsByKey(resumeCandidates)
  const resumePipelines = await Promise.all(
    dedupedResumeCandidates.map((event) => getEventBulkCancelPipeline(event.community_id, event.id)),
  )
  const resumeTargets = dedupedResumeCandidates.filter((_, index) => {
    const pipeline = resumePipelines[index]
    return pipeline != null && pipeline.isPostProcessingIncomplete
  })

  const targets = dedupeEventsByKey([...unevaluatedTargets, ...resumeTargets])

  await Promise.all(
    targets.map(async (event) => {
      try {
        await evaluateOneMinimumParticipantsEvent(event, stripe)
      } catch (error) {
        logger.error('minimum participants evaluation failed', {
          error,
          communityId: event.community_id,
          eventId: event.id,
        })
      }
    }),
  )
}
