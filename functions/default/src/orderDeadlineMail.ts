import {
  DEFAULT_FROM,
  SUPPORT_MAIL,
  getCommunityEmailsForEvent,
  getEventMemberEmails,
  getCommunityMemberEmailsExcludingOrdered,
} from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import { sendDynamicTemplateWithPersonalizations } from './utils/sendgridBulk.js'
import { getEventUrl, getAdminOrderUrl } from './utils/urls.js'
import { createOrdersForOrderDeadline, type OrderData } from './utils/order.js'
import { getAcceptingOrderEventsByTime, ShokujiiEvent } from './stores/event.js'
import {
  convertToDateWeekdayShort,
  convertToDatetimeWeekdayShort,
  convertToDuration,
} from '@shokujii/common/utils/datetime.js'
import { getEventPartnerShop } from './stores/partner.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('orderDeadlineMail')

// テンプレートID
const ORDER_DEADLINE_TEMPLATE_ID = 'd-8609b6a7b1514595ae68d18532331e0e'
const ORDER_DEADLINE_FOR_ORGANIZER_TEMPLATE_ID = 'd-1099d87af79f4d898012db3b8024715f'
const EVENT_CONFIRMATION_TEMPLATE_ID = 'd-2fea06c315a240d2becd864b54f38098'
const ORDER_DEADLINE_REMINDER_TO_COMMUNITY_TEMPLATE_ID = 'd-724728f734b245dd8472e0c2c5a9d462'

// 定数
const DELIVERY_DURATION = 30 // minutes

// 型定義

interface TemplateDataForOrderDeadline extends Record<string, unknown> {
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
  // 主催者情報・配送メモ
  organizer_fullname: string
  organizer_company: string
  organizer_email: string
  organizer_phone_personal: string
  organizer_phone_company: string
  organizer_memo: string
}

interface TemplateDataForOrganizers extends TemplateDataForOrderDeadline {
  shop_email?: string
  shop_address?: string
  shop_phone?: string
}

interface TemplateDataForMembers extends Record<string, unknown> {
  date: string
  event_datetime: string
  event_name: string
  event_cover_url: string
  community_name: string
  event_address: string
  shop_name: string
  event_url: string
}

interface TemplateDataForCommunityReminder extends Record<string, unknown> {
  community_name: string
  event_url: string
  event_name: string
  event_cover_url: string
  event_desc: string
  event_datetime: string
  event_address: string
  event_place: string
  shop_name: string
  event_deadline_datetime: string
  event_payment: string
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
    order_url: getAdminOrderUrl(event.id),
    organizer_fullname: event.organizer_fullname,
    organizer_company: event.organizer_company,
    organizer_email: event.organizer_email,
    organizer_phone_personal: event.organizer_phone_personal,
    organizer_phone_company: event.organizer_phone_company,
    organizer_memo: event.organizer_memo,
  }
}

/**
 * 主催者向け注文締切用のテンプレートデータを作成
 */
async function createTemplateDataForOrganizersOrderDeadline(event: ShokujiiEvent): Promise<TemplateDataForOrganizers> {
  const [order_count, , orders] = await createOrdersForOrderDeadline(event)
  const event_start_datetime = event.event_start_datetime
  const date = convertToDateWeekdayShort(event_start_datetime)
  const event_deadline_datetime = convertToDatetimeWeekdayShort(event.event_deadline_datetime)
  const deliveryDuration = convertToDuration(event_start_datetime - DELIVERY_DURATION * 60 * 1000, event_start_datetime)
  const delivery_date = `${deliveryDuration} （※${DELIVERY_DURATION}分の配達時間をいただいています）`

  const shopData = await getEventPartnerShop(event)
  if (!shopData) {
    throw new Error('Shop data not found for the event')
  }

  return {
    shop_email: shopData.shop_email,
    shop_address: shopData.fullAddress,
    shop_phone: shopData.shop_phone,
    event_name: event.event_name,
    event_address: event.fullAddress,
    event_place: event.event_place,
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
    organizer_fullname: event.organizer_fullname,
    organizer_company: event.organizer_company,
    organizer_email: event.organizer_email,
    organizer_phone_personal: event.organizer_phone_personal,
    organizer_phone_company: event.organizer_phone_company,
    organizer_memo: event.organizer_memo,
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
          to: shopData.getEmails(),
          from: DEFAULT_FROM,
          cc: SUPPORT_MAIL,
          templateId: ORDER_DEADLINE_TEMPLATE_ID,
          dynamicTemplateData: dynamic_template_data,
        })
      } catch (err) {
        logger.warn('Failed to send order deadline mail to shop', {
          eventId: event.id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }),
  )
}

/**
 * 主催者向け注文締切メール送信
 */
