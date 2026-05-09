import { onCall, HttpsError } from 'firebase-functions/https'
import type { EventCopyRepeatRequest, EventCopyRepeatResponse } from '@shokujii/common/apis/eventCopyRepeat.js'
import { isInShopTime } from '@shokujii/common/utils/datetime.js'
import { copyEventCore } from './eventCopy.js'
import { getConfigGlobal } from './stores/config.js'
import { getCommunity } from './stores/community.js'
import { getEvent } from './stores/event.js'
import { getPartner } from './stores/partner.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('eventCopyRepeat')

const MAX_REPEAT = 12
/** dedupe 前の配列で受け付ける最大要素数（DoS 抑止。dedupe 後は最大 MAX_REPEAT） */
const MAX_RAW_START_TIMES_INPUT = 2000

const dedupeStartTimesPreserveOrder = (times: number[]): number[] => {
  const seen = new Set<number>()
  const out: number[] = []
  for (const t of times) {
    if (!seen.has(t)) {
      seen.add(t)
      out.push(t)
    }
  }
  return out
}

export const eventCopyRepeat = onCall<EventCopyRepeatRequest, Promise<EventCopyRepeatResponse>>(
  { timeoutSeconds: 540 },
  async (request) => {
    const startedAt = Date.now()
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be logged in')
    }
    const { uid } = request.auth
    const { srcEventId, startTimes: rawStartTimes } = request.data

    if (typeof srcEventId !== 'string' || srcEventId.trim() === '') {
      throw new HttpsError('invalid-argument', 'srcEventId must be a non-empty string')
    }
    if (!Array.isArray(rawStartTimes)) {
      throw new HttpsError('invalid-argument', 'startTimes must be an array')
    }
    if (rawStartTimes.length > MAX_RAW_START_TIMES_INPUT) {
      throw new HttpsError(
        'invalid-argument',
        `startTimes array exceeds maximum length of ${MAX_RAW_START_TIMES_INPUT}`,
      )
    }
    const startTimes = dedupeStartTimesPreserveOrder(rawStartTimes)
    if (
      startTimes.length < 1 ||
      startTimes.length > MAX_REPEAT ||
      startTimes.some((t) => typeof t !== 'number' || !Number.isFinite(t))
    ) {
      throw new HttpsError('invalid-argument', `startTimes must be an array of 1 to ${MAX_REPEAT} finite numbers`)
    }

    const srcEvent = await getEvent(srcEventId)
    if (srcEvent === undefined) {
      throw new HttpsError('not-found', 'Event not found')
    }
    const [community, partner, config] = await Promise.all([
      getCommunity(srcEvent.community_id),
      getPartner(srcEvent.partner_id),
      getConfigGlobal(),
    ])
    const isSupport = config?.isSupport(uid) ?? false
    const isManager = community != null && (await community.hasRole(uid, 'manager'))
    if (!isSupport && !isManager) {
      throw new HttpsError('permission-denied', 'Forbidden')
    }
    if (community == null) {
      throw new HttpsError('not-found', 'Community not found')
    }
    if (partner === undefined) {
      throw new HttpsError('not-found', 'Partner not found')
    }
    const shop = await partner.getShop(srcEvent.shop_id)
    if (shop === undefined) {
      throw new HttpsError('not-found', 'Shop not found')
    }

    const settled = await Promise.allSettled(
      startTimes.map(async (startTime) => {
        if (!isInShopTime(startTime, shop)) {
          throw new HttpsError('invalid-argument', 'Event time is not in shop time')
        }
        return copyEventCore(uid, srcEvent, shop, startTime)
      }),
    )

    const results = settled.map((r, i) => {
      const startTime = startTimes[i]!
      if (r.status === 'fulfilled') {
        return { ok: true as const, startTime, newEventId: r.value.newEventId }
      }
      const err = r.reason
      const reason = err instanceof HttpsError ? err.message : String(err)
      return { ok: false as const, startTime, reason }
    })

    const successCount = results.filter((x) => x.ok).length
    const failureCount = results.length - successCount

    logger.info('eventCopyRepeat completed', {
      uid,
      srcEventId,
      requestedCount: startTimes.length,
      successCount,
      failureCount,
      elapsedMs: Date.now() - startedAt,
    })

    return {
      results,
      successCount,
      failureCount,
    }
  },
)
