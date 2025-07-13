import { DEFAULT_FROM, SUPPORT_MAIL } from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import { getEventUrl, getManageEventInvoiceUrl } from './utils/urls.js'
import { convertToDateWeekdayShort } from './commonUtils/datetime.js'
import { getUserPersonalInformation } from './stores/user.js'
import { getAcceptingOrderEventsByEndTime, type ShokujiiEvent } from './stores/event.js'

// テンプレートID
const EVENT_SURVEY_TEMPLATE_ID = 'd-6ad8131506164c2f864155182c63de2d'

// 型定義
interface EventConcludedTemplateData {
  date: string
  event_name: string
  event_cover_url: string
  event_url: string
  is_public: boolean
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
