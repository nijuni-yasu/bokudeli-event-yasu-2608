import { isToday } from './helpers'

export const avatarText = (value: string) => {
  if (!value) return ''
  const nameArray = value.split(' ')

  return nameArray.map((word) => word.charAt(0).toUpperCase()).join('')
}

export const formatDateToMonthShort = (millis: number, toTimeForCurrentDay = true) => {
  const date = new Date(millis)
  let formatting: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }

  if (toTimeForCurrentDay && isToday(date)) {
    formatting = { hour: 'numeric', minute: 'numeric' }
  }

  return new Intl.DateTimeFormat('ja-JP', formatting).format(date)
}
