import { ics } from 'calendar-link'
import { Timestamp } from 'firebase-admin/firestore'

const dateWithDayOfWeekString = (date) => {
  if (!date) return ''

  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short', // 曜日を短縮形で表示 (例: 金)
  }

  const targetDate = date instanceof Timestamp ? date.toDate() : date
  const formattedDate = targetDate.toLocaleDateString('ja-JP', options)
  return formattedDate
}

const dateOnlyTimeString = (date) => {
  if (!date) return ''

  const options = {
    hour: '2-digit',
    minute: '2-digit',
  }

  const targetDate = date instanceof Timestamp ? date.toDate() : date
  const formattedDate = targetDate.toLocaleTimeString('ja-JP', options)
  return formattedDate
}

export const makeIcsUrl = (event) => {
  if (!event) return null

  const textList = [
    `${event.event_name}`,
    `📅${dateWithDayOfWeekString(event.event_start_datetime)}~${dateOnlyTimeString(event.event_end_datetime)}`,
    `⏳${dateWithDayOfWeekString(event.event_deadline_datetime)}に注文締切`,
    `📍${event.event_address}`,
    `👥${event.community_name}`,
    `🍱${event.shop_name}`,
    '',
    `最新情報はこちら：`,
    `${event.url}`,
    '',
    `${event.event_desc}`,
  ]

  return ics({
    title: event.event_name ?? '',
    start: event.event_start_datetime?.toDate(),
    end: event.event_end_datetime?.toDate() ?? undefined,
    location: event.event_address ?? undefined,
    description: textList.join('\n'),
    url: event.url,
  })
}
