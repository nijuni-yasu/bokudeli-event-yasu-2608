import { format } from 'date-fns'

export const convertDateToId = (date) => format(date, 'yyyyMMddHHmmss')

export const convertDateToString = (date) => format(date, 'y/M/d')

export const convertNumberToCurrency = (num) => '¥' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
