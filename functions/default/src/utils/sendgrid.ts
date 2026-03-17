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
import { createModuleLogger } from './logger.js'

const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY')

const logger = createModuleLogger('sendgrid')

const isValidMailData = (data: MailDataRequired): boolean => {
  if (!data.to || data.to === '') {
    logger.error('Invalid mail data: "to" is missing or empty', { to: data.to })
    return false
  }

  if (!data.from || data.from === '') {
    logger.error('Invalid mail data: "from" is missing or empty', { from: data.from })
    return false
  }

  // 文字列の場合、trim して空白のみでないかチェック
  if (typeof data.to === 'string' && data.to.trim() === '') {
    logger.error('Invalid mail data: "to" is whitespace only', { to: data.to })
    return false
  }

  if (typeof data.from === 'string' && data.from.trim() === '') {
    logger.error('Invalid mail data: "from" is whitespace only', { from: data.from })
    return false
  }

  // replyTo もチェック（オプショナルだが、指定されている場合は検証）
  if (data.replyTo && typeof data.replyTo === 'string' && data.replyTo.trim() === '') {
    logger.error('Invalid mail data: "replyTo" is whitespace only', { replyTo: data.replyTo })
    return false
  }

  return true
}

export const send = async (data: MailDataRequired | MailDataRequired[]): Promise<[ClientResponse, object]> => {
  try {
    if (data instanceof Array) {
      // 配列の場合、無効なデータをフィルタリング
      const validData = data.filter((d) => isValidMailData(d))

      if (validData.length === 0) {
        logger.error('All mail data in array is invalid', {
          totalCount: data.length,
          invalidCount: data.length,
        })
        throw new Error('All mail data in array is invalid.')
      }

      if (validData.length < data.length) {
        logger.warn('Some mail data in array is invalid and filtered out', {
          totalCount: data.length,
          validCount: validData.length,
          invalidCount: data.length - validData.length,
        })
      }

      data = validData
    } else {
      // 単一データの場合
      if (!isValidMailData(data)) {
        logger.error('Invalid mail data', {
          to: data.to,
          from: data.from,
          replyTo: data.replyTo,
          subject: data.subject,
        })
        throw new Error('The argument "data" is invalid.')
      }
    }

    sgMail.setApiKey(SENDGRID_API_KEY.value())

    const response = await sgMail.send(data)

    logger.info('Email sent successfully via SendGrid', {
      statusCode: response[0].statusCode,
      targetCount: data instanceof Array ? data.length : 1,
    })

    return response
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const errorWithResponse = error as {
        response?: {
          statusCode?: number
          body?: unknown
          headers?: Record<string, string>
        }
      }
      logger.error('SendGrid API error', {
        statusCode: errorWithResponse.response?.statusCode,
        body: errorWithResponse.response?.body,
        headers: errorWithResponse.response?.headers,
        requestData: {
          to: data instanceof Array ? data.map((d) => d.to) : data.to,
          from: data instanceof Array ? data.map((d) => d.from) : data.from,
          subject: data instanceof Array ? data.map((d) => d.subject) : data.subject,
        },
      })
    } else {
      logger.error('SendGrid send error (no response)', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        requestData: {
          to: data instanceof Array ? data.map((d) => d.to) : data.to,
          from: data instanceof Array ? data.map((d) => d.from) : data.from,
        },
      })
    }

    throw error
  }
}
