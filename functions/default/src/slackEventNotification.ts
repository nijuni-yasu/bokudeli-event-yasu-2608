import { DateTime } from 'luxon'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import {
  getAcceptingOrderEventsByEndTime,
  getAcceptingOrderEventsByStartTime,
  getAcceptingOrderEventsByTime,
} from './stores/event.js'
import { getCommunityBots } from './stores/slackBot.js'
import { getEventUrlForEvent } from './utils/urls.js'
import { sendCommunityBotsMessage } from './utils/slackMessage.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('slackEventNotification')

const makeNotificationOrderMessage = (eventName: string, beforeDays: number, eventUrl: string): string =>
  beforeDays > 0
    ? `<${eventUrl}|${eventName}> の食事会が注文期限${beforeDays}日前となりました。忘れずに注文しよう！`
    : `<${eventUrl}|${eventName}> の食事会が注文が確定しました。参加者はこちらのみなさんです。当日をお楽しみに！`

const makeEventStartMessage = (eventName: string, minutes: number, eventUrl: string): string =>
  `<${eventUrl}|${eventName}> の食事会が開始${minutes}分前になりました。`

const makeEventEndMessage = (eventName: string, eventUrl: string): string =>
  `<${eventUrl}|${eventName}> の食事会が終了しました。次回開催をお楽しみに！`

const notifyEvents = async (
  events: Awaited<ReturnType<typeof getAcceptingOrderEventsByTime>>,
  buildMessage: (eventName: string, eventUrl: string) => string,
): Promise<void> => {
  if (events.length === 0) {
    return
  }

  const results = await Promise.allSettled(
    events.map(async (event) => {
      // エンプラコミュニティのイベントは EVENT_HOST では 404 になるため、テナントの host を解決する
      const eventUrl = await getEventUrlForEvent(event)
      if (eventUrl == null) {
        logger.error('Skipped Slack notification because event host is unresolved', {
          eventId: event.id,
          enterpriseId: event.enterprise_id,
        })
        return
      }
      const message = buildMessage(event.event_name, eventUrl)
      const bots = await getCommunityBots(event.community_id)
      await sendCommunityBotsMessage(event.community_id, bots, message)
    }),
  )

  const failedCount = results.filter((r) => r.status === 'rejected').length
  if (failedCount > 0) {
    logger.warn('Failed to notify some events', {
      totalEvents: events.length,
      failedCount,
      successCount: results.length - failedCount,
    })
  }
}

const notificationOrder = async (start: number, end: number, beforeDays: number): Promise<void> => {
  const startAddedDays = start + beforeDays * 24 * 60 * 60 * 1000
  const endAddedDays = end + beforeDays * 24 * 60 * 60 * 1000
  const events = await getAcceptingOrderEventsByTime(startAddedDays, endAddedDays)
  await notifyEvents(events, (eventName, eventUrl) => makeNotificationOrderMessage(eventName, beforeDays, eventUrl))
}

const notificationEventStart = async (start: number, end: number, beforeMinutes: number): Promise<void> => {
  const startAddedMinutes = start + beforeMinutes * 60 * 1000
  const endAddedMinutes = end + beforeMinutes * 60 * 1000
  const events = await getAcceptingOrderEventsByStartTime(startAddedMinutes, endAddedMinutes)
  await notifyEvents(events, (eventName, eventUrl) => makeEventStartMessage(eventName, beforeMinutes, eventUrl))
}

const notificationEventEnd = async (start: number, end: number): Promise<void> => {
  const events = await getAcceptingOrderEventsByEndTime(start, end)
  await notifyEvents(events, (eventName, eventUrl) => makeEventEndMessage(eventName, eventUrl))
}

/** legacy eventNotification から移行。export 名を Slack 専用に変更。 */
export const slackEventNotification = onSchedule(
  {
    schedule: '*/1 * * * *',
    timeZone: 'Asia/Tokyo',
    region: 'asia-northeast1',
  },
  async (event) => {
    const scheduleTime = event.scheduleTime
    const now = scheduleTime != null ? DateTime.fromISO(scheduleTime).toMillis() : DateTime.now().toMillis()
    const end = Math.trunc(now / 60 / 1000) * 60 * 1000
    const start = end - 60 * 1000

    logger.info('slackEventNotification tick', { start, end })

    const jobResults = await Promise.allSettled([
      notificationOrder(start, end, 3),
      notificationOrder(start, end, 1),
      notificationOrder(start, end, 0),
      notificationEventStart(start, end, 60),
      notificationEventEnd(start, end),
    ])

    const failedJobs = jobResults.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    if (failedJobs.length > 0) {
      logger.error('slackEventNotification job failures', {
        failureCount: failedJobs.length,
        totalJobs: jobResults.length,
        reasons: failedJobs.map((r) => (r.reason instanceof Error ? r.reason.message : String(r.reason))),
      })
      throw failedJobs[0]!.reason
    }
  },
)
