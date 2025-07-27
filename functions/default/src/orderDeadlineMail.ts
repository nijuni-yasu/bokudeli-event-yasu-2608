import { DEFAULT_FROM, SUPPORT_MAIL } from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import { getEventUrl, getAdminOrderUrl } from './utils/urls.js'
import { getAcceptingOrderEventsByTime, ShokujiiEvent } from './stores/event.js'
import { getUser, getUserPersonalInformation } from './stores/user.js'
import { getCommunity } from './stores/community.js'
import {
  convertToDateWeekdayShort,
  convertToDatetimeWeekdayShort,
  convertToDuration,
} from '@shokujii/common/utils/datetime.js'
import { getEventPartnerShop } from './stores/partner.js'
import { PartnerShop } from '@shokujii/common/schemas/PartnerShop.js'

// テンプレートID
const ORDER_DEADLINE_TEMPLATE_ID = 'd-8609b6a7b1514595ae68d18532331e0e'
const ORDER_DEADLINE_FOR_ORGANIZER_TEMPLATE_ID = 'd-1099d87af79f4d898012db3b8024715f'
const EVENT_CONFIRMATION_TEMPLATE_ID = 'd-2fea06c315a240d2becd864b54f38098'

// 定数
const DELIVERY_DURATION = 30 // minutes

// 型定義
interface OrderData {
  name: string
  order: string
  price: string
  number?: number
  status?: string
}

interface TemplateDataForOrderDeadline {
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
  is_reminder?: boolean
}

interface TemplateDataForOrganizers extends TemplateDataForOrderDeadline {
  shop_email?: string
  shop_address?: string
  shop_phone?: string
}

interface TemplateDataForMembers {
  date: string
  event_datetime: string
  event_name: string
  event_cover_url: string
  community_name: string
  event_address: string
  shop_name: string
  event_url: string
}

/**
 * ショップのメールアドレスを取得
 */
function getShopEmails(shopData: PartnerShop): string[] {
  const emails = new Set<string>()
  for (const field of ['shop_email', 'shop_email_sub1', 'shop_email_sub2', 'shop_email_sub3'] as const) {
    const mail = shopData[field]
    if (mail != null && mail !== '') {
      emails.add(mail)
    }
  }
  return Array.from(emails)
}

/**
 * コミュニティマネージャーのメールアドレスを取得
 */
async function getCommunityManagerEmailsSet(communityId: string): Promise<Set<string>> {
  const emails = new Set<string>()
  const community = await getCommunity(communityId)
  if (!community) {
    return emails
  }

  const members = await community.getMembersByRole('manager')
  await Promise.all(
    members.map(async (member) => {
      const user = await getUser(member.id, true)
      if (user?.user_email) {
        emails.add(user.user_email)
      }
    }),
  )
  return emails
}

/**
 * イベントのコミュニティメールアドレスを取得
 */
async function getCommunityEmailsForEvent(event: ShokujiiEvent): Promise<string[]> {
  const emails = await getCommunityManagerEmailsSet(event.community_id)

  if (event.organizer_email) {
    emails.add(event.organizer_email)
  }
  return Array.from(emails)
}

/**
 * イベントメンバーのメールアドレスを取得
 */
async function getEventMemberEmails(event: ShokujiiEvent): Promise<string[]> {
  const orders = await event.getOrders('ordered')
  const userIds = [...new Set(orders.map((order) => order.user_id))]

  const emails = await Promise.all(
    userIds.map(async (userId) => {
      const userPersonalInfo = await getUserPersonalInformation(userId)
      return userPersonalInfo?.user_email
    }),
  )

  return emails.filter((email): email is string => email != null && email !== '')
}

/**
 * 注文締切用の注文データを作成
 */
async function createOrdersForOrderDeadline(event: ShokujiiEvent): Promise<[number, number, OrderData[]]> {
  const orders = await event.getOrders('ordered')
  const orderDataList: OrderData[] = []
  let count = 0
  let price = 0

  const promises = orders.map(async (order) => {
    const user = await getUser(order.user_id, false)
    const userName = user?.user_name || ''

    for (const menu of order.menus || []) {
      for (let i = 0; i < menu.count; i++) {
        orderDataList.push({
          name: userName,
          order: menu.name,
          price: `¥${menu.price}`,
        })
        count++
        price += menu.price
      }
    }
  })

  await Promise.all(promises)

  orderDataList
    .sort((a, b) => (a.order > b.order ? 1 : a.order < b.order ? -1 : 0))
    .forEach((order, i) => (order.number = i + 1))

  return [count, price, orderDataList]
}

/**
 * 注文締切用のテンプレートデータを作成
 */
async function createTemplateDataForOrderDeadline(event: ShokujiiEvent): Promise<TemplateDataForOrderDeadline> {
  const [order_count, order_total_price, orders] = await createOrdersForOrderDeadline(event)
  const event_start_datetime = event.event_start_datetime
  const date = convertToDateWeekdayShort(event_start_datetime) || ''
  const deliveryDuration =
    convertToDuration(event_start_datetime - DELIVERY_DURATION * 60 * 1000, event_start_datetime) || ''
  const delivery_date = `${deliveryDuration} （※${DELIVERY_DURATION}分の配達時間をいただいています）`
  const event_deadline_datetime = convertToDatetimeWeekdayShort(event.event_deadline_datetime) || ''

  return {
    event_name: event.event_name,
    event_address: event.event_address,
    event_place: event.event_place || '',
    community_name: event.community_name,
    shop_name: event.shop_name,
    date,
    delivery_date,
    event_deadline_datetime,
    order_count,
    order_total_price,
    event_url: getEventUrl(event.community_account, event.id),
    orders,
    order_url: getAdminOrderUrl(event.id),
  }
}

