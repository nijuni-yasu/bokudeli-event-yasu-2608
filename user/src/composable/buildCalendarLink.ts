import BokudeliEvent from '@/schemes/bokudeliEvent'
import { google, ics } from 'calendar-link'

type CalendarType = 'google' | 'ics'

const buildCalendarLink = (event: BokudeliEvent | null, type: CalendarType) => {
  if (!event) return undefined

  const calendarEvent = {
    title: event.event_name ?? '',
    start: event.event_start_datetime?.toDate(),
    end: event.event_end_datetime?.toDate() ?? undefined,
    location: event.event_address ?? undefined,
    description: event.event_desc ?? undefined,
    url: window.location.href,
  }

  switch (type) {
    case 'google':
      return google(calendarEvent)
    case 'ics':
      return ics(calendarEvent)
  }
}

export default buildCalendarLink
