import { format } from 'date-fns'

export const convertDateToId = (date) => format(date, 'yyyyMMddHHmmss')

export const convertDateToString = (date) => format(date, 'y/M/d')

// TODO toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' }) に変更する
export const convertNumberToYen = (num) => '¥' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')

export const convertDateRangeToString = (startDate, endDate) => {
  const startDateString = format(startDate, 'yyyy/M/d HH:mm')
  const endDateString = format(endDate, 'HH:mm')
  return `${startDateString} 〜 ${endDateString}`
}