/**
 * 主催者向け注文締切用のテンプレートデータを作成
 */
async function createTemplateDataForOrganizersOrderDeadline(event: ShokujiiEvent): Promise<TemplateDataForOrganizers> {
  const [order_count, , orders] = await createOrdersForOrderDeadline(event)
  const event_start_datetime = event.event_start_datetime
  const date = convertToDateWeekdayShort(event_start_datetime) || ''
  const event_deadline_datetime = convertToDatetimeWeekdayShort(event.event_deadline_datetime) || ''
  const deliveryDuration =
    convertToDuration(event_start_datetime - DELIVERY_DURATION * 60 * 1000, event_start_datetime) || ''
  const delivery_date = `${deliveryDuration} （※${DELIVERY_DURATION}分の配達時間をいただいています）`

  const shopData = await getEventPartnerShop(event)
  if (!shopData) {
    throw new Error('Shop data not found for the event')
  }

  return {
    shop_email: shopData.shop_email,
    shop_address: shopData.shop_address,
    shop_phone: shopData.shop_phone,
    event_name: event.event_name,
    event_address: event.event_address,
    event_place: event.event_place || '',
    community_name: event.community_name,
    shop_name: event.shop_name,
    date,
    event_url: getEventUrl(event.community_account, event.id),
    event_deadline_datetime,
    order_count,
    orders,
    delivery_date,
    order_total_price: 0, // 主催者向けでは使用しない
    order_url: getAdminOrderUrl(event.id),
  }
}

/**
 * ショップ向け注文締切メール送信
 */
export async function sendOrderDeadlineMailToShop(start: number, end: number, is_reminder: boolean): Promise<void[]> {
  const events = await getAcceptingOrderEventsByTime(start, end)

  return Promise.all(
    events.map(async (event) => {
      try {
        const [dynamic_template_data, shopData] = await Promise.all([
          createTemplateDataForOrderDeadline(event),
          getEventPartnerShop(event),
        ])
        dynamic_template_data.is_reminder = is_reminder

        if (shopData === undefined) {
          return
        }
        await sgMail.send({
          to: getShopEmails(shopData),
          from: DEFAULT_FROM,
          cc: SUPPORT_MAIL,
          templateId: ORDER_DEADLINE_TEMPLATE_ID,
          dynamicTemplateData: dynamic_template_data,
        })
      } catch (err) {
        console.warn('Failed to send order deadline mail to shop:', err)
      }
    }),
  )
}

/**
 * 主催者向け注文締切メール送信
 */
export async function sendOrderDeadlineMailToOrganizers(start: number, end: number): Promise<void[]> {
  const events = await getAcceptingOrderEventsByTime(start, end)
  const promises: Promise<void>[] = []

  for (const event of events) {
    try {
      const dynamic_template_data = await createTemplateDataForOrganizersOrderDeadline(event)
      const communityEmails = await getCommunityEmailsForEvent(event)

      for (const to of communityEmails) {
        promises.push(
          sgMail
            .send({
              to,
              from: DEFAULT_FROM,
              templateId: ORDER_DEADLINE_FOR_ORGANIZER_TEMPLATE_ID,
              dynamicTemplateData: dynamic_template_data,
            })
            .then(() => {})
            .catch((err) => {
              console.warn('Failed to send order deadline mail to organizer:', err)
            }),
        )
      }
    } catch (err) {
      console.warn('Failed to process event for organizer mail:', err)
    }
  }

  return Promise.all(promises)
}

/**
 * メンバー向け注文締切メール送信
 */
export async function sendOrderDeadlineMailToMembers(start: number, end: number): Promise<void[]> {
  const events = await getAcceptingOrderEventsByTime(start, end)

  return Promise.all(
    events.map(async (event) => {
      const dynamic_template_data: TemplateDataForMembers = {
        date: convertToDateWeekdayShort(event.event_start_datetime) || '',
        event_datetime: convertToDuration(event.event_start_datetime, event.event_end_datetime) || '',
        event_name: event.event_name,
        event_cover_url: event.event_cover_url || '',
        community_name: event.community_name,
        event_address: event.event_address,
        shop_name: event.shop_name,
        event_url: getEventUrl(event.community_account, event.id),
      }

      try {
        const memberEmails = await getEventMemberEmails(event)
        await Promise.all(
          memberEmails.map(async (to) => {
            await sgMail.send({
              to,
              from: DEFAULT_FROM,
              templateId: EVENT_CONFIRMATION_TEMPLATE_ID,
              dynamicTemplateData: dynamic_template_data,
            })
          }),
        )
      } catch (err) {
        console.warn('Failed to send order deadline mail to members:', err)
      }
    }),
  )
}
