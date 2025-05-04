import { format } from 'date-fns'

export const convertToOgpString = (inputString) => {
  // 文字列から改行を削除
  const stringWithoutNewLines = inputString.replace(/\n/g, '')
  // 先頭から100文字を抜き出す
  const first100Chars = stringWithoutNewLines.substring(0, 100)
  // HTMLエンコード（一部）を行う
  return first100Chars.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// TODO 共通化
export const convertTruncateText = (text, maxLength) => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...'
  } else {
    return text
  }
}

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
