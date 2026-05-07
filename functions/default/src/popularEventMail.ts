/**
 * 人気イベント（参加人数閾値）の全ユーザー向けメール。
 *
 * 運用手順（コード外）:
 * - Firestore `configs/global` に `popular_event_mail_threshold`（正の整数）を設定する。
 * - SendGrid で動的テンプレートを作成し、{@link POPULAR_EVENT_MAIL_TEMPLATE_ID} を置き換える。
 * - SendGrid ASM で {@link POPULAR_EVENT_MAIL_ASM_GROUP_ID} に対応する購読解除グループを作成し、ID を合わせる。
 *
 * 仕様: documents/06_メール通知/メール_全ユーザー_人気イベント.md
 */
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { createModuleLogger } from './utils/logger.js'
import { getConfigGlobal } from './stores/config.js'
import { getEventInCommunity, saveEvent } from './stores/event.js'
import { getAllUsers } from './stores/user.js'
import { sendDynamicTemplateWithPersonalizations, type SendDynamicTemplateBulkRecipient } from './utils/sendgridBulk.js'
import { DEFAULT_FROM } from './utils/mail.js'
import { convertStoragePathToURL, getEventUrl } from './utils/urls.js'
import { convertToDateWeekdayShort, convertToDuration } from '@shokujii/common/utils/datetime.js'
import { parsePopularEventMailThreshold, isEligibleForPopularEventMailSend } from './utils/popularEventMailThreshold.js'
import { getEventCoverStoragePath } from '@shokujii/common/utils/storagePaths.js'

const logger = createModuleLogger('popularEventMail')

/** SendGrid ダッシュボードでテンプレート作成後、実 ID に差し替える */
export const POPULAR_EVENT_MAIL_TEMPLATE_ID = 'd-c1914ade0c8644cab22bfb8d6d6b16ab'

/**
 * SendGrid ASM のグループ ID。ダッシュボードで「人気イベントメール」用グループを作成し、本番 ID に合わせる。
 * （未作成のままだと送信 API が失敗する可能性がある）
 */
export const POPULAR_EVENT_MAIL_ASM_GROUP_ID = 31252

/**
 * `applyOrderConfirmedSideEffects` 内で `recalcEventMembers` が例外なく完了したあとに呼ぶ（members に差分がなくても再実行時の取りこぼし防止のため）。
 * 第 2 トランザクションで `sent_popular_event_mail_at` を原子的に立て、条件を満たすときのみ全ユーザーへ送信する。
 */
export async function trySendPopularEventMailAfterMembersSync(params: {
  communityId: string
  eventId: string
  triggerUserId: string
}): Promise<void> {
  const { communityId, eventId, triggerUserId } = params

  const config = await getConfigGlobal()
  const parsed = parsePopularEventMailThreshold(config?.popular_event_mail_threshold)
  if (!parsed.ok) {
    if (parsed.reason === 'invalid') {
      logger.error('popular_event_mail_threshold is not a positive integer; skipping popular event mail', {
        communityId,
        eventId,
        popular_event_mail_threshold: config?.popular_event_mail_threshold,
      })
    }
    return
  }
  const threshold = parsed.value

  const db = getFirestore()
  const event = await db.runTransaction(async (transaction) => {
    const transactionEvent = await getEventInCommunity(communityId, eventId, transaction)
    if (transactionEvent == null) {
      return null
    }
    const memberCount = transactionEvent.members.length
    if (
      !isEligibleForPopularEventMailSend({
        isPublic: transactionEvent.is_public,
        eventStatusValue: transactionEvent.event_status.value,
        sentPopularEventMailAt: transactionEvent.sent_popular_event_mail_at,
        memberCount,
        eventMaxPeople: transactionEvent.event_max_people,
        threshold,
      })
    ) {
      return null
    }

    transactionEvent.sent_popular_event_mail_at = Timestamp.now().toMillis()
    await saveEvent(triggerUserId, transactionEvent, transaction)
    return transactionEvent
  })

  if (event == null) {
    return
  }

  const baseTemplateData = buildPopularEventTemplateData(event, memberCountLabel(event))

  const recipients: SendDynamicTemplateBulkRecipient[] = []
  let fetchErrorCount = 0
  for await (const r of getAllUsers(true)) {
    if (!r.ok) {
      logger.error('Failed to get user for popular event mail', { error: r.error, eventId: event.id })
      fetchErrorCount++
      continue
    }
    const user = r.value
    if (!user?.user_email) {
      continue
    }
    recipients.push({
      to: user.user_email,
      dynamicTemplateData: {
        ...baseTemplateData,
        user_name: user.user_name,
      },
    })
  }

  if (recipients.length === 0) {
    logger.warn('No recipients for popular event mail', { eventId: event.id, communityId, fetchErrorCount })
    return
  }

  try {
    const bulkResult = await sendDynamicTemplateWithPersonalizations(
      {
        from: DEFAULT_FROM,
        templateId: POPULAR_EVENT_MAIL_TEMPLATE_ID,
        asm: {
          groupId: POPULAR_EVENT_MAIL_ASM_GROUP_ID,
        },
      },
      recipients,
      { feature: 'popularEvent', eventId: event.id, communityId },
    )

    if (bulkResult.totalRecipientsAccepted > 0) {
      logger.info('Sent popular event mail', {
        eventId: event.id,
        communityId,
        totalRecipientsAccepted: bulkResult.totalRecipientsAccepted,
        batchesAttempted: bulkResult.batchesAttempted,
        batchesSucceeded: bulkResult.batchesSucceeded,
        batchesFailed: bulkResult.batchesFailed,
        recipientTargetCount: recipients.length,
        fetchErrorCount,
      })
    }

    if (bulkResult.errors.length > 0) {
      logger.warn('Popular event mail batch failures', {
        eventId: event.id,
        communityId,
        errors: bulkResult.errors,
        totalRecipientsAccepted: bulkResult.totalRecipientsAccepted,
        recipientTargetCount: recipients.length,
      })
    }
  } catch (error) {
    logger.error('Failed to send popular event mail', {
      error,
      eventId: event.id,
      communityId,
    })
  }
}

function memberCountLabel(event: { members: { length: number }; event_max_people: number }): string {
  return `${event.members.length} / ${event.event_max_people}`
}

function buildPopularEventTemplateData(
  event: {
    community_id: string
    community_name: string
    community_account: string
    id: string
    event_name: string
    event_desc: string
    event_start_datetime: number
    event_end_datetime: number
    fullAddress: string
    event_place: string
    shop_name: string
    event_deadline_datetime: number
    event_payment: string
  },
  eventMembersLabel: string,
): Record<string, unknown> {
  return {
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
    event_num_members_label: eventMembersLabel,
  }
}
