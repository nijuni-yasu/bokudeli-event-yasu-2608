import { onSchedule } from 'firebase-functions/v2/scheduler'
import { DateTime } from 'luxon'
import {
  sendOrderDeadlineMailToShop,
  sendOrderDeadlineMailToOrganizers,
  sendOrderDeadlineMailToMembers,
} from './orderDeadlineMail.js'
import { sendEventConcludedMailToMembers } from './eventConclusionMail.js'
import { sendInCartNotificationToMember, sendInCartEventDeadlineNotificationToMember } from './inCartNotification.js'
import { sendApplyingOrderRemindMailToShop } from './orderRemindMail.js'
import { sendRejectOrderMailToShop } from './rejectOrderMail.js'

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
      sendEventConcludedMailToMembers(start, end),
      sendInCartNotificationToMember(start, end),
      sendInCartEventDeadlineNotificationToMember(start, end),
      sendApplyingOrderRemindMailToShop(start - ONE_DAY_MILLIS, end - ONE_DAY_MILLIS), // 1日後通知
      sendApplyingOrderRemindMailToShop(start - 2 * ONE_DAY_MILLIS, end - 2 * ONE_DAY_MILLIS), // 2日後通知
      sendRejectOrderMailToShop(start - 3 * ONE_DAY_MILLIS, end - 3 * ONE_DAY_MILLIS), // 3日後却下通知
    ]
    await Promise.all(promiseFunctions)
  },
)
