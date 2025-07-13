import { DEFAULT_FROM, SUPPORT_MAIL } from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import { getEventUrl, getManageEventInvoiceUrl } from './utils/urls.js'
import { convertToDateWeekdayShort } from './commonUtils/datetime.js'
import { getUserPersonalInformation } from './stores/user.js'
import { getAcceptingOrderEventsByEndTime, type ShokujiiEvent } from './stores/event.js'
const { createEventBillInvoice } = require('../../legacy/src/eventBillInvoice.js')

// テンプレートID
const EVENT_SURVEY_TEMPLATE_ID = 'd-6ad8131506164c2f864155182c63de2d'
const EVENT_INVOICE_TEMPLATE_ID = 'd-48e3179255834b8bb895cd995b1aac28'

// 型定義
interface EventConcludedTemplateData {
  date: string
  event_name: string
  event_cover_url: string
  event_url: string
  is_public: boolean
}

interface InvoiceTemplateData {
  company: string
  person: string
  event_name: string
  event_invoice_url: string
}

/**
 * イベント参加者のメールアドレスを取得
 */
async function getEventMemberEmails(event: ShokujiiEvent): Promise<string[]> {
  const orders = await event.getOrders('ordered')
  const usersSet = new Set(orders.map((order) => order.user_id))
  const emails = await Promise.all(
    Array.from(usersSet).map(async (userId) => {
      const userPersonalInfo = await getUserPersonalInformation(userId)
      return userPersonalInfo?.user_email
    }),
  )
  return emails.filter((email): email is string => email != null && email !== '')
}

/**
 * イベント終了時にメンバーにアンケートメールを送信
 */
export async function sendEventConcludedMailToMembers(start: number, end: number): Promise<void[]> {
  const events = await getAcceptingOrderEventsByEndTime(start, end)

  return Promise.all(
    events.map(async (event) => {
      const dynamic_template_data: EventConcludedTemplateData = {
        date: convertToDateWeekdayShort(event.event_start_datetime) || '',
        event_name: event.event_name,
        event_cover_url: event.event_cover_url || '',
        event_url: getEventUrl(event.community_account, event.id),
        is_public: event.is_public || false,
      }

      try {
        const memberEmails = await getEventMemberEmails(event)
        await Promise.all(
          memberEmails.map(async (to) => {
            await sgMail.send({
              to,
              from: DEFAULT_FROM,
              templateId: EVENT_SURVEY_TEMPLATE_ID,
              dynamicTemplateData: dynamic_template_data,
            })
          }),
        )
      } catch (err) {
        console.warn('Failed to send event concluded mail to members:', err)
      }
    }),
  )
}

/**
 * イベント終了時に主催者に請求書メールを送信
 */
export async function sendInvoiceMailToOrganizers(start: number, end: number): Promise<void[]> {
  const events = await getAcceptingOrderEventsByEndTime(start, end)

  return Promise.all(
    events
      .filter((event) => event.event_payment === 'community_bill')
      .map(async (event) => {
        try {
          const { getFirestore } = await import('firebase-admin/firestore')
          const db = getFirestore()
          const communitySnapshot = await db.collection('communities').doc(event.community_id).get()
          const eventSnapshot = await db
            .collection('communities')
            .doc(event.community_id)
            .collection('events')
            .doc(event.id)
            .get()
          const invoiceId = await createEventBillInvoice(communitySnapshot, eventSnapshot)

          const dynamic_template_data: InvoiceTemplateData = {
            company: event.organizer_company || '',
            person: event.bill_fullname || '',
            event_name: event.event_name || '',
            event_invoice_url: getManageEventInvoiceUrl(event.id, invoiceId),
          }

          const to = event.bill_email
          const cc = event.organizer_email

          await sgMail.send({
            to,
            from: DEFAULT_FROM,
            cc: to !== cc ? cc : undefined,
            bcc: SUPPORT_MAIL,
            templateId: EVENT_INVOICE_TEMPLATE_ID,
            dynamicTemplateData: dynamic_template_data,
          })
        } catch (err) {
          console.warn('Failed to send invoice mail to organizers:', JSON.stringify(err))
        }
      }),
  )
}
