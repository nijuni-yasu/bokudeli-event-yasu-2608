import { onCall, HttpsError } from 'firebase-functions/https'
import { getFirestore } from 'firebase-admin/firestore'
import { DateTime } from 'luxon'
import type { CancelEventRequest, CancelEventResponse } from '@shokujii/common/apis/eventCancellation.js'
import { isPresetEventCancelReason } from '@shokujii/common/constants/eventCancellationReasons.js'
import { getEventInCommunity } from './stores/event.js'
import { getCommunity } from './stores/community.js'
import { getEventPartnerShop } from './stores/partner.js'
import * as sgMail from './utils/sendgrid.js'
import { DEFAULT_FROM, SUPPORT_MAIL } from './utils/mail.js'
import { getPartnerOrderUrl, getEventUrl } from './utils/urls.js'
import { convertToDateWeekdayShort, convertToDuration } from '@shokujii/common/utils/datetime.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('eventCancellation')

// SendGrid テンプレートID（SendGrid 上でテンプレート作成後に差し替え）
const EVENT_CANCELLATION_TEMPLATE_ID = 'd-9c498e754b91498b9ce0f2e83c219728'

export const cancelEvent = onCall<CancelEventRequest, Promise<CancelEventResponse>>(
  { region: 'asia-northeast1', secrets: ['SENDGRID_API_KEY'] },
  async (request) => {
    if (request.auth == null) {
      throw new HttpsError('unauthenticated', 'User must be logged in')
    }
    const { uid } = request.auth
    const { communityId, eventId, cancelReason } = request.data

    if (communityId === '' || eventId === '' || cancelReason === '') {
      throw new HttpsError('invalid-argument', '必須パラメータが不足しています')
    }
    const isPreset = isPresetEventCancelReason(cancelReason)
    const reasonToStore = isPreset ? cancelReason : cancelReason.trim()
    if (!isPreset && reasonToStore.length < 1) {
      throw new HttpsError('invalid-argument', '「その他」を選んだ場合はキャンセル理由を入力してください')
    }

    const community = await getCommunity(communityId)
    if (community == null) {
      throw new HttpsError('not-found', 'コミュニティが見つかりません')
    }
    const isManager = await community.hasRole(uid, 'manager')
    if (!isManager) {
      throw new HttpsError('permission-denied', 'Forbidden')
    }

    // ステータス・参加者・注文の判定〜更新を 1 トランザクションで実行
    const event = await getFirestore().runTransaction(async (transaction) => {
      const tEvent = await getEventInCommunity(communityId, eventId, transaction)
      if (tEvent == null) {
        throw new HttpsError('not-found', 'イベントが見つかりません')
      }

      // 終了済み（calculatedEventStatus === 'finished'）も拒否
      const calculatedStatus = tEvent.calculatedEventStatus
      if (calculatedStatus !== 'applying_reservation' && calculatedStatus !== 'accepting_order') {
        throw new HttpsError('failed-precondition', 'このステータスではキャンセルできません')
      }

      // Phase 1: 参加者なしのみ。members 再集約前でも ordered 注文があれば拒否する
      if (tEvent.members.length > 0 || (await tEvent.hasOrderedOrders(transaction))) {
        throw new HttpsError('failed-precondition', '参加者がいるため、サポートへ連絡してください')
      }

      await tEvent.updateEvent(
        {
          event_status: {
            value: 'event_canceled',
            shop_comment: tEvent.event_status.shop_comment,
            cancel_reason: reasonToStore,
          },
          canceled_at: DateTime.now().toMillis(),
          canceled_by: uid,
        },
        uid,
        transaction,
      )

      return tEvent
    })

    logger.info('Event canceled', { eventId, communityId, userId: uid })

    // メール送信は副作用なのでトランザクション外
    try {
      const shopData = await getEventPartnerShop(event)
      if (shopData) {
        const shopEmails = shopData.getEmails()
        if (shopEmails.length > 0) {
          await sgMail.send({
            to: shopEmails,
            from: DEFAULT_FROM,
            cc: SUPPORT_MAIL,
            templateId: EVENT_CANCELLATION_TEMPLATE_ID,
            dynamicTemplateData: {
              event_name: event.event_name,
              event_date: convertToDateWeekdayShort(event.event_start_datetime),
              event_time: convertToDuration(event.event_start_datetime, event.event_end_datetime),
              event_address: event.fullAddress,
              organizer_company: event.organizer_company,
              organizer_fullname: event.organizer_fullname,
              organizer_phone_personal: event.organizer_phone_personal,
              organizer_phone_company: event.organizer_phone_company,
              organizer_email: event.organizer_email,
              cancel_reason: reasonToStore,
              community_name: event.community_name,
              shop_name: shopData.shop_name,
              event_url: getEventUrl(event.community_account, eventId),
              admin_url: getPartnerOrderUrl(eventId),
            },
          })
        }
      }
    } catch (error) {
      // メール送信失敗はキャンセル処理を阻害しない
      logger.error('Failed to send cancellation mail to shop', {
        eventId,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    return { success: true, event_id: eventId }
  },
)
