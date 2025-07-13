import { onSchedule } from 'firebase-functions/v2/scheduler'
import { DateTime } from 'luxon'
import {
  sendOrderDeadlineMailToShop,
  sendOrderDeadlineMailToOrganizers,
  sendOrderDeadlineMailToMembers,
} from './orderDeadlineMail.js'
import { sendEventConcludedMailToMembers, sendInvoiceMailToOrganizers } from './eventConclusionMail.js'

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
      sendInvoiceMailToOrganizers(start, end),
    ]
    await Promise.all(promiseFunctions)
  },
)
