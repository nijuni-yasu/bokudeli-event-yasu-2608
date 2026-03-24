import { sendDynamicTemplateWithPersonalizations } from './utils/sendgridBulk.js'
import { getUserPersonalInformation } from './stores/user.js'
import { getEventUrl } from './utils/urls.js'
import {
  convertToDateWeekdayShort,
  convertToDuration,
  convertToDatetimeWeekdayShort,
} from '@shokujii/common/utils/datetime.js'
import { DEFAULT_FROM } from './utils/mail.js'
import {
  getInCartOrdersByUpdatedTime,
  getAcceptingOrderEventsByTime,
  getEvent,
  type ShokujiiEvent,
} from './stores/event.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('inCartNotification')

const IN_CART_NOTIFICATION_ID = 'd-148ab4d0aef644de815cc684c92a87de'

async function getUserEmail(userId: string): Promise<string | undefined> {
  const userPersonalInformation = await getUserPersonalInformation(userId)
  return userPersonalInformation?.user_email
}

interface NotificationData {
  event: ShokujiiEvent
  userEmail: string
  userId: string
}

interface MailContent {
  to: string
  from: string
  templateId: string
  dynamicTemplateData: MailDynamicTemplateData
  userId: string
}

type MailDynamicTemplateData = {
  date?: string
  event_datetime?: string
  event_name: string
  event_cover_url?: string
  community_name: string
  event_address?: string
  shop_name?: string
  event_url: string
  event_deadline_datetime?: string
}

function buildInCartDynamicTemplateData(event: ShokujiiEvent): MailDynamicTemplateData {
  return {
    date: convertToDateWeekdayShort(event.event_start_datetime),
    event_datetime: convertToDuration(event.event_start_datetime, event.event_end_datetime),
    event_name: event.event_name,
    event_cover_url: event.event_cover_url,
    community_name: event.community_name,
    event_address: event.event_address,
    shop_name: event.shop_name,
    event_url: getEventUrl(event.community_account, event.id),
    event_deadline_datetime: convertToDatetimeWeekdayShort(event.event_deadline_datetime),
  }
}

function buildInCartNotificationMail(event: ShokujiiEvent, to: string, userId: string): MailContent {
  return {
    to,
    from: DEFAULT_FROM,
    templateId: IN_CART_NOTIFICATION_ID,
    dynamicTemplateData: buildInCartDynamicTemplateData(event),
    userId,
  }
}

/**
 * 1 回のジョブ実行あたり 1 ユーザー 1 通に絞る（SendGrid の同一宛先重複を避ける）。
 * どのイベントが送られるかは順序不定でよい仕様とする。
 */
function dedupeByUserIdKeepFirst<T extends { userId: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const item of items) {
    if (seen.has(item.userId)) {
      continue
    }
    seen.add(item.userId)
    out.push(item)
  }
  return out
}

export async function sendInCartNotificationToMember(start: number, end: number): Promise<void> {
  const notifyTime = 24 * 60 * 60 * 1000 // 1日
  const orders = await getInCartOrdersByUpdatedTime(start - notifyTime, end - notifyTime)

  const notificationDataList = await Promise.all(
    orders.map(async (order) => {
      const [event, userEmail] = await Promise.all([getEvent(order.event_id), getUserEmail(order.user_id)])
      if (!userEmail || !event) {
        return null
      }
      return { event, userEmail, userId: order.user_id }
    }),
  )

  const filteredNotificationDataList = notificationDataList
    .filter((notificationData): notificationData is NotificationData => notificationData !== null)
    .filter((notificationData) => {
      return start < notificationData.event.event_deadline_datetime
    })

  const dedupedNotificationDataList = dedupeByUserIdKeepFirst(filteredNotificationDataList)
  if (dedupedNotificationDataList.length < filteredNotificationDataList.length) {
    logger.info('Deduped in-cart notifications to one per user', {
      beforeCount: filteredNotificationDataList.length,
      afterCount: dedupedNotificationDataList.length,
    })
  }

  const bulkResult = await sendDynamicTemplateWithPersonalizations(
    {
      from: DEFAULT_FROM,
      templateId: IN_CART_NOTIFICATION_ID,
    },
    dedupedNotificationDataList.map((notificationData) => {
      const { event, userEmail } = notificationData
      return {
        to: userEmail,
        dynamicTemplateData: buildInCartDynamicTemplateData(event),
      }
    }),
    { feature: 'inCartNotification' },
  )

  if (bulkResult.errors.length > 0) {
    logger.warn('Failed to send in-cart notification', {
      totalRecipientsAccepted: bulkResult.totalRecipientsAccepted,
      batchesAttempted: bulkResult.batchesAttempted,
      batchesSucceeded: bulkResult.batchesSucceeded,
      batchesFailed: bulkResult.batchesFailed,
      recipientTargetCount: dedupedNotificationDataList.length,
      errors: bulkResult.errors,
    })
  }
}

export async function sendInCartEventDeadlineNotificationToMember(start: number, end: number): Promise<void> {
  const notifyTime = 24 * 60 * 60 * 1000 // 1日
  const events = await getAcceptingOrderEventsByTime(start + notifyTime, end + notifyTime)

  // 非同期で共有配列へ push するため、`mailContentList` の順は完了順に依存する。
  const mailContentList: MailContent[] = []
  await Promise.all(
    events.map(async (event) => {
      const orders = await event.getOrders('in_cart')
      return await Promise.all(
        orders.map(async (order) => {
          const userEmail = await getUserEmail(order.user_id)
          if (!userEmail) {
            return
          }
          mailContentList.push(buildInCartNotificationMail(event, userEmail, order.user_id))
        }),
      )
    }),
  )

  const dedupedMailContentList = dedupeByUserIdKeepFirst(mailContentList)
  if (dedupedMailContentList.length < mailContentList.length) {
    logger.info('Deduped in-cart event deadline notifications to one per user', {
      beforeCount: mailContentList.length,
      afterCount: dedupedMailContentList.length,
    })
  }

  const bulkResult = await sendDynamicTemplateWithPersonalizations(
    {
      from: DEFAULT_FROM,
      templateId: IN_CART_NOTIFICATION_ID,
    },
    dedupedMailContentList.map((mailContent) => ({
      to: mailContent.to,
      dynamicTemplateData: mailContent.dynamicTemplateData,
    })),
    { feature: 'inCartEventDeadlineNotification' },
  )

  if (bulkResult.errors.length > 0) {
    logger.warn('Failed to send in-cart event deadline notification', {
      totalRecipientsAccepted: bulkResult.totalRecipientsAccepted,
      batchesAttempted: bulkResult.batchesAttempted,
      batchesSucceeded: bulkResult.batchesSucceeded,
      batchesFailed: bulkResult.batchesFailed,
      recipientTargetCount: dedupedMailContentList.length,
      errors: bulkResult.errors,
    })
  }
}
