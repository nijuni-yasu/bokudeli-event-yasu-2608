import { createEvent } from 'ics'
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

export const makeIcs = async (event) => {
  if (!event) {
    return null
  }

  const eventUrl = `https://${process.env.EVENT_HOST}/c/${event.community_account}/e/${event.event_id}`

  const textList = [
    `${event.event_name}`,
    `📅${dateWithDayOfWeekString(event.event_start_datetime)}~${dateOnlyTimeString(event.event_end_datetime)}`,
    `⏳${dateWithDayOfWeekString(event.event_deadline_datetime)}に注文締切`,
    `📍${event.event_address}`,
    `👥${event.community_name}`,
    `🍱${event.shop_name}`,
    '',
    `最新情報はこちら：`,
    `${eventUrl}`,
    '',
    `${event.event_desc}`,
  ]

  const icsEvent = {
    start: event.event_start_datetime.toMillis(),
    end: event.event_end_datetime.toMillis(),
    title: event.event_name,
    description: textList.join('\n'),
    location: event.event_address,
    url: eventUrl,
    status: 'CONFIRMED',
    uid: `${event.event_id}@shokujii.jp`,
    method: 'REQUEST',
    sequence: 0,
    organizer: { name: 'shokujiiサポート', email: 'support@nijuni.jp' },
    attendees: [
      { name: event.organizer_fullname, email: event.organizer_email, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' },
    ],
  }

  return await new Promise((resolve, reject) => {
    createEvent(icsEvent, (error, value) => {
      if (error) {
        reject(error)
      }
      resolve(value)
    })
  })
}
