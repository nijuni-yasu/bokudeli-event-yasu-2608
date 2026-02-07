import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger } from 'firebase-functions'
import { DEFAULT_FROM, DEFAULT_TO } from './utils/mail.js'
import * as sgMail from './utils/sendgrid.js'
import { getEventUrl } from './utils/urls.js'
import { getAllUsers } from './stores/user.js'
import { getAllAcceptingOrderEvents } from './stores/event.js'
import { convertTruncateText } from '@shokujii/common/utils/converter.js'
import { convertToJustDate, convertToDuration, convertToDatetimeWeekdayShort } from '@shokujii/common/utils/datetime.js'

// 定数
const EVENT_INFORMATION_TEMPLATE_ID = 'd-797deb1c54984007baadd1926ee974a2'
const EVENT_INFORMATION_UNSUBSCRIBE_GROUP = 25345

// 型定義
interface EventData {
  event_name: string
  event_address: string
  event_place: string
  event_datetime: string
  event_deadline_datetime: string
  event_desc: string
  event_url: string
  event_cover_url: string
  shop_name: string
  community_name: string
}

interface TemplateData {
  date?: string
  events: EventData[]
  user_name?: string
}

/**
 * イベント情報メール送信（火曜日の10時15分）
 */
export const eventInformation = onSchedule(
  {
    schedule: '15 10 * * 2', // 火曜日の10時15分
    timeZone: 'Asia/Tokyo',
    region: 'asia-northeast1',
    secrets: ['SENDGRID_API_KEY'],
    memory: '1GiB',
    timeoutSeconds: 540,
  },
  async () => {
    return sendEventInformationMail()
  },
)

/**
 * イベント情報メールプレビュー送信（月曜日の10時15分）
 */
export const eventInformationPreview = onSchedule(
  {
    schedule: '15 10 * * 1', // 月曜日の10時15分
    timeZone: 'Asia/Tokyo',
    region: 'asia-northeast1',
    secrets: ['SENDGRID_API_KEY'],
    memory: '1GiB',
    timeoutSeconds: 540,
  },
  async () => {
    return sendEventInformationMailPreview()
  },
)

/**
 * イベント情報メール用のテンプレートデータを作成
 */
async function createTemplateDataForEventInformation(targetDateTimeMillis: number): Promise<TemplateData> {
  const date = convertToJustDate(targetDateTimeMillis)
  const templateData: TemplateData = {
    date,
    events: [],
  }

  // 公開イベントで注文受付中のイベントを取得
  const events = await getAllAcceptingOrderEvents(targetDateTimeMillis)

  // 開始日時でソート
  const sortedEvents = events.sort((a, b) => {
    const aTime = a.event_start_datetime
    const bTime = b.event_start_datetime
    return aTime - bTime
  })

  for (const event of sortedEvents) {
    const userIds = (await event.getOrders()).map((order) => order.user_id)

    // 最大参加者数に達していないイベントのみ追加
    if (userIds.length < event.event_max_people) {
      const eventStartTime = event.event_start_datetime
      const eventEndTime = event.event_end_datetime
      const eventDeadlineTime = event.event_deadline_datetime

      const event_datetime = convertToDuration(eventStartTime, eventEndTime)
      const event_deadline_datetime = convertToDatetimeWeekdayShort(eventDeadlineTime)

      templateData.events.push({
        event_name: event.event_name,
        event_address: event.event_address,
        event_place: event.event_place,
        event_datetime,
        event_deadline_datetime,
        event_desc: convertTruncateText(event.event_desc, 250),
        event_url: getEventUrl(event.community_account, event.id),
        event_cover_url: event.event_cover_url,
        shop_name: event.shop_name,
        community_name: event.community_name,
      })

      // 最大12件まで
      if (templateData.events.length === 12) {
        break
      }
    }
  }

  return templateData
}

/**
 * イベント情報メールを送信
 * 処理フロー：
 * 1. getAllUsers ジェネレーターでユーザーを順次取得し、メール送信を即座に開始
 *    - Result型により個別のユーザー取得エラーを明示的にハンドリング
 * 2. 全送信の完了を Promise.allSettled で待機
 * 3. 処理結果（fetch/send エラー数）をログに出力
 */
async function sendEventInformationMail(): Promise<void> {
  const nowDateTimeMillis = Date.now()
  const templateData = await createTemplateDataForEventInformation(nowDateTimeMillis)

  if (templateData.events.length === 0) {
    return
  }

  let fetchErrorCount = 0
  const promises: Promise<[unknown, object]>[] = []

  for await (const r of getAllUsers(true)) {
    if (!r.ok) {
      logger.error('eventInformationMail|Failed to get user', { error: r.error })
      fetchErrorCount++
      continue
    }

    const user = r.value

    if (!user?.user_email) {
      continue
    }

    promises.push(
      sgMail.send({
        to: user.user_email,
        from: DEFAULT_FROM,
        templateId: EVENT_INFORMATION_TEMPLATE_ID,
        dynamicTemplateData: {
          ...templateData,
          user_name: user.user_name,
        },
        asm: {
          groupId: EVENT_INFORMATION_UNSUBSCRIBE_GROUP,
        },
      }),
    )
  }

  const settled = await Promise.allSettled(promises)

  const processedCount = settled.filter((r) => r.status === 'fulfilled').length
  const sendErrorCount = settled.filter((r) => r.status === 'rejected').length

  for (const r of settled) {
    if (r.status === 'rejected') {
      logger.warn('eventInformationMail|Failed to send email', { error: r.reason })
    }
  }

  logger.info('eventInformationMail|Completed', { processedCount, sendErrorCount, fetchErrorCount })
}

/**
 * イベント情報メールプレビューを送信
 */
async function sendEventInformationMailPreview(): Promise<void> {
  const tomorrowDateTimeMillis = Date.now() + 24 * 60 * 60 * 1000
  const templateData = await createTemplateDataForEventInformation(tomorrowDateTimeMillis)

  if (templateData.events.length === 0) {
    await sgMail.send({
      to: DEFAULT_TO,
      from: DEFAULT_FROM,
      subject: '【プレビュー】明日のイベント情報について',
      text: '明日送信予定のイベント予定はありません',
    })
    return
  }

  const dynamicTemplateData = {
    ...templateData,
    user_name: 'テストユーザー',
  }

  await sgMail.send({
    to: DEFAULT_TO,
    from: DEFAULT_FROM,
    templateId: EVENT_INFORMATION_TEMPLATE_ID,
    dynamicTemplateData,
    asm: {
      groupId: EVENT_INFORMATION_UNSUBSCRIBE_GROUP,
    },
  })
}
