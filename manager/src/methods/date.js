/**
 * Vue2 では template 内で optional chaining が使えないので、helper 関数を作成
 * @param {*} timestamp
 * @param {number} offset
 * @returns number | null
 */
export function timestampToMillis (timestamp, offset = 0) {
  if (timestamp == null) {
    return null
  }
  return timestamp.toMillis() + offset
}

export function millisToDateTimeString (millis) {
  if (millis == null) {
    return ''
  }
  // This dateTime will be converted to the time zone of the browser
  const dateTime = new Date(millis)
  const month = (dateTime.getMonth() + 1).toString().padStart(2, '0')
  const date = dateTime.getDate().toString().padStart(2, '0')
  return `${dateTime.getFullYear()}/${month}/${date} ${millisToTimeString(millis)}`
}

export function millisToTimeString (millis) {
  if (millis == null) {
    return ''
  }
  // This dateTime will be converted to the time zone of the browser
  const dateTime = new Date(millis)
  const hour = dateTime.getHours().toString().padStart(2, '0')
  const minute = dateTime.getMinutes().toString().padStart(2, '0')
  return `${hour}:${minute}`
}
