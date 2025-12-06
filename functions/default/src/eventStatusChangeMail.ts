import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { DEFAULT_FROM, DEFAULT_TO, SUPPORT_MAIL, getCommunityEmailsForEvent } from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import { getEventUrl, getAdminOrderUrl } from './utils/urls.js'
import {
  convertToDateWeekdayShort,
  convertToDatetimeWeekdayShort,
  convertToDuration,
} from '@shokujii/common/utils/datetime.js'
import { getPartner } from './stores/partner.js'
import { getUser } from './stores/user.js'
import { convertReferenceToEvent, ShokujiiEvent } from './stores/event.js'

// テンプレートID定数
const EVENT_STATUS_APPLYING_RESERVATION_ID = 'd-238517a9044c441598d1d0d7d4a7d0b7'
const EVENT_STATUS_IN_DRAFT_ID = 'd-4f62892bece349e494cc0d545143f145'
const EVENT_STATUS_ACCEPTING_ORDER_ID = 'd-badaf130bf664cf3badb1ef2aab9f60c'
const APPLYING_ORDER_TEMPLATE_ID = 'd-6e4b246cc4ef418993a1304b45b48d7b'

const DELIVERY_DURATION = 30 // minutes

/**
 * イベント用のテンプレートデータを作成
 */
async function createTemplateDataForOrderDeadline(event: ShokujiiEvent) {
  const orders = await event.getOrders()
  const validOrders = orders.filter((order) => order.status === 'ordered')

  const orderList = []
  let orderCount = 0
  let orderTotalPrice = 0

  for (const order of validOrders) {
    const user = await getUser(order.user_id, false)
    if (!user) continue

    for (const menu of order.menus || []) {
      for (let i = 0; i < menu.count; i++) {
        orderList.push({
          name: user.user_name,
          order: menu.name,
          price: `¥${menu.price}`,
          number: 0, // 後で設定
        })
        orderCount++
        orderTotalPrice += menu.price
      }
    }
  }

  // 注文を料理名でソート
  orderList.sort((a, b) => a.order.localeCompare(b.order))
  orderList.forEach((order, i) => {
    order.number = i + 1
  })

  const eventStartDateTime = event.event_start_datetime
  const date = convertToDateWeekdayShort(eventStartDateTime)
  const deliveryDuration = convertToDuration(eventStartDateTime - DELIVERY_DURATION * 60 * 1000, eventStartDateTime)
  const deliveryDate = `${deliveryDuration} （※${DELIVERY_DURATION}分の配達時間をいただいています）`
  const eventDeadlineDateTime = convertToDatetimeWeekdayShort(event.event_deadline_datetime)

  return {
    ...event,
    date,
    delivery_date: deliveryDate,
    event_deadline_datetime: eventDeadlineDateTime,
    order_count: orderCount,
    order_total_price: orderTotalPrice,
    event_url: getEventUrl(event.community_account, event.id),
    orders: orderList,
    order_url: getAdminOrderUrl(event.id),
  }
}

/**
 * 店舗情報を取得
 */
async function getShopForEvent(event: ShokujiiEvent) {
  const partner = await getPartner(event.partner_id)
  if (!partner) return null

  const shop = await partner.getShop(event.shop_id)
  return shop
}

/**
 * 主催者にイベントステータス変更メールを送信
 */
async function sendEventStatusMailToOrganizers(
  templateId: string,
  addSupport: boolean,
  event: ShokujiiEvent,
): Promise<void> {
  const [templateData, shop, emails] = await Promise.all([
    createTemplateDataForOrderDeadline(event),
    getShopForEvent(event),
    getCommunityEmailsForEvent(event),
  ])

  const dynamicTemplateData = {
    ...templateData,
    ...(shop || {}),
  }

  if (addSupport && !emails.includes(SUPPORT_MAIL)) {
    emails.push(SUPPORT_MAIL)
  }

  await Promise.all(
    emails.map(async (to) => {
      await sgMail.send({
        to,
        from: DEFAULT_FROM,
        templateId,
        dynamicTemplateData,
      })
    }),
  )
}

/**
 * 管理者に申請メールを送信
 */
async function sendApplyingMailToAdmin(event: ShokujiiEvent): Promise<void> {
  const subject = `店舗「${event.shop_name}」主催のイベントが申請されました`
  const text =
    `【ID】 ${event.id}\n` +
    `【イベント名】 ${event.event_name}\n` +
    `【イベントURL】 ${getEventUrl(event.community_account, event.id)}\n`

  await sgMail.send({
    to: DEFAULT_TO,
    from: DEFAULT_FROM,
    subject,
    text,
  })
}

/**
 * 店舗に申請メールを送信
 */
async function sendApplyingOrderMailToShop(event: ShokujiiEvent): Promise<void> {
  const [dynamicTemplateData, shop] = await Promise.all([
    createTemplateDataForOrderDeadline(event),
    getShopForEvent(event),
  ])

  if (!shop) {
    console.warn(`Shop not found for event: ${event.id}`)
    return
  }

  const shopEmails = shop.getEmails()
  if (shopEmails.length === 0) {
    console.warn(`No shop emails found for event: ${event.id}`)
    return
  }

  await sgMail.send({
    to: shopEmails,
    from: DEFAULT_FROM,
    cc: SUPPORT_MAIL,
    templateId: APPLYING_ORDER_TEMPLATE_ID,
    dynamicTemplateData,
  })
}

/**
 * イベントステータス変更時のトリガー関数
 */
export const onEventChanged = onDocumentWritten(
  {
    document: 'communities/{communityId}/events/{eventId}',
    region: 'asia-northeast1',
    secrets: ['SENDGRID_API_KEY'],
  },
  async (change) => {
    if (!change.data) {
      console.warn('Change data is undefined')
      return
    }

    const before = change.data.before
    const after = change.data.after

    if (!after?.exists) {
      return
    }

    // ステータス変更の条件と対応するメール送信関数の配列
    const conditions = [
      { fromStatus: 'in_draft', toStatus: 'applying_to_admin', callFunction: sendApplyingMailToAdmin },
      { fromStatus: undefined, toStatus: 'applying_to_admin', callFunction: sendApplyingMailToAdmin },
      { fromStatus: 'in_draft', toStatus: 'applying_reservation', callFunction: sendApplyingOrderMailToShop },
      {
        fromStatus: 'in_draft',
        toStatus: 'applying_reservation',
        callFunction: (event: ShokujiiEvent) =>
          sendEventStatusMailToOrganizers(EVENT_STATUS_APPLYING_RESERVATION_ID, false, event),
      },
      {
        fromStatus: 'applying_reservation',
        toStatus: 'in_draft',
        callFunction: (event: ShokujiiEvent) => sendEventStatusMailToOrganizers(EVENT_STATUS_IN_DRAFT_ID, true, event),
      },
      {
        fromStatus: 'applying_reservation',
        toStatus: 'accepting_order',
        callFunction: (event: ShokujiiEvent) =>
          sendEventStatusMailToOrganizers(EVENT_STATUS_ACCEPTING_ORDER_ID, true, event),
      },
    ]

    const beforeStatus = before?.get('event_status')?.value
    const afterStatus = after.get('event_status')?.value

    const promises: Promise<void>[] = []

    for (const { fromStatus, toStatus, callFunction } of conditions) {
      if (beforeStatus === fromStatus && afterStatus === toStatus) {
        const event = await convertReferenceToEvent(after.ref)
        if (event) {
          promises.push(callFunction(event))
        }
      }
    }

    await Promise.all(promises)
  },
)
