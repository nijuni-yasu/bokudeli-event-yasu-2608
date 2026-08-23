import { onSchedule } from 'firebase-functions/v2/scheduler'
import { DateTime } from 'luxon'
import {
  sendOrderDeadlineMailToShop,
  sendOrderDeadlineMailToOrganizers,
  sendOrderDeadlineMailToMembers,
  sendOrderDeadlineReminderToCommunityMembers,
} from './orderDeadlineMail.js'
import { sendEventConcludedMailToMembers } from './eventConclusionMail.js'
import { sendInCartNotificationToMember, sendInCartEventDeadlineNotificationToMember } from './inCartNotification.js'
import { sendApplyingOrderRemindMailToShop, sendOrderRemindMailToOrganizer } from './orderRemindMail.js'
import { sendUnorderedRemindMailToManagers } from './remindUnorderedMail.js'
import { sendRejectOrderMailToShop } from './rejectOrderMail.js'
import { sendLetter } from './letter.js'
import { sendInvoiceMailToOrganizers } from './eventBillInvoice.js'
import { processMinimumParticipantsChecks } from './minimumParticipants.js'

const ONE_DAY_MILLIS = 24 * 60 * 60 * 1000
const ORDER_DEADLINE_MAIL_DELAY_MILLIS = 5 * 60 * 1000

export const pollingTask = onSchedule(
  {
    schedule: '*/1 * * * *',
    region: 'asia-northeast1',
    timeoutSeconds: 540, // 9 minutes
    memory: '1GiB',
    secrets: ['SENDGRID_API_KEY', 'PDF_SERVICES_CLIENT_ID', 'PDF_SERVICES_CLIENT_SECRET', 'STRIPE_API_KEY'],
  },
  async (context) => {
    const now = DateTime.fromISO(context.scheduleTime).toMillis()
    // 秒を無視しないと誤差で実行できないケースがでてきてしまう
    const end = Math.trunc(now / 60 / 1000) * 60 * 1000
    const start = end - 60 * 1000

    const promiseFunctions = [
      sendOrderDeadlineMailToShop(
        start - ORDER_DEADLINE_MAIL_DELAY_MILLIS,
        end - ORDER_DEADLINE_MAIL_DELAY_MILLIS,
        false,
      ),
      sendOrderDeadlineMailToShop(start + ONE_DAY_MILLIS, end + ONE_DAY_MILLIS, true),
      sendOrderDeadlineMailToOrganizers(
        start - ORDER_DEADLINE_MAIL_DELAY_MILLIS,
        end - ORDER_DEADLINE_MAIL_DELAY_MILLIS,
      ),
      sendOrderDeadlineMailToMembers(start - ORDER_DEADLINE_MAIL_DELAY_MILLIS, end - ORDER_DEADLINE_MAIL_DELAY_MILLIS),
      sendOrderDeadlineReminderToCommunityMembers(start + 2 * ONE_DAY_MILLIS, end + 2 * ONE_DAY_MILLIS), // 注文期限2日前
      sendEventConcludedMailToMembers(start, end),
      sendInCartNotificationToMember(start, end),
      sendInCartEventDeadlineNotificationToMember(start, end),
      sendApplyingOrderRemindMailToShop(start - ONE_DAY_MILLIS, end - ONE_DAY_MILLIS), // 1日後通知
      sendApplyingOrderRemindMailToShop(start - 2 * ONE_DAY_MILLIS, end - 2 * ONE_DAY_MILLIS), // 2日後通知
      sendRejectOrderMailToShop(start - 3 * ONE_DAY_MILLIS, end - 3 * ONE_DAY_MILLIS), // 3日後却下通知
      sendLetter(start, end), // レター送信
      sendInvoiceMailToOrganizers(start, end),
    ]

    // 主催者向け注文リマインドメール（締切前 5, 10, 15 日、注文 1 件以上の場合）
    const orderRemindToOrganizerDays = [5, 10, 15]
    orderRemindToOrganizerDays.forEach((day) => {
      promiseFunctions.push(
        sendOrderRemindMailToOrganizer(start + day * ONE_DAY_MILLIS, end + day * ONE_DAY_MILLIS, day),
      )
    })

    // コミュニティ管理者向け・未注文リマインド（accepting_order ログの updated_at 起点、48 時間おき・最大 30 日まで）
    // イベント取得を 1 回にし、ウィンドウ判定は remindUnorderedMail 内でループ
    promiseFunctions.push(sendUnorderedRemindMailToManagers(end, start, end))

    promiseFunctions.push(processMinimumParticipantsChecks(start, end))

    await Promise.all(promiseFunctions)
  },
)
