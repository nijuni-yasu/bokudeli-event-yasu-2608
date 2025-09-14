import { DEFAULT_FROM, SUPPORT_MAIL } from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import { getEventUrl, getAdminOrderUrl } from './utils/urls.js'
import { createOrdersForOrderDeadline, type OrderData } from './utils/order.js'
import { ShokujiiEvent, getApplyingReservationEvents } from './stores/event.js'
import { getEventPartnerShop } from './stores/partner.js'
import {
  convertToDateWeekdayShort,
  convertToDatetimeWeekdayShort,
  convertToDuration,
} from '@shokujii/common/utils/datetime.js'

// テンプレートID
const REJECT_ORDER_TEMPLATE_ID = 'd-f968252a99864a1a9e126b9863944832'

// 定数
const DELIVERY_DURATION = 30 // minutes

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
 * ショップ向け注文却下メール送信
 */
export async function sendRejectOrderMailToShop(start: number, end: number): Promise<void[]> {
  const nowDateTimeMillis = Date.now()
  const events = await getApplyingReservationEvents(nowDateTimeMillis)

  const sendMailPromises: Promise<void>[] = []

  for (const event of events) {
    const promise = (async (): Promise<void> => {
      try {
        // applying_reservation に変更したログで一番新しいものを取得
        const updatedAt = await event.getLastUpdatedTimeByStatus('applying_reservation')

        if (updatedAt == null || updatedAt <= start || updatedAt > end) {
          return
        }

        // イベントステータスを in_draft に更新
        await event.updateEventStatus('in_draft')

        const [dynamicTemplateData, shopData] = await Promise.all([
          createTemplateDataForOrderDeadline(event),
          getEventPartnerShop(event),
        ])

        if (!shopData) {
          console.warn(`Shop data not found for event: ${event.id}`)
          return
        }

        await sgMail.send({
          to: shopData.getEmails(),
          from: DEFAULT_FROM,
          cc: SUPPORT_MAIL,
          templateId: REJECT_ORDER_TEMPLATE_ID,
          dynamicTemplateData,
        })
      } catch (err) {
        console.warn('Failed to send reject order mail to shop:', err)
      }
    })()

    sendMailPromises.push(promise)
  }

  return Promise.all(sendMailPromises)
}
