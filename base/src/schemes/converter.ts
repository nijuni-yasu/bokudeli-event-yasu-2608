import { Timestamp } from 'firebase/firestore'

export const dateWithDayOfWeekString = (date: Timestamp | Date | number | null): string => {
  if (!date) return ''

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short', // 曜日を短縮形で表示 (例: 金)
  }

  const targetDate = date instanceof Timestamp ? date.toDate() : typeof date === 'number' ? new Date(date) : date
  const formattedDate = targetDate.toLocaleDateString('ja-JP', options)
  return formattedDate
}

export const dateOnlyTimeString = (date: Timestamp | Date | number | null): string => {
  if (!date) return ''

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  }

  const targetDate = date instanceof Timestamp ? date.toDate() : typeof date === 'number' ? new Date(date) : date
  const formattedDate = targetDate.toLocaleTimeString('ja-JP', options)
  return formattedDate
}

export const priceString = (price: number | null | undefined): string => {
  return `${(price ?? 0).toLocaleString()}`
}

export const postalcodeString = (postalCode: string): string => {
  // 郵便番号を「〒XXX-XXXX」の形式に変換
  return `〒${postalCode.slice(0, 3)}-${postalCode.slice(3)}`
}

export const convertTruncateText = (text: string, maxLength: number): string => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength - 3) + '...'
  } else {
    return text
  }
}
