import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import {
  DEFAULT_FROM,
  DEFAULT_TO,
  SUPPORT_MAIL,
  getCommunityEmailsForEvent,
  getOrganizerReplyTo,
  getShopReplyTo,
  resolveReplyToEmail,
} from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import { getEventUrlForEvent, getPartnerOrderUrl } from './utils/urls.js'
import { isEnterpriseEvent } from './utils/enterpriseMail.js'
import {
  convertToDateWeekdayShort,
  convertToDatetimeWeekdayShort,
  convertToDuration,
} from '@shokujii/common/utils/datetime.js'
import type { PartnerShop } from '@shokujii/common/schemas/PartnerShop.js'
import { getPartner } from './stores/partner.js'
import { getUser } from './stores/user.js'
import { convertReferenceToEvent, ShokujiiEvent } from './stores/event.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('eventStatusChangeMail')

// テンプレートID定数
const EVENT_STATUS_APPLYING_RESERVATION_ID = 'd-238517a9044c441598d1d0d7d4a7d0b7'
const EVENT_STATUS_IN_DRAFT_ID = 'd-4f62892bece349e494cc0d545143f145'
const EVENT_STATUS_ACCEPTING_ORDER_ID = 'd-badaf130bf664cf3badb1ef2aab9f60c'
const APPLYING_ORDER_TEMPLATE_ID = 'd-6e4b246cc4ef418993a1304b45b48d7b'

const DELIVERY_DURATION = 30 // minutes

/**
 * イベント用のテンプレートデータを作成
 */
export async function createTemplateDataForOrderDeadline(event: ShokujiiEvent) {
  const orders = await event.getOrders()
  const validOrders = orders.filter((order) => order.status === 'ordered')

  const orderList = []
  let orderCount = 0
  let orderTotalPrice = 0

  for (const order of validOrders) {
    const user = await getUser(order.user_id, false)
    if (!user) continue

    orderList.push({
      name: user.user_name,
      order: order.menu_name,
      price: `¥${order.menu_price}`,
      number: 0,
    })
    orderCount++
    orderTotalPrice += order.menu_price
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
  const event_url = await getEventUrlForEvent(event)
  if (event_url == null && isEnterpriseEvent(event)) {
    logger.error('Enterprise host unresolved for event status change mail', {
      eventId: event.id,
      enterpriseId: event.enterprise_id,
    })
  }

  return {
    ...event,
    // getter fullAddress はスプレッドされない。テンプレの event_address 用に結合住所を渡す
    event_address: event.fullAddress,
    date,
    delivery_date: deliveryDate,
    event_deadline_datetime: eventDeadlineDateTime,
    order_count: orderCount,
    order_total_price: orderTotalPrice,
    event_url: event_url ?? '',
    orders: orderList,
    order_url: getPartnerOrderUrl(event.id),
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
 * 主催者向けイベントステータス変更メール用の店舗テンプレートデータ
 */
export function createShopTemplateDataForOrganizerMail(shop: PartnerShop) {
  return {
    ...shop,
    // getter fullAddress はスプレッドされない。テンプレの shop_address 用に結合住所を渡す
    shop_address: shop.fullAddress,
    // #2204: 店舗連絡先（サブ1）。SendGrid 側は {{#if shop_email_sub1}} で表示
    shop_email_sub1: resolveReplyToEmail(shop.shop_email_sub1) ?? '',
  }
}

/**
 * 主催者にイベントステータス変更メールを送信
 */
async function sendEventStatusMailToOrganizers(
  templateId: string,
  addSupport: boolean,
  event: ShokujiiEvent,
  replyToFromShop = false,
): Promise<void> {
  const [templateData, shop, emails] = await Promise.all([
    createTemplateDataForOrderDeadline(event),
    getShopForEvent(event),
    getCommunityEmailsForEvent(event),
  ])

  const dynamicTemplateData = {
    ...templateData,
    ...(shop ? createShopTemplateDataForOrganizerMail(shop) : {}),
  }

  const replyTo = replyToFromShop && shop ? getShopReplyTo(shop) : undefined

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
        ...(replyTo ? { replyTo } : {}),
      })
    }),
  )
}

/**
 * 管理者に申請メールを送信
 */
async function sendApplyingMailToAdmin(event: ShokujiiEvent): Promise<void> {
  const event_url = await getEventUrlForEvent(event)
  const subject = `店舗「${event.shop_name}」主催のイベントが申請されました`
  const text = `【ID】 ${event.id}\n` + `【イベント名】 ${event.event_name}\n` + `【イベントURL】 ${event_url ?? ''}\n`

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
    logger.warn('Shop not found for event', { eventId: event.id })
    return
  }

  const shopEmails = shop.getEmails()
  if (shopEmails.length === 0) {
    logger.warn('No shop emails found for event', { eventId: event.id })
    return
  }

  const replyTo = getOrganizerReplyTo(event)
  if (replyTo === undefined) {
    logger.warn('Organizer email missing for shop reservation mail replyTo', { eventId: event.id })
  }

  await sgMail.send({
    to: shopEmails,
    from: DEFAULT_FROM,
    cc: SUPPORT_MAIL,
    templateId: APPLYING_ORDER_TEMPLATE_ID,
    dynamicTemplateData,
    ...(replyTo ? { replyTo } : {}),
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
    // v2 トリガーの幽霊状態（Firestore → Eventarc publish 断）を検知するための invocation log
    // 詳細: documents/07_リファクタリング/17_onDocumentWritten不具合.md
    logger.info('onEventChanged invoked', {
      communityId: change.params.communityId,
      eventId: change.params.eventId,
      hasBefore: change.data?.before.exists ?? false,
      hasAfter: change.data?.after.exists ?? false,
    })

    if (!change.data) {
      logger.warn('Change data is undefined')
      return
    }

    const before = change.data.before
    const after = change.data.after

    if (!after?.exists) {
      logger.info('Event document deleted; skip', {
        eventId: change.params.eventId,
      })
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
        callFunction: (event: ShokujiiEvent) =>
          sendEventStatusMailToOrganizers(EVENT_STATUS_IN_DRAFT_ID, true, event, true),
      },
      {
        fromStatus: 'applying_reservation',
        toStatus: 'accepting_order',
        callFunction: (event: ShokujiiEvent) =>
          sendEventStatusMailToOrganizers(EVENT_STATUS_ACCEPTING_ORDER_ID, true, event, true),
      },
    ]

    const beforeStatus = before?.get('event_status')?.value
    const afterStatus = after.get('event_status')?.value

    const matchedConditions = conditions.filter(
      ({ fromStatus, toStatus }) => beforeStatus === fromStatus && afterStatus === toStatus,
    )
    logger.info('Status transition evaluated', {
      eventId: change.params.eventId,
      beforeStatus,
      afterStatus,
      matchedCount: matchedConditions.length,
    })

    if (matchedConditions.length === 0) {
      return
    }

    const event = await convertReferenceToEvent(after.ref)
    if (!event) {
      return
    }

    await Promise.all(matchedConditions.map(({ callFunction }) => callFunction(event)))
  },
)
