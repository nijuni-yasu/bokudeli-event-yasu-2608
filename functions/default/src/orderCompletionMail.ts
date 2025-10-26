import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { DEFAULT_FROM, getCommunityEmailsForEvent } from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import { getEventUrl, getUserUrl } from './utils/urls.js'
import { convertToDateWeekdayShort, convertToDuration } from '@shokujii/common/utils/datetime.js'
import { getUser, getUserPersonalInformation } from './stores/user.js'
import { convertReferenceToEvent, ShokujiiEvent, saveEvent } from './stores/event.js'
import { makeIcs } from './makeIcs.js'
import { getCommunity } from './stores/community.js'

const ORDER_COMPLETION_TEMPLATE_ID = 'd-b94849438f2642a29973670f3d79809f'
const ORDER_COMPLETION_FOR_ORGANIZER_TEMPLATE_ID = 'd-38e33bff82d740d88b33b56347f63df7'
const NEW_EVENT_NOTIFICATION_TEMPLATE_ID = 'd-5ed49e5d3b5c43e1823a96bbf80af471' // shokujii_newevent_to_community_members

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

/**
 * コミュニティメンバー全員のメールアドレスを取得
 */
async function getCommunityMemberEmails(communityId: string): Promise<string[]> {
  const community = await getCommunity(communityId)
  if (!community) {
    console.warn(`Community not found: ${communityId}`)
    return []
  }

  const members = await community.getMembers()
  const emails: string[] = []

  await Promise.all(
    members.map(async (member) => {
      const email = await getUserEmail(member.id)
      if (email) {
        emails.push(email)
      }
    }),
  )

  return emails
}

/**
 * 新着イベント通知メールをコミュニティメンバー全員に送信
 */
async function sendNewEventNotificationToMembers(event: ShokujiiEvent, userId: string): Promise<void> {
  try {
    // is_publicがfalse、または既に送信済みの場合はスキップ
    if (!event.is_public || event.is_sent_new_event_mail_at) {
      return
    }

    const emails = await getCommunityMemberEmails(event.community_id)

    if (emails.length === 0) {
      console.warn(`No member emails found for community: ${event.community_id}`)
      return
    }

    const dynamicTemplateData = {
      community_name: event.community_name,
      event_url: getEventUrl(event.community_account, event.id),
      event_name: event.event_name,
      event_cover_url: event.event_cover_url,
      event_desc: event.event_desc,
      event_datetime: convertToDuration(event.event_start_datetime, event.event_end_datetime),
      event_start_datetime: convertToDateWeekdayShort(event.event_start_datetime) || '',
      event_end_datetime: convertToDateWeekdayShort(event.event_end_datetime) || '',
      event_address: event.event_address,
      event_place: event.event_place,
      shop_name: event.shop_name,
      event_deadline_datetime: convertToDateWeekdayShort(event.event_deadline_datetime) || '',
      event_payment: event.event_payment,
    }

    // 全メンバーにメール送信
    await Promise.all(
      emails.map(async (to) => {
        await sgMail.send({
          to,
          from: DEFAULT_FROM,
          templateId: NEW_EVENT_NOTIFICATION_TEMPLATE_ID,
          dynamicTemplateData,
        })
      }),
    )

    // 送信済みフラグを設定してイベントを更新
    event.is_sent_new_event_mail_at = Date.now()
    await saveEvent(userId, event)

    console.log(`New event notification sent for event: ${event.id}`)
  } catch (error) {
    console.error('Failed to send new event notification:', error)
  }
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
      // 新着イベント通知メールを送信（is_publicかつ未送信の場合のみ）
      promises.push(sendNewEventNotificationToMembers(afterEvent, userId))
    }

    await Promise.all(promises)
  },
)