export async function sendOrderDeadlineMailToOrganizers(start: number, end: number): Promise<void> {
  const events = await getAcceptingOrderEventsByTime(start, end)

  await Promise.allSettled(
    events.map(async (event) => {
      try {
        const dynamic_template_data = await createTemplateDataForOrganizersOrderDeadline(event)
        const communityEmails = await getCommunityEmailsForEvent(event)

        const bulkResult = await sendDynamicTemplateWithPersonalizations(
          {
            from: DEFAULT_FROM,
            templateId: ORDER_DEADLINE_FOR_ORGANIZER_TEMPLATE_ID,
          },
          communityEmails.map((to) => ({
            to,
            dynamicTemplateData: dynamic_template_data,
          })),
          { feature: 'orderDeadlineOrganizers', eventId: event.id },
        )

        if (bulkResult.errors.length > 0) {
          logger.warn('Failed to send order deadline mail to organizers', {
            eventId: event.id,
            batchesSucceeded: bulkResult.batchesSucceeded,
            batchesFailed: bulkResult.batchesFailed,
            totalRecipientsAccepted: bulkResult.totalRecipientsAccepted,
            totalEmails: communityEmails.length,
            errors: bulkResult.errors,
          })
        }
      } catch (err) {
        logger.warn('Failed to process event for organizer mail', {
          eventId: event.id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }),
  )
}

/**
 * メンバー向け注文締切メール送信
 */
export async function sendOrderDeadlineMailToMembers(start: number, end: number): Promise<void> {
  const events = await getAcceptingOrderEventsByTime(start, end)

  await Promise.allSettled(
    events.map(async (event) => {
      try {
        const dynamic_template_data: TemplateDataForMembers = {
          date: convertToDateWeekdayShort(event.event_start_datetime),
          event_datetime: convertToDuration(event.event_start_datetime, event.event_end_datetime),
          event_name: event.event_name,
          event_cover_url: event.event_cover_url,
          community_name: event.community_name,
          event_address: event.fullAddress,
          shop_name: event.shop_name,
          event_url: getEventUrl(event.community_account, event.id),
        }

        const memberEmails = await getEventMemberEmails(event)
        const bulkResult = await sendDynamicTemplateWithPersonalizations(
          {
            from: DEFAULT_FROM,
            templateId: EVENT_CONFIRMATION_TEMPLATE_ID,
          },
          memberEmails.map((to) => ({
            to,
            dynamicTemplateData: dynamic_template_data,
          })),
          { feature: 'orderDeadlineMembers', eventId: event.id },
        )

        if (bulkResult.errors.length > 0) {
          logger.warn('Failed to send order deadline mail to members', {
            eventId: event.id,
            batchesSucceeded: bulkResult.batchesSucceeded,
            batchesFailed: bulkResult.batchesFailed,
            totalRecipientsAccepted: bulkResult.totalRecipientsAccepted,
            totalEmails: memberEmails.length,
            errors: bulkResult.errors,
          })
        }
      } catch (err) {
        logger.warn('Failed to process event for member mail', {
          eventId: event.id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }),
  )
}

/**
 * コミュニティメンバー向け注文期限リマインドメール送信（注文期限の24時間前）
 */
export async function sendOrderDeadlineReminderToCommunityMembers(start: number, end: number): Promise<void> {
  const events = await getAcceptingOrderEventsByTime(start, end)

  await Promise.allSettled(
    events.map(async (event) => {
      try {
        // is_publicがtrueのイベントのみ
        if (!event.is_public) {
          return
        }

        // 定員未満のイベントのみ
        const orders = await event.getOrders('ordered')
        if (orders.length >= event.event_max_people) {
          return
        }

        const dynamic_template_data: TemplateDataForCommunityReminder = {
          community_name: event.community_name,
          event_url: getEventUrl(event.community_account, event.id),
          event_name: event.event_name,
          event_cover_url: event.event_cover_url,
          event_desc: event.event_desc,
          event_datetime: convertToDuration(event.event_start_datetime, event.event_end_datetime),
          event_address: event.fullAddress,
          event_place: event.event_place,
          shop_name: event.shop_name,
          event_deadline_datetime: convertToDatetimeWeekdayShort(event.event_deadline_datetime),
          event_payment: event.event_payment,
        }

        const memberEmails = await getCommunityMemberEmailsExcludingOrdered(event)
        const bulkResult = await sendDynamicTemplateWithPersonalizations(
          {
            from: DEFAULT_FROM,
            templateId: ORDER_DEADLINE_REMINDER_TO_COMMUNITY_TEMPLATE_ID,
          },
          memberEmails.map((to) => ({
            to,
            dynamicTemplateData: dynamic_template_data,
          })),
          { feature: 'orderDeadlineCommunityReminder', eventId: event.id },
        )

        if (bulkResult.errors.length > 0) {
          logger.warn('Failed to send order deadline reminder to community members', {
            eventId: event.id,
            batchesSucceeded: bulkResult.batchesSucceeded,
            batchesFailed: bulkResult.batchesFailed,
            totalRecipientsAccepted: bulkResult.totalRecipientsAccepted,
            totalEmails: memberEmails.length,
            errors: bulkResult.errors,
          })
        }
      } catch (err) {
        logger.warn('Failed to process event for community reminder mail', {
          eventId: event.id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }),
  )
}
