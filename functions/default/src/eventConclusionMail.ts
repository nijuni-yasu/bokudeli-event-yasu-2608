import { DEFAULT_FROM, getEventMemberEmails } from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import { getEventUrl, convertStoragePathToURL } from './utils/urls.js'
import { convertToDateWeekdayShort } from '@shokujii/common/utils/datetime.js'
import { getAcceptingOrderEventsByEndTime } from './stores/event.js'
import { isEnterpriseEvent } from './utils/enterpriseMail.js'
import { getEventCoverStoragePath } from '@shokujii/common/utils/storagePaths.js'

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
 * イベント終了時にメンバーにアンケートメールを送信
 */
export async function sendEventConcludedMailToMembers(start: number, end: number): Promise<void[]> {
  const events = await getAcceptingOrderEventsByEndTime(start, end)

  return Promise.all(
    events.map(async (event) => {
      if (isEnterpriseEvent(event)) {
        return
      }
      const dynamic_template_data: EventConcludedTemplateData = {
        date: convertToDateWeekdayShort(event.event_start_datetime),
        event_name: event.event_name,
        event_cover_url: convertStoragePathToURL(getEventCoverStoragePath(event.community_id, event.id)),
        event_url: getEventUrl(event.community_account, event.id),
        is_public: event.is_public,
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
