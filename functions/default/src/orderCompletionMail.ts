import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { logger } from 'firebase-functions'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { DEFAULT_FROM, getCommunityEmailsForEvent } from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import { getEventUrl, getUserUrl, FIREBASE_STORAGE_BASE_URL } from './utils/urls.js'
import { convertToDateWeekdayShort, convertToDuration } from '@shokujii/common/utils/datetime.js'
import { getUser, getUserPersonalInformation } from './stores/user.js'
import { convertReferenceToEvent, ShokujiiEvent, saveEvent, getEvent } from './stores/event.js'
import { makeIcs } from './makeIcs.js'
import { getCommunity } from './stores/community.js'
import { getUserImageUrl } from '@shokujii/common/utils/buildThumbnailsLinks.js'

const ORDER_COMPLETION_TEMPLATE_ID = 'd-b94849438f2642a29973670f3d79809f'
const ORDER_COMPLETION_FOR_ORGANIZER_TEMPLATE_ID = 'd-6f18a5804cb9458fb1267924ff954a95'
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
    logger.warn('User data not found', { userId })
    return
  }

  const emails = await getCommunityEmailsForEvent(event)

  // Get small thumbnail URL for user image
  const userImageUrl = getUserImageUrl(userData.user_id, userData.user_image_url, 'medium', FIREBASE_STORAGE_BASE_URL)

  const dynamicTemplateData = {
    date: convertToDateWeekdayShort(event.event_start_datetime),
    event_name: event.event_name,
    event_url: getEventUrl(event.community_account, event.id),
    user_name: userData.user_name,
    user_url: getUserUrl(userData.user_id),
    user_image_url: userImageUrl,
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
    logger.warn('Community not found', { communityId })
    return []
  }

  const members = await community.getMembers()

  // 全メンバーのメールアドレスを並列取得し、nullを除外
  const emailResults = await Promise.all(members.map(async (member) => await getUserEmail(member.id)))
  const emails = emailResults.filter((email): email is string => email != null)

  return emails
}

/**
 * 新着イベント通知メールをコミュニティメンバー全員に送信
 *
 * メール送信の前にトランザクション内で sent_new_event_mail_at フラグを設定
 * これにより以下を保証：
 * - 並行実行時の重複送信防止（複数のリクエストが同時に来ても、最初の1回のみ送信）
 * - メール送信失敗時の再送信防止（送信処理が失敗しても、フラグにより2度目の送信は行われない）
 */
async function sendNewEventNotificationToMembers(eventId: string, userId: string, communityId: string): Promise<void> {
  // メンバー0人の場合は早期リターン
  const emails = await getCommunityMemberEmails(communityId)
  if (emails.length === 0) {
    return
  }

  const event = await getFirestore().runTransaction(async (transaction) => {
    const transactionEvent = await getEvent(eventId, transaction)
    // is_publicがfalseまたは既に送信済みの場合はスキップ
    if (transactionEvent == null || !transactionEvent.is_public || transactionEvent.sent_new_event_mail_at) {
      return null
    }
    // メール送信前にフラグを立てる
    transactionEvent.sent_new_event_mail_at = Timestamp.now().toMillis()
    await saveEvent(userId, transactionEvent, transaction)
    return transactionEvent
  })

  // トランザクションが成功した場合のみ、新着メールを送信
  if (!event) {
    return
  }

  try {
    const dynamicTemplateData = {
      community_name: event.community_name,
      event_url: getEventUrl(event.community_account, event.id),
      event_name: event.event_name,
      event_cover_url: event.event_cover_url,
      event_desc: event.event_desc,
      event_datetime: convertToDuration(event.event_start_datetime, event.event_end_datetime),
      event_start_datetime: convertToDateWeekdayShort(event.event_start_datetime),
      event_end_datetime: convertToDateWeekdayShort(event.event_end_datetime),
      event_address: event.event_address,
      event_place: event.event_place,
      shop_name: event.shop_name,
      event_deadline_datetime: convertToDateWeekdayShort(event.event_deadline_datetime),
      event_payment: event.event_payment,
    }

    // Promise.allSettled を使用して、一部失敗しても続行
    const results = await Promise.allSettled(
      emails.map(async (to) => {
        return sgMail.send({
          to,
          from: DEFAULT_FROM,
          templateId: NEW_EVENT_NOTIFICATION_TEMPLATE_ID,
          dynamicTemplateData,
        })
      }),
    )

    // 成功・失敗の集計
    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const failedCount = results.filter((r) => r.status === 'rejected').length

    if (successCount > 0) {
      logger.info('Sent new event notification emails', {
        eventId: event.id,
        communityId,
        successCount,
        failedCount,
        totalEmails: emails.length,
      })
    }

    // 失敗したメールの詳細をログ出力
    if (failedCount > 0) {
      logger.warn('Failed to send new event notifications', {
        eventId: event.id,
        communityId,
        successCount,
        failedCount,
        totalEmails: emails.length,
        errors: results
          .filter((r) => r.status === 'rejected')
          .map((r) => (r as PromiseRejectedResult).reason?.message || r.reason),
      })
    }
  } catch (error) {
    logger.error('Failed to send new event notification', {
      error,
      eventId,
      communityId,
    })
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
      logger.warn('Change data is undefined')
      return
    }

    const before = change.data.before
    const after = change.data.after
    const promises: Promise<void>[] = []

    if (before?.get('status') !== after?.get('status') && after?.get('status') === 'ordered') {
      const eventRef = after.ref.parent.parent
      if (!eventRef) {
        logger.warn('Event reference is null')
        return
      }

      const userId = after.get('user_id')
      const afterEvent = await convertReferenceToEvent(eventRef)
      if (!afterEvent) {
        logger.warn('Event not found for eventRef', { eventRefPath: eventRef.path })
        return
      }
      promises.push(sendOrderCompletionMailToMember(afterEvent, userId))
      promises.push(sendOrderCompletionMailToOrganizers(afterEvent, userId))
      // 新着イベント通知メールを送信（is_publicかつ未送信の場合のみ）
      promises.push(sendNewEventNotificationToMembers(afterEvent.id, userId, afterEvent.community_id))
    }

    await Promise.all(promises)
  },
)
