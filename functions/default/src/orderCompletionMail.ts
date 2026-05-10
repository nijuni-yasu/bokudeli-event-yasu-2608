import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { DEFAULT_FROM, getCommunityEmailsForEvent } from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import { sendDynamicTemplateWithPersonalizations } from './utils/sendgridBulk.js'
import { getEventUrl, getUserUrl, FIREBASE_STORAGE_BASE_URL, convertStoragePathToURL } from './utils/urls.js'
import { getEventCoverStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { convertToDateWeekdayShort, convertToDuration } from '@shokujii/common/utils/datetime.js'
import { getUser, getUserPersonalInformation } from './stores/user.js'
import { ShokujiiEvent, saveEvent, getEvent } from './stores/event.js'
import { makeIcs } from './makeIcs.js'
import { getCommunity } from './stores/community.js'
import { getUserImageUrl } from '@shokujii/common/utils/buildThumbnailsLinks.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('orderCompletionMail')

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
    event_cover_url: convertStoragePathToURL(getEventCoverStoragePath(event.community_id, event.id)),
    community_name: event.community_name,
    event_address: event.fullAddress,
    shop_name: event.shop_name,
    event_url: getEventUrl(event.community_account, event.id),
    is_public: event.is_public,
  }

  const raw = await getUserEmail(userId)
  const to = raw?.trim()
  if (to === undefined || to === '') {
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

  // メール上のアバター表示用に large（500px）を使う（medium は 100px で粗く見える）
  const userImageUrl = getUserImageUrl(userData.user_id, userData.user_image_url, 'large', FIREBASE_STORAGE_BASE_URL)

  const dynamicTemplateData = {
    date: convertToDateWeekdayShort(event.event_start_datetime),
    event_name: event.event_name,
    event_url: getEventUrl(event.community_account, event.id),
    user_name: userData.user_name,
    user_url: getUserUrl(userData.user_id),
    user_image_url: userImageUrl,
  }

  const bulkResult = await sendDynamicTemplateWithPersonalizations(
    {
      from: DEFAULT_FROM,
      templateId: ORDER_COMPLETION_FOR_ORGANIZER_TEMPLATE_ID,
    },
    emails.map((to) => ({ to, dynamicTemplateData })),
    { feature: 'orderCompletionOrganizers', eventId: event.id },
  )

  if (bulkResult.errors.length > 0) {
    logger.warn('Failed to send order completion mail to organizers', {
      eventId: event.id,
      batchesSucceeded: bulkResult.batchesSucceeded,
      batchesFailed: bulkResult.batchesFailed,
      totalRecipientsAccepted: bulkResult.totalRecipientsAccepted,
      totalEmails: emails.length,
      errors: bulkResult.errors,
    })
  }
}

/**
 * コミュニティメンバー全員のメールアドレスを取得（送信可能な trim 済み非空のみ）
 */
async function getCommunityMemberEmails(communityId: string): Promise<string[]> {
  const community = await getCommunity(communityId)
  if (!community) {
    logger.warn('Community not found', { communityId })
    return []
  }

  const members = await community.getMembers()

  const emailResults = await Promise.all(members.map(async (member) => await getUserEmail(member.id)))
  const emails = emailResults
    .map((raw) => (raw == null ? undefined : raw.trim()))
    .filter((email): email is string => email !== undefined && email !== '')

  const skipped = members.length - emails.length
  if (skipped > 0) {
    logger.warn('Skipped community members without email for new event notification', {
      communityId,
      skipped,
      memberCount: members.length,
      sendableCount: emails.length,
    })
  }

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
  // 送信先が 0 件のときはトランザクション（sent_new_event_mail_at 更新）も行わない
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
      event_cover_url: convertStoragePathToURL(getEventCoverStoragePath(event.community_id, event.id)),
      event_desc: event.event_desc,
      event_datetime: convertToDuration(event.event_start_datetime, event.event_end_datetime),
      event_start_datetime: convertToDateWeekdayShort(event.event_start_datetime),
      event_end_datetime: convertToDateWeekdayShort(event.event_end_datetime),
      event_address: event.fullAddress,
      event_place: event.event_place,
      shop_name: event.shop_name,
      event_deadline_datetime: convertToDateWeekdayShort(event.event_deadline_datetime),
      event_payment: event.event_payment,
    }

    const bulkResult = await sendDynamicTemplateWithPersonalizations(
      {
        from: DEFAULT_FROM,
        templateId: NEW_EVENT_NOTIFICATION_TEMPLATE_ID,
      },
      emails.map((to) => ({ to, dynamicTemplateData })),
      { feature: 'newEventNotification', eventId: event.id, communityId },
    )

    const totalRecipientsAccepted = bulkResult.totalRecipientsAccepted
    const batchesFailed = bulkResult.batchesFailed

    if (totalRecipientsAccepted > 0) {
      logger.info('Sent new event notification emails', {
        eventId: event.id,
        communityId,
        totalRecipientsAccepted,
        batchesAttempted: bulkResult.batchesAttempted,
        batchesSucceeded: bulkResult.batchesSucceeded,
        batchesFailed,
        recipientTargetCount: emails.length,
      })
    }

    if (bulkResult.errors.length > 0) {
      logger.warn('Failed to send new event notifications', {
        eventId: event.id,
        communityId,
        totalRecipientsAccepted,
        batchesAttempted: bulkResult.batchesAttempted,
        batchesSucceeded: bulkResult.batchesSucceeded,
        batchesFailed,
        recipientTargetCount: emails.length,
        errors: bulkResult.errors,
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

/**
 * 注文確定（member_orders が ordered になった）後に 1 回だけ呼ぶ。
 * `orderConfirmedSideEffects.applyOrderConfirmedSideEffects` 経由で呼び出す（member_orders 単位の onDocumentWritten では N 回発火するため廃止）。
 * 呼び出し元の Function では secrets に SENDGRID_API_KEY を含めること。
 */
export async function sendOrderCompletionMails(event: ShokujiiEvent, userId: string): Promise<void> {
  await Promise.all([
    sendOrderCompletionMailToMember(event, userId),
    sendOrderCompletionMailToOrganizers(event, userId),
    sendNewEventNotificationToMembers(event.id, userId, event.community_id),
  ])
}
