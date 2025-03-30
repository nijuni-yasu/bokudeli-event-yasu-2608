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

// HTMLのタグを削除する関数
export const convertHtmlToPlaneText = (html) => {
  // <a>タグのリンクテキストを抽出し、リンクを削除
  let textOnly = html.replace(/<a [^>]*>(.*?)<\/a>/gi, '$1')

  // 残りのHTMLタグを削除
  textOnly = textOnly.replace(/<[^>]+>/g, '')

  // 不要な空白を削除
  textOnly = textOnly.replace(/\s+/g, ' ')

  // 前後の空白を削除
  return textOnly.trim()
}
