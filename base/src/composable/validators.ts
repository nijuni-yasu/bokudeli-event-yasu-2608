/**
 * 多くは '@core/utils/validators' に実装されているが、日本語に変換するためにここに実装する
 */
import { isEmpty } from '@core/utils/helpers'
import { useI18n } from 'vue-i18n'
import {
  requiredValidator as _requiredValidator,
  urlValidator as _urlValidator,
  betweenValidator as _betweenValidator,
} from '@core/utils/validators'
import { isValidEmail, isValidPhone } from '@shokujii/common/utils/contactFormat.js'
import { extractImageSlidesFromHtml } from '@shokujii/base/utils/extractImagesFromHtml'

export const useValidators = () => {
  const { t: $t } = useI18n()

  const requiredValidator = (value: unknown) =>
    typeof _requiredValidator(value) !== 'string' || $t('validator.required')

  const urlValidator = (value: unknown) => typeof _urlValidator(value) !== 'string' || $t('validator.url')

  const betweenValidator = (value: unknown, min: number, max: number) =>
    typeof _betweenValidator(value, min, max) !== 'string' || $t('validator.between', [min, max])

  const maxLengthValidator = (value: unknown, maxLength: number) => {
    if (isEmpty(value)) {
      return true
    }

    return String(value).length <= maxLength || $t('validator.max_length', [maxLength])
  }

  const postalCodeValidator = (value: unknown) => {
    if (isEmpty(value)) {
      return true
    }
    return (typeof value === 'string' && /^\d{7}$/.test(value)) || $t('validator.postal_code')
  }

  const positiveIntegerValidator = (value: unknown) => {
    if (isEmpty(value)) {
      return true
    }
    const numValue = Number(value)
    return (Number.isInteger(numValue) && numValue >= 1) || $t('validator.positive_integer')
  }

  const phoneValidator = (value: string | null | undefined) => {
    if (isEmpty(value)) {
      return true
    }
    return isValidPhone(value as string) || $t('validator.phone')
  }

  /**
   * メールアドレスのバリデーション
   *
   * @param value
   * @returns boolean | string if it's invalid, return error message
   * @see https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch04s01.html
   */
  const emailValidator = (value: unknown) => {
    if (isEmpty(value)) {
      return true
    }
    return (typeof value === 'string' && isValidEmail(value)) || $t('validator.email')
  }

  /**
   * コミュニティURL入力のバリデーション
   * コミュニティURLの長さは5文字以上15文字以内。コミュニティURLに使えるのは、英小文字・数字・アンダースコア（_）のみです。
   *
   * @param value
   * @returns boolean | string if it's invalid, return error message
   */

  const accountValidator = (value: string | null | undefined) => {
    if (isEmpty(value)) {
      return true
    }
    return /^[a-z0-9_]{3,20}$/.test(value as string) || $t('validator.account')
  }

  const invoiceValidatorJapan = (value: string | null | undefined) => {
    if (isEmpty(value)) {
      return true
    }
    return /^T[0-9]{13}$/.test(value as string) || $t('validator.invoice_japan')
  }

  const noReservedCharsValidator = (value: string | null | undefined) => {
    if (isEmpty(value)) {
      return true
    }
    const reservedChars = /[%{}|^[\]:?#/@`!$'()*+,;=\\]/
    return !reservedChars.test(value as string) || $t('validator.reserved_chars')
  }

  /** TinyMCE 等の HTML 入力で、タグ除去後にテキストが空かつ有効な img も無ければ必須エラー */
  const requiredHtmlValidator = (value: unknown) => {
    const html = typeof value === 'string' ? value : ''
    if (extractImageSlidesFromHtml(html).length > 0) {
      return true
    }
    const text = html
      .replace(/<a [^>]*>(.*?)<\/a>/gi, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (text === '') {
      return $t('validator.required')
    }
    return true
  }

  return {
    requiredValidator,
    urlValidator,
    betweenValidator,
    maxLengthValidator,
    postalCodeValidator,
    positiveIntegerValidator,
    phoneValidator,
    emailValidator,
    accountValidator,
    invoiceValidatorJapan,
    noReservedCharsValidator,
    requiredHtmlValidator,
  }
}
