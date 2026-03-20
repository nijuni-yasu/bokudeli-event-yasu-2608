import { createEvent, EventStatus, ParticipationStatus, ParticipationRole } from 'ics'
import { getEventUrl } from './utils/urls.js'
import { ShokujiiEvent } from './stores/event.js'
import { SUPPORT_MAIL_ADDRESS } from './utils/mail.js'

const dateWithDayOfWeekString = (mills: number, locale: string) => {
  if (!mills) return ''

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  }

  const targetDate = new Date(mills)
  const formattedDate = targetDate.toLocaleDateString(locale, options)
  return formattedDate
}

const dateOnlyTimeString = (mills: number, locale: string) => {
  if (!mills) return ''

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  }

  const targetDate = new Date(mills)
  const formattedDate = targetDate.toLocaleTimeString(locale, options)
  return formattedDate
}

export const makeIcs = async (event: ShokujiiEvent, locale: string): Promise<string | null> => {
  if (!event || !event.event_start_datetime || !event.event_end_datetime) {
    return null
  }

  const eventUrl = getEventUrl(event.community_account, event.id)

  const textList = [
    `${event.event_name}`,
    `📅${dateWithDayOfWeekString(event.event_start_datetime, locale)}~${dateOnlyTimeString(event.event_end_datetime, locale)}`,
    `⏳${dateWithDayOfWeekString(event.event_deadline_datetime, locale)}に注文締切`,
    `📍${event.fullAddress}`,
    `👥${event.community_name}`,
    `🍱${event.shop_name}`,
    '',
    '最新情報はこちら：',
    `${eventUrl}`,
    '',
    `${event.event_desc}`,
  ]

  const icsEvent = {
    start: event.event_start_datetime,
    end: event.event_end_datetime,
    title: event.event_name,
    description: textList.join('\n'),
    location: event.fullAddress,
    url: eventUrl,
    status: 'CONFIRMED' as EventStatus,
    uid: `${event.id}@shokujii.jp`,
    method: 'REQUEST',
    sequence: 0,
    organizer: { name: 'shokujiiサポート', email: SUPPORT_MAIL_ADDRESS },
    attendees: [
      {
        name: event.organizer_fullname,
        email: event.organizer_email,
        partstat: 'ACCEPTED' as ParticipationStatus,
        role: 'REQ-PARTICIPANT' as ParticipationRole,
      },
    ],
  }

  return new Promise<string>((resolve, reject) => {
    createEvent(icsEvent, (error: Error | undefined, value: string) => {
      if (error) {
        reject(error)
      }
      resolve(value)
    })
  })
}
