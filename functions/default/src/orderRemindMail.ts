import { DEFAULT_FROM, SUPPORT_MAIL, getCommunityEmailsForEvent, getOrganizerReplyTo } from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import { getEventUrl, getPartnerOrderUrl, getManageEventMemberUrl } from './utils/urls.js'
import { createOrdersForOrderDeadline, type OrderData } from './utils/order.js'
import { isEnterpriseEvent } from './utils/enterpriseMail.js'
import { ShokujiiEvent, getAcceptingOrderEventsByTime, getApplyingReservationEvents } from './stores/event.js'
import { getUser } from './stores/user.js'
import { getEventPartnerShop } from './stores/partner.js'
import {
  convertToDateWeekdayShort,
  convertToDatetimeWeekdayShort,
  convertToDuration,
} from '@shokujii/common/utils/datetime.js'
import { getShopReservationApprovalDeadlineMillis } from '@shokujii/common/constants/eventReservation.js'

// テンプレートID
const APPLYING_ORDER_TEMPLATE_ID = 'd-6e4b246cc4ef418993a1304b45b48d7b'
const ORDER_REMIND_FOR_ORGANIZER_TEMPLATE_ID = 'd-89612eeb2f1f42a98c92b543b870616c'

// 定数
const DELIVERY_DURATION = 30 // minutes

// 型定義
interface TemplateDataForApplyingOrder {
  event_name: string
  event_address: string
  event_place: string
  community_name: string
  shop_name: string
  date: string
  delivery_date: string
  event_deadline_datetime: string
  order_count: number
  order_total_price: number
  event_url: string
  orders: OrderData[]
  order_url: string
  approve_deadline_datetime: string
  organizer_fullname: string
  organizer_company: string
  organizer_email: string
  organizer_phone_personal: string
  organizer_phone_company: string
  organizer_memo: string
  event_max_people: number
  is_reminder?: boolean
}

interface OrdersByStatus {
  [status: string]: OrderData[]
}

interface TemplateDataForOrganizerOrderRemind {
  event_name: string
  community_name: string
  community_account: string
  event_days_ago: number
  event_url: string
  manage_event_member_url: string
  event_deadline_datetime: string
  event_datetime: string
  orders: OrdersByStatus
}

/**
 * 申請注文用のテンプレートデータを作成
 */
async function createTemplateDataForApplyingOrder(
  event: ShokujiiEvent,
  updatedAt: number,
): Promise<TemplateDataForApplyingOrder> {
  const limitTimeMills = getShopReservationApprovalDeadlineMillis(updatedAt)

  const [order_count, order_total_price, orders] = await createOrdersForOrderDeadline(event)
  const event_start_datetime = event.event_start_datetime
  const date = convertToDateWeekdayShort(event_start_datetime)
  const deliveryDuration = convertToDuration(event_start_datetime - DELIVERY_DURATION * 60 * 1000, event_start_datetime)
  const delivery_date = `${deliveryDuration} （※${DELIVERY_DURATION}分の配達時間をいただいています）`
  const event_deadline_datetime = convertToDatetimeWeekdayShort(event.event_deadline_datetime)

  return {
    event_name: event.event_name,
    event_address: event.fullAddress,
    event_place: event.event_place,
    community_name: event.community_name,
    shop_name: event.shop_name,
    date,
    delivery_date,
    event_deadline_datetime,
    order_count,
    order_total_price,
    event_url: getEventUrl(event.community_account, event.id),
    orders,
    order_url: getPartnerOrderUrl(event.id),
    approve_deadline_datetime: convertToDateWeekdayShort(limitTimeMills),
    organizer_fullname: event.organizer_fullname,
    organizer_company: event.organizer_company,
    organizer_email: event.organizer_email,
    organizer_phone_personal: event.organizer_phone_personal,
    organizer_phone_company: event.organizer_phone_company,
    organizer_memo: event.organizer_memo,
    event_max_people: event.event_max_people,
  }
}

/**
 * ショップ向け申請注文リマインドメール送信
 */
