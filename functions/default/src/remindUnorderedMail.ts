import { createModuleLogger } from './utils/logger.js'
import { DEFAULT_FROM } from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import { convertStoragePathToURL, getEventUrl } from './utils/urls.js'
import { getCommunity } from './stores/community.js'
import { getAcceptingOrderEventsBeforeDeadline } from './stores/event.js'
import { isEnterpriseEvent } from './utils/enterpriseMail.js'
import { getUser } from './stores/user.js'
import { convertToDuration } from '@shokujii/common/utils/datetime.js'
import { getEventCoverStoragePath } from '@shokujii/common/utils/storagePaths.js'

const logger = createModuleLogger('remindUnorderedMail')

const ONE_DAY_MILLIS = 24 * 60 * 60 * 1000

export const REMIND_UNORDERED_TEMPLATE_ID = 'd-90f8a9a3181e455cba2132d4d1422a66'

/** リマインド間隔（日）。48 時間おき = 2 日ごとにウィンドウを試す */
export const UNORDERED_REMIND_INTERVAL_DAYS = 2

/**
 * 承認（accepting_order ログの updated_at）から何日後までリマインド対象とするかの上限。
 * 実際の送信タイミングは INTERVAL 日ごと（例: 2, 4, 6, … 30 日後の 1 分ウィンドウ）。
 */
export const MAX_UNORDERED_REMIND_SPAN_DAYS = 30

interface RemindUnorderedTemplateData {
  community_manager_fullname: string
  event_name: string
  event_start_datetime: string
  event_place: string
  shop_name: string
  event_url: string
  event_cover_url: string
}

/**
 * コミュニティ管理者向け・未注文リマインドメール
 * 候補イベントは 1 回取得。各イベントでは hasOrderedOrders / getLastUpdatedTimeByStatus を 1 回だけ実行し、
 * dayOffset（2〜30 日・2 日刻み）のウィンドウ判定はメモリ上で行う。
 * @param nowMillis 実行時刻（注文期限フィルタ用。pollingTask の end を渡す）
 * @param start pollingTask の 1 分ウィンドウ開始
 * @param end pollingTask の 1 分ウィンドウ終了
 */
export async function sendUnorderedRemindMailToManagers(nowMillis: number, start: number, end: number): Promise<void> {
  const events = await getAcceptingOrderEventsBeforeDeadline(nowMillis)

  const sendMailPromises = events.map((event) =>
    (async () => {
      try {
        if (isEnterpriseEvent(event)) {
          return
        }
        const hasOrders = await event.hasOrderedOrders()
        if (hasOrders) {
          return
        }

        const updatedAt = await event.getLastUpdatedTimeByStatus('accepting_order')
        if (updatedAt == null) {
          return
        }

        let matchesReminderWindow = false
        for (
          let dayOffset = UNORDERED_REMIND_INTERVAL_DAYS;
          dayOffset <= MAX_UNORDERED_REMIND_SPAN_DAYS;
          dayOffset += UNORDERED_REMIND_INTERVAL_DAYS
        ) {
          const windowStart = start - dayOffset * ONE_DAY_MILLIS
          const windowEnd = end - dayOffset * ONE_DAY_MILLIS
          if (updatedAt > windowStart && updatedAt <= windowEnd) {
            matchesReminderWindow = true
            break
          }
        }
        if (!matchesReminderWindow) {
          return
        }

        const community = await getCommunity(event.community_id)
        if (community == null) {
          return
        }

        const managers = await community.getMembersByRole('manager')
        const users = await Promise.all(managers.map((manager) => getUser(manager.id, true)))

        const baseTemplateData: Omit<RemindUnorderedTemplateData, 'community_manager_fullname'> = {
          event_name: event.event_name,
          event_start_datetime: convertToDuration(event.event_start_datetime, event.event_end_datetime),
          event_place: event.event_place !== '' ? event.event_place : event.fullAddress,
          shop_name: event.shop_name,
          event_url: getEventUrl(event.community_account, event.id),
          event_cover_url: convertStoragePathToURL(getEventCoverStoragePath(event.community_id, event.id)),
        }

        const sendPromises: Promise<unknown>[] = []
        for (const user of users) {
          if (user == null || user.user_email === '') {
            continue
          }

          const communityManagerFullname = user.user_name != null && user.user_name !== '' ? user.user_name : '管理者'

          const dynamicTemplateData: RemindUnorderedTemplateData = {
            ...baseTemplateData,
            community_manager_fullname: communityManagerFullname,
          }

          sendPromises.push(
            sgMail.send({
              to: user.user_email,
              from: DEFAULT_FROM,
              templateId: REMIND_UNORDERED_TEMPLATE_ID,
              dynamicTemplateData,
            }),
          )
        }

        if (sendPromises.length === 0) {
          return
        }

        const results = await Promise.allSettled(sendPromises)
        const failedCount = results.filter((r) => r.status === 'rejected').length
        if (failedCount > 0) {
          logger.warn('Failed to send', { eventId: event.id, failedCount })
        }
      } catch (err) {
        logger.warn('Error', { eventId: event.id, error: err })
      }
    })(),
  )

  await Promise.all(sendMailPromises)
}
