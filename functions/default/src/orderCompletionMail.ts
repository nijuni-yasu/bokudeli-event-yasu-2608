import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { DEFAULT_FROM, getCommunityEmailsForEvent } from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import { getEventUrl, getUserUrl } from './utils/urls.js'
import { convertToDateWeekdayShort, convertToDuration } from '@shokujii/common/utils/datetime.js'
import { getUser, getUserPersonalInformation } from './stores/user.js'
import { convertReferenceToEvent, ShokujiiEvent } from './stores/event.js'
import { makeIcs } from './makeIcs.js'

const ORDER_COMPLETION_TEMPLATE_ID = 'd-b94849438f2642a29973670f3d79809f'
const ORDER_COMPLETION_FOR_ORGANIZER_TEMPLATE_ID = 'd-38e33bff82d740d88b33b56347f63df7'

async function getUserEmail(userId: string): Promise<string | undefined> {
  const userPersonalInformation = await getUserPersonalInformation(userId)
  return userPersonalInformation?.user_email
}

async function sendOrderCompletionMailToMember(event: ShokujiiEvent, userId: string): Promise<void> {
  const dynamicTemplateData = {
    date: convertToDateWeekdayShort(event.event_start_datetime),
    event_datetime: convertToDuration(event.event_start_datetime, event.event_end_datetime),
    event_name: event.event_name,
    event_cover_url: event.event_cover_url,
    community_name: event.community_name,
    event_address: event.event_address,
    shop_name: event.shop_name,
    event_url: getEventUrl(event.community_account, event.id),
    is_public: event.is_public,
  }

  const to = await getUserEmail(userId)
  if (!to) {
    return
  }

  const icsContent = await makeIcs(event, 'ja-JP')
  const attachments = icsContent
    ? [
        {
          content: Buffer.from(icsContent, 'utf-8').toString('base64'),
          filename: 'invite.ics',
          type: 'text/calendar',
          disposition: 'attachment',
        },
      ]
    : undefined

  await sgMail.send({
    to,
    from: DEFAULT_FROM,
    templateId: ORDER_COMPLETION_TEMPLATE_ID,
    dynamicTemplateData,
    attachments,
  })
}

async function sendOrderCompletionMailToOrganizers(event: ShokujiiEvent, userId: string): Promise<void> {
  const userData = await getUser(userId, true)

  if (!userData) {
    console.warn(`User data not found for userId: ${userId}`)
    return
  }

  const emails = await getCommunityEmailsForEvent(event)

  const dynamicTemplateData = {
    date: convertToDateWeekdayShort(event.event_start_datetime),
    event_name: event.event_name,
    event_url: getEventUrl(event.community_account, event.id),
    user_name: userData.user_name,
    user_url: getUserUrl(userData.user_id),
  }

  await Promise.all(
    emails.map(async (to) => {
      await sgMail.send({
        to,
        from: DEFAULT_FROM,
        templateId: ORDER_COMPLETION_FOR_ORGANIZER_TEMPLATE_ID,
        dynamicTemplateData,
      })
    }),
  )
}

export const onOrderChanged = onDocumentWritten(
  {
    document: 'communities/{communityId}/events/{eventId}/orders/{orderId}',
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
    const promises: Promise<void>[] = []

    if (before?.get('status') !== after?.get('status') && after?.get('status') === 'ordered') {
      const eventRef = after.ref.parent.parent
      if (!eventRef) {
        console.warn('Event reference is null')
        return
      }

      const userId = after.get('user_id')
      const afterEvent = await convertReferenceToEvent(eventRef)
      if (!afterEvent) {
        console.warn(`Event not found for eventRef: ${eventRef.path}`)
        return
      }
      promises.push(sendOrderCompletionMailToMember(afterEvent, userId))
      promises.push(sendOrderCompletionMailToOrganizers(afterEvent, userId))
    }

    await Promise.all(promises)
  },
)
