import { getFirestore } from 'firebase-admin/firestore'
import { DateTime } from 'luxon'
import Stripe from 'stripe'
import { defineSecret } from 'firebase-functions/params'
import { MINIMUM_PARTICIPANTS_CANCEL_REASON } from '@shokujii/common/utils/minimumParticipants.js'
import {
  getAcceptingOrderEventsByMinimumParticipantsJudgmentTime,
  getAcceptingOrderEventsWithPastMinimumParticipantsJudgment,
  getEventInCommunity,
  type ShokujiiEvent,
} from './stores/event.js'
import { recalcEventMembers } from './utils/recalcEventMembers.js'
import { cancelEventBulkCore } from './cancelEventBulkCore.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('minimumParticipants')

const STRIPE_API_KEY = defineSecret('STRIPE_API_KEY')

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

async function markMinimumParticipantsEvaluated(event: ShokujiiEvent, nowMillis: number): Promise<void> {
  const mp = event.minimum_participants
  if (mp == null) {
    return
  }
  await getFirestore().runTransaction(async (transaction) => {
    const fresh = await getEventInCommunity(event.community_id, event.id, transaction)
    if (fresh == null) {
      throw new Error('イベントが見つかりません')
    }
    const freshMp = fresh.minimum_participants
    if (freshMp == null || freshMp.judgment_evaluated_at != null) {
      return
    }
    await fresh.updateEvent(
      {
        minimum_participants: {
          ...freshMp,
          judgment_evaluated_at: nowMillis,
        },
      },
      'system',
      transaction,
    )
  })
}

async function evaluateOneMinimumParticipantsEvent(event: ShokujiiEvent, stripe: Stripe): Promise<void> {
  const mp = event.minimum_participants
  if (mp == null || mp.judgment_evaluated_at != null) {
    return
  }

  const nowMillis = DateTime.now().toMillis()

  const recalc = await recalcEventMembers(event)
  const memberCount = recalc.memberCount

  if (memberCount < mp.count) {
    try {
      await cancelEventBulkCore({
        community_id: event.community_id,
        event_id: event.id,
        cancel_reason: MINIMUM_PARTICIPANTS_CANCEL_REASON,
        canceled_by: 'system',
        initiator: 'minimum_participants',
        min_required: mp.count,
        stripe,
      })
    } catch (error) {
      logger.error('cancelEventBulkCore failed for minimum participants', {
        error,
        communityId: event.community_id,
        eventId: event.id,
      })
      throw error
    }
  }

  await markMinimumParticipantsEvaluated(event, nowMillis)
}

export async function processMinimumParticipantsChecks(startTimeMillis: number, endTimeMillis: number): Promise<void> {
  const stripe = new Stripe(STRIPE_API_KEY.value(), {
    apiVersion: '2026-02-25.clover',
    maxNetworkRetries: 3,
  })

  const [windowEvents, catchUpEvents] = await Promise.all([
    getAcceptingOrderEventsByMinimumParticipantsJudgmentTime(startTimeMillis, endTimeMillis),
    getAcceptingOrderEventsWithPastMinimumParticipantsJudgment(endTimeMillis),
  ])

  const targets = dedupeEventsByKey([...windowEvents, ...catchUpEvents]).filter(isUnevaluatedMinimumParticipants)

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
