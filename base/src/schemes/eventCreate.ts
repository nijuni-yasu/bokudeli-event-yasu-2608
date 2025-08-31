/**
 * Deprecated
 * Use @shokujii/common/utils/datetime.ts instead
 */

import { format, parse } from 'date-fns'

export const hourList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
export const minutesList = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

export const dateString = (date: Date | number | null) => (date ? format(date, 'yyyy-MM-dd') : '')
export const hourString = (date: Date | number | null) => (date ? format(date, 'HH') : null)
export const minutesString = (date: Date | number | null) => (date ? format(date, 'mm') : null)

export const parseDateTimeStrings = (dateString: string, hourString: string | null, minutesString: string | null) => {
  const retDate = parse(dateString, 'yyyy-MM-dd', new Date())
  if (hourString && minutesString) {
    retDate.setHours(Number(hourString))
    retDate.setMinutes(Number(minutesString))
  }
  return retDate
}
