import { format } from 'date-fns'

export const convertDateToId = (date) => format(date, 'yyyyMMddHHmmss')

export const convertDateToString = (date) => format(date, 'y/M/d')

// TODO toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' }) に変更する
export const convertNumberToYen = (num) => '¥' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
