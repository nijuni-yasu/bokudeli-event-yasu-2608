import { format, parse } from 'date-fns'
import { EventPaymentType } from './bokudeliEvent'

export interface BasicInfo {
  title: string
  postcode: string
  address: string
  placeName: string
  placeUrl: string
  startDateTime: Date | null
  endDateTime: Date | null
}

export interface EventDetailData {
  eventCoverUrl: string
  eventDesc: string
  eventDeadlineDateTime: Date | null
  eventMaxPeople: number
  isPublic: boolean
  eventPayment: EventPaymentType
}

export interface ShopNotice {
  organizerFullName: string
  organizerCompany: string
  organizerPhonePersonal: string
  organizerPhoneCompany: string
  organizerEmail: string
  organizerMemo: string
}

export const hourList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
export const minutesList = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

export const dateString = (date: Date | null) => (date ? format(date, 'yyyy-MM-dd') : '')
export const hourString = (date: Date | null) => (date ? format(date, 'HH') : null)
export const minutesString = (date: Date | null) => (date ? format(date, 'mm') : null)

export const parseDateTimeStrings = (dateString: string, hourString: string | null, minutesString: string | null) => {
  const retDate = parse(dateString, 'yyyy-MM-dd', new Date())
  if (hourString && minutesString) {
    retDate.setHours(Number(hourString))
    retDate.setMinutes(Number(minutesString))
  }
  return retDate
}
