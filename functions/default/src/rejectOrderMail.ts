import { DEFAULT_FROM, SUPPORT_MAIL, getOrganizerReplyTo } from './utils/mail.js'
import { createModuleLogger } from './utils/logger.js'
import * as sgMail from './utils/sendgrid.js'
import { getEventUrl, getPartnerOrderUrl } from './utils/urls.js'
import { createOrdersForOrderDeadline, type OrderData } from './utils/order.js'
import { ShokujiiEvent, getApplyingReservationEvents } from './stores/event.js'
import { getConfigGlobal } from './stores/config.js'
import { getEventPartnerShop } from './stores/partner.js'
import {
  convertToDateWeekdayShort,
  convertToDatetimeWeekdayShort,
  convertToDuration,
} from '@shokujii/common/utils/datetime.js'
import { HttpsError } from 'firebase-functions/https'

const logger = createModuleLogger('rejectOrderMail')

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
  }
}

/**
 * ショップ向け注文却下メール送信
 *
 * `applying_reservation` になった時刻が `deadlineMillis` 以前のイベントをすべて却下する。
 * 1 分窓ではなく期限超過分すべてを対象にすることで、承認期限の変更時に取りこぼしが出ないようにしている。
 */
export async function sendRejectOrderMailToShop(deadlineMillis: number): Promise<void[]> {
  const nowDateTimeMillis = Date.now()
  const [events, config] = await Promise.all([getApplyingReservationEvents(nowDateTimeMillis), getConfigGlobal()])
  const updated_by = config?.system_id
  if (updated_by == null) {
    throw new HttpsError('internal', 'System ID not found')
  }

  const sendMailPromises: Promise<void>[] = []

  for (const event of events) {
    const promise = (async (): Promise<void> => {
      try {
        // applying_reservation に変更したログで一番新しいものを取得
        const updatedAt = await event.getLastUpdatedTimeByStatus('applying_reservation')

        if (updatedAt == null || updatedAt > deadlineMillis) {
          return
        }

        // イベントステータスを in_draft に更新
        // shop_comment は空文字列を指定してフィールドを削除
        await event.updateEvent({ event_status: { value: 'in_draft', shop_comment: '' } }, updated_by)

        const [dynamicTemplateData, shopData] = await Promise.all([
          createTemplateDataForOrderDeadline(event),
          getEventPartnerShop(event),
        ])

        if (!shopData) {
          logger.warn('Shop data not found for event', { eventId: event.id })
          return
        }

        const replyTo = getOrganizerReplyTo(event)

        await sgMail.send({
          to: shopData.getEmails(),
          from: DEFAULT_FROM,
          cc: SUPPORT_MAIL,
          templateId: REJECT_ORDER_TEMPLATE_ID,
          dynamicTemplateData,
          ...(replyTo ? { replyTo } : {}),
        })
      } catch (err) {
        logger.warn('Failed to send reject order mail to shop', { error: err })
      }
    })()

    sendMailPromises.push(promise)
  }

  return Promise.all(sendMailPromises)
}