export async function sendApplyingOrderRemindMailToShop(start: number, end: number): Promise<void[]> {
  const nowDateTimeMillis = Date.now()
  const events = await getApplyingReservationEvents(nowDateTimeMillis)

  const sendMailPromises = events
    .map(async (event) => {
      try {
        // applying_reservation に変更したログで一番新しいものを取得
        const updatedAt = await event.getLastUpdatedTimeByStatus('applying_reservation')

        if (updatedAt != null && updatedAt > start && updatedAt <= end) {
          const [dynamicTemplateData, shopData] = await Promise.all([
            createTemplateDataForApplyingOrder(event, updatedAt),
            getEventPartnerShop(event),
          ])

          if (!shopData) {
            console.warn(`Shop data not found for event: ${event.id}`)
            return
          }

          dynamicTemplateData.is_reminder = true

          const replyTo = getOrganizerReplyTo(event)
          if (replyTo === undefined) {
            console.warn(`Organizer email missing for shop reservation remind mail replyTo: ${event.id}`)
          }

          await sgMail.send({
            to: shopData.getEmails(),
            from: DEFAULT_FROM,
            cc: SUPPORT_MAIL,
            templateId: APPLYING_ORDER_TEMPLATE_ID,
            dynamicTemplateData,
            ...(replyTo ? { replyTo } : {}),
          })
        }
      } catch (err) {
        console.warn('Failed to send applying order remind mail to shop:', err)
      }
    })
    .filter((promise) => promise != null)

  return Promise.all(sendMailPromises)
}

/**
 * 主催者リマインド用の注文データを作成
 */
async function createOrdersForOrganizerRemind(event: ShokujiiEvent): Promise<OrdersByStatus> {
  const allOrders = await event.getOrders()
  const ordersByStatus: OrdersByStatus = {}

  const promises = allOrders.map(async (order) => {
    const user = await getUser(order.user_id, false)
    const userName = user?.user_name || ''

    if (!ordersByStatus[order.status]) {
      ordersByStatus[order.status] = []
    }
    ordersByStatus[order.status].push({
      name: userName,
      order: order.menu_name,
      price: `¥${order.menu_price}`,
    })
  })

  await Promise.all(promises)

  // 各ステータスの注文を名前でソートし、番号を追加
  for (const orders of Object.values(ordersByStatus)) {
    orders.sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
    orders.forEach((order, i) => (order.number = i + 1))
  }

  return ordersByStatus
}

/**
 * 主催者リマインド用のテンプレートデータを作成
 */
async function createTemplateDataForOrganizerRemind(
  event: ShokujiiEvent,
  eventDaysAgo: number,
): Promise<TemplateDataForOrganizerOrderRemind> {
  const orders = await createOrdersForOrganizerRemind(event)
  const eventDateTime = convertToDuration(event.event_start_datetime, event.event_end_datetime)
  const eventDeadlineDateTime = convertToDatetimeWeekdayShort(event.event_deadline_datetime)

  return {
    event_name: event.event_name,
    community_name: event.community_name,
    community_account: event.community_account,
    event_days_ago: eventDaysAgo,
    event_url: getEventUrl(event.community_account, event.id),
    manage_event_member_url: getManageEventMemberUrl(event.id),
    event_deadline_datetime: eventDeadlineDateTime,
    event_datetime: eventDateTime,
    orders,
  }
}

/**
 * 主催者向け注文リマインドメール送信
 */
export async function sendOrderRemindMailToOrganizer(
  start: number,
  end: number,
  eventDaysAgo: number,
): Promise<void[]> {
  const events = await getAcceptingOrderEventsByTime(start, end)

  const sendMailPromises = events
    .map(async (event) => {
      try {
        if (isEnterpriseEvent(event)) {
          return
        }
        const hasOrders = await event.hasOrderedOrders()
        if (!hasOrders) {
          return
        }

        const [dynamicTemplateData, communityEmails] = await Promise.all([
          createTemplateDataForOrganizerRemind(event, eventDaysAgo),
          getCommunityEmailsForEvent(event),
        ])

        const emailPromises = communityEmails.map(async (to) => {
          await sgMail.send({
            to,
            from: DEFAULT_FROM,
            templateId: ORDER_REMIND_FOR_ORGANIZER_TEMPLATE_ID,
            dynamicTemplateData,
          })
        })

        await Promise.all(emailPromises)
      } catch (err) {
        console.warn('Failed to send order remind mail to organizer:', err)
      }
    })
    .filter((promise) => promise != null)

  return Promise.all(sendMailPromises)
}
