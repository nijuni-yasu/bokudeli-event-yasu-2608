import { send } from './utils/sendgrid.js'
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

const IN_CART_NOTIFICATION_ID = 'd-148ab4d0aef644de815cc684c92a87de'

async function getUserEmail(userId: string): Promise<string | undefined> {
  const userPersonalInformation = await getUserPersonalInformation(userId)
  return userPersonalInformation?.user_email
}

interface NotificationData {
  event: ShokujiiEvent
  userEmail: string
}

interface MailContent {
  to: string
  from: string
  templateId: string
  dynamic_template_data: {
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
}

function buildInCartNotificationMail(event: ShokujiiEvent, to: string): MailContent {
  return {
    to,
    from: DEFAULT_FROM,
    templateId: IN_CART_NOTIFICATION_ID,
    dynamic_template_data: {
      date: convertToDateWeekdayShort(event.event_start_datetime),
      event_datetime: convertToDuration(event.event_start_datetime, event.event_end_datetime),
      event_name: event.event_name,
      event_cover_url: event.event_cover_url,
      community_name: event.community_name,
      event_address: event.event_address,
      shop_name: event.shop_name,
      event_url: getEventUrl(event.community_account, event.id),
      event_deadline_datetime: convertToDatetimeWeekdayShort(event.event_deadline_datetime),
    },
  }
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
      return { event, userEmail }
    }),
  )

  const filteredNotificationDataList = notificationDataList
    .filter((notificationData): notificationData is NotificationData => notificationData !== null)
    .filter((notificationData) => {
      return start < notificationData.event.event_deadline_datetime
    })

  await Promise.all(
    filteredNotificationDataList.map(async (notificationData) => {
      const { event, userEmail } = notificationData
      try {
        await send(buildInCartNotificationMail(event, userEmail))
      } catch (error) {
        console.error('Failed to send in-cart notification:', error)
      }
    }),
  )
}

export async function sendInCartEventDeadlineNotificationToMember(start: number, end: number): Promise<void> {
  const notifyTime = 24 * 60 * 60 * 1000 // 1日
  const events = await getAcceptingOrderEventsByTime(start + notifyTime, end + notifyTime)

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
          mailContentList.push(buildInCartNotificationMail(event, userEmail))
        }),
      )
    }),
  )

  await Promise.all(
    mailContentList.map(async (mailContent) => {
      try {
        await send(mailContent)
      } catch (error) {
        console.error('Failed to send in-cart event deadline notification:', error)
      }
    }),
  )
}
