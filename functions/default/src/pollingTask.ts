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
import { sendRejectOrderMailToShop } from './rejectOrderMail.js'
import { sendLetter } from './letter.js'

const ONE_DAY_MILLIS = 24 * 60 * 60 * 1000

export const pollingTask = onSchedule(
  {
    schedule: '*/1 * * * *',
    region: 'asia-northeast1',
    timeoutSeconds: 540, // 9 minutes
    secrets: ['SENDGRID_API_KEY'],
  },
  async (context) => {
    const now = DateTime.fromISO(context.scheduleTime).toMillis()
    // 秒を無視しないと誤差で実行できないケースがでてきてしまう
    const end = Math.trunc(now / 60 / 1000) * 60 * 1000
    const start = end - 60 * 1000

    const promiseFunctions = [
      sendOrderDeadlineMailToShop(start, end, false),
      sendOrderDeadlineMailToShop(start + ONE_DAY_MILLIS, end + ONE_DAY_MILLIS, true),
      sendOrderDeadlineMailToOrganizers(start, end),
      sendOrderDeadlineMailToMembers(start, end),
      sendOrderDeadlineReminderToCommunityMembers(start + 2 * ONE_DAY_MILLIS, end + 2 * ONE_DAY_MILLIS), // 注文期限2日前
      sendEventConcludedMailToMembers(start, end),
      sendInCartNotificationToMember(start, end),
      sendInCartEventDeadlineNotificationToMember(start, end),
      sendApplyingOrderRemindMailToShop(start - ONE_DAY_MILLIS, end - ONE_DAY_MILLIS), // 1日後通知
      sendApplyingOrderRemindMailToShop(start - 2 * ONE_DAY_MILLIS, end - 2 * ONE_DAY_MILLIS), // 2日後通知
      sendRejectOrderMailToShop(start - 3 * ONE_DAY_MILLIS, end - 3 * ONE_DAY_MILLIS), // 3日後却下通知
      sendLetter(start, end), // レター送信
    ]

    // 主催者向け注文リマインドメール（5,10,20,30,40,50,60日後）
    const orderRemindToOrganizerDays = [5, 10, 20, 30, 40, 50, 60]
    orderRemindToOrganizerDays.forEach((day) => {
      promiseFunctions.push(
        sendOrderRemindMailToOrganizer(start + day * ONE_DAY_MILLIS, end + day * ONE_DAY_MILLIS, day),
      )
    })
    await Promise.all(promiseFunctions)
  },
)
