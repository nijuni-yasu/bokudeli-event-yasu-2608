import { DEFAULT_FROM, SUPPORT_MAIL } from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import { sendDynamicTemplateWithPersonalizations } from './utils/sendgridBulk.js'
import { getUserPersonalInformation } from './stores/user.js'
import { getEventPartnerShop } from './stores/partner.js'
import { getEventUrl, getPartnerOrderUrl } from './utils/urls.js'
import { convertToDateWeekdayShort, convertToDuration } from '@shokujii/common/utils/datetime.js'
import type { ShokujiiEvent } from './stores/event.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('eventBulkCancellationMail')

/** 店舗向け — cancelEvent と同一テンプレ */
const EVENT_CANCELLATION_TEMPLATE_ID = 'd-9c498e754b91498b9ce0f2e83c219728'

/** 参加者向け返金通知（SendGrid 上でテンプレ作成後に差し替え） */
export const EVENT_BULK_CANCELLATION_PARTICIPANT_TEMPLATE_ID = 'd-9c498e754b91498b9ce0f2e83c219728'

export async function sendEventBulkCancellationMails(params: {
  event: ShokujiiEvent
  cancelReason: string
  /** 一括中止で canceled にした注文の user_id（注文は既に canceled のため注文の再取得では宛先を解決できない） */
  participantUserIds: string[]
}): Promise<void> {
  const { event, cancelReason, participantUserIds } = params
  const uniqueParticipantUserIds = [...new Set(participantUserIds)]
  const eventId = event.id

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
            cancel_reason: cancelReason,
            community_name: event.community_name,
            shop_name: shopData.shop_name,
            event_url: getEventUrl(event.community_account, eventId),
            admin_url: getPartnerOrderUrl(eventId),
          },
        })
      }
    }
  } catch (error) {
    // 中止・返金は確定済みのため、メール失敗で呼び出し元（Scheduled / Callable）を失敗させず握りつぶす
    logger.error('Failed to send cancellation mail to shop', {
      eventId,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  if (uniqueParticipantUserIds.length === 0) {
    return
  }

  try {
    const memberEmails = (
      await Promise.all(
        uniqueParticipantUserIds.map(async (userId) => (await getUserPersonalInformation(userId))?.user_email),
      )
    ).filter((email): email is string => email != null && email !== '')
    const dynamicTemplateData = {
      event_name: event.event_name,
      event_date: convertToDateWeekdayShort(event.event_start_datetime),
      event_time: convertToDuration(event.event_start_datetime, event.event_end_datetime),
      cancel_reason: cancelReason,
      event_url: getEventUrl(event.community_account, eventId),
      community_name: event.community_name,
    }
    // バッチ単位の失敗・受付件数のログは sendDynamicTemplateWithPersonalizations 内で記録される
    await sendDynamicTemplateWithPersonalizations(
      {
        from: DEFAULT_FROM,
        templateId: EVENT_BULK_CANCELLATION_PARTICIPANT_TEMPLATE_ID,
      },
      memberEmails.map((to) => ({ to, dynamicTemplateData })),
      { feature: 'eventBulkCancellationMail', eventId, communityId: event.community_id },
    )
  } catch (error) {
    // 中止・返金は確定済みのため、メール失敗で呼び出し元（Scheduled / Callable）を失敗させず握りつぶす
    logger.error('Failed to send cancellation mail to participants', {
      eventId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
