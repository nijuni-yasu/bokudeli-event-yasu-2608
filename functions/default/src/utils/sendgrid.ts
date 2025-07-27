/*
 * かつては sendgrid に関わるコードは sendgrid-mail.js にまとめて書かれていたが、
 * メールに関わる機能が増えてきたため、メールとは切り離し、機能毎にファイルを作成し、
 * 共通部分をこのファイルに切り出すことにする。
 *
 * このファイルを使用するには、secrets に SENDGRID_API_KEY を指定する必要があります。
 * ```
 * secrets: ['SENDGRID_API_KEY'],
 * ```
 */
import sgMail from '@sendgrid/mail'
import type { ClientResponse, MailDataRequired } from '@sendgrid/mail'
import { defineSecret } from 'firebase-functions/params'

const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY')

const isValidMailData = (data: MailDataRequired): boolean => {
  return data.to != null && data.to !== '' && data.from != null && data.from !== ''
}

export const send = async (data: MailDataRequired | MailDataRequired[]): Promise<[ClientResponse, object]> => {
  if (data instanceof Array) {
    data = data.flatMap((d) => (isValidMailData(d) ? [] : d))
  } else {
    if (!isValidMailData(data)) {
      throw new Error('The argument "data" is invalid.')
    }
  }
  sgMail.setApiKey(SENDGRID_API_KEY.value())
  return sgMail.send(data)
}
