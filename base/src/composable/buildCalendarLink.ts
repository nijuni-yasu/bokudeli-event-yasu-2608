import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { google, ics } from 'calendar-link'
import { dateWithDayOfWeekString, dateOnlyTimeString } from '@shokujii/base/schemes/converter'
import { getEventUrl } from '@shokujii/common/utils/urls.js'

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
    // TODO 環境変数を component 内で直接みるのはいまいちな実装なので直す
    `👉イベント詳細：${getEventUrl(import.meta.env.VITE_AUTH_DOMAIN, event.community_account, event.event_id)}`,
    '',
    '--------------------------------',
    '',
    `${event.event_desc?.slice(0, 1900)}`,
    '',
  ]

  const calendarEvent = {
    title: event.event_name ?? '',
    start: event.event_start_datetime,
    end: event.event_end_datetime ?? undefined,
    location: event.event_address ?? undefined,
    description: textList.join('\n'),
    // TODO 環境変数を component 内で直接みるのはいまいちな実装なので直す
    url: getEventUrl(import.meta.env.VITE_AUTH_DOMAIN, event.community_account, event.event_id),
  }

  switch (type) {
    case 'google':
      return google(calendarEvent)
    case 'ics':
      return ics(calendarEvent)
  }
}

export default buildCalendarLink
