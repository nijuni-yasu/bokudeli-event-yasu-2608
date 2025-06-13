import BokudeliEvent from '@/schemes/bokudeliEvent'
import { google, ics } from 'calendar-link'
import { dateWithDayOfWeekString, dateOnlyTimeString } from '@/schemes/converter'

type CalendarType = 'google' | 'ics'

const buildCalendarLink = (event: BokudeliEvent | null, type: CalendarType) => {
  if (!event) return undefined

  const textList = [
    `${event.event_name}`,
    '',
    `📅日時：${dateWithDayOfWeekString(event.event_start_datetime)}~${dateOnlyTimeString(event.event_end_datetime)}`,
    `📍場所：${event.event_address} ${event.event_place}`,
    `⏳締切：${dateWithDayOfWeekString(event.event_deadline_datetime)} に注文締切`,
    `👥主催：${event.community_name}`,
    `👩‍🍳食事：${event.shop_name}`,
    `👉イベント詳細：${event.url}`,
    '',
    '--------------------------------',
    '',
    `${event.event_desc?.slice(0, 1900)}`,
    '',
  ]

  const calendarEvent = {
    title: event.event_name ?? '',
    start: event.event_start_datetime?.toDate(),
    end: event.event_end_datetime?.toDate() ?? undefined,
    location: event.event_address ?? undefined,
    description: textList.join('\n'),
    url: event.url,
  }

  switch (type) {
    case 'google':
      return google(calendarEvent)
    case 'ics':
      return ics(calendarEvent)
  }
}

export default buildCalendarLink
