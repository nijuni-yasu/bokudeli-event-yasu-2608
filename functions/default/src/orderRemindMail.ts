import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { DEFAULT_FROM, SUPPORT_MAIL } from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import { getEventUrl, getAdminOrderUrl } from './utils/urls.js'
import { ShokujiiEvent } from './stores/event.js'
import { getEventPartnerShop } from './stores/partner.js'
import {
  convertToDateWeekdayShort,
  convertToDatetimeWeekdayShort,
  convertToDuration,
} from '@shokujii/common/utils/datetime.js'

// テンプレートID
const APPLYING_ORDER_TEMPLATE_ID = 'd-6e4b246cc4ef418993a1304b45b48d7b'

// 定数
const DELIVERY_DURATION = 30 // minutes

// 型定義
interface OrderData {
  name: string
  order: string
  price: string
  number?: number
}

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
  is_reminder?: boolean
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
    const db = getFirestore()
    const userRef = db.collection('users').doc(order.user_id)
    const userSnapshot = await userRef.get()
    const userName = userSnapshot.get('user_name') || ''

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
 * 申請注文用のテンプレートデータを作成
 */
async function createTemplateDataForApplyingOrder(
  event: ShokujiiEvent,
  updatedAt: number,
): Promise<TemplateDataForApplyingOrder> {
  const limitTimeMills = updatedAt + 3 * 24 * 60 * 60 * 1000

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
    approve_deadline_datetime: convertToDateWeekdayShort(limitTimeMills) || '',
  }
}

/**
 * ショップ向け申請注文リマインドメール送信
 */
export async function sendApplyingOrderRemindMailToShop(start: number, end: number): Promise<void[]> {
  const nowDateTimeMillis = Date.now()
  const db = getFirestore()

  const eventsRef = db
    .collectionGroup('events')
    .where('event_status.value', '==', 'applying_reservation')
    .where('event_deadline_datetime', '>', Timestamp.fromMillis(nowDateTimeMillis))
    .where('is_deleted', '==', false)

  const eventsSnapshot = await eventsRef.get()
  const events = eventsSnapshot.docs.map((doc) => new ShokujiiEvent(doc.id, doc.data()))

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

          await sgMail.send({
            to: shopData.getEmails(),
            from: DEFAULT_FROM,
            cc: SUPPORT_MAIL,
            templateId: APPLYING_ORDER_TEMPLATE_ID,
            dynamicTemplateData,
          })
        }
      } catch (err) {
        console.warn('Failed to send applying order remind mail to shop:', err)
      }
    })
    .filter((promise) => promise != null)

  return Promise.all(sendMailPromises)
}
