/**
 * 多くは '@/@core/utils/validators' に実装されているが、日本語に変換するためにここに実装する
 */
import { useI18n } from 'vue-i18n'
import {
  requiredValidator as _requiredValidator,
  urlValidator as _urlValidator,
  betweenValidator as _betweenValidator,
} from '@core/utils/validators'

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

  const postalCodeValidator = (value: string | null | undefined) => {
    if (isEmpty(value)) {
      return true
    }
    return /^\d{7}$/.test(value as string) || $t('validator.postal_code')
  }

  const positiveIntegerValidator = (value: string | null | undefined) => {
    if (isEmpty(value)) {
      return true
    }
    return /^\d+$/.test(value as string) || $t('validator.positive_integer')
  }

  /**
   * 電話番号のバリデーション
   *
   * @param value
   * @returns boolean | string if it's invalid, return error message
   * @see https://akinov.hatenablog.com/entry/2017/05/31/194421
   */
  const phoneValidator = (value: string | null | undefined) => {
    if (isEmpty(value)) {
      return true
    }
    return (
      // 市外局番ありパターン
      /^0(\d{1}[-(]?\d{4}|\d{2}[-(]?\d{3}|\d{3}[-(]?\d{2}|\d{4}[-(]?\d{1})[-)]?\d{4}$/.test(value as string) ||
      // // 市外局番なしパターン
      // /^\d{1,4}\-?\d{4}$/.test(value) ||
      // 携帯電話パターン
      /^0[5789]0[-(]?\d{4}[-)]?\d{4}$/.test(value as string) ||
      // フリーダイヤルパターン
      /^0120[-(]?\d{3}[-)]?\d{3}$/.test(value as string) ||
      // 国際電話パターン
      // /^\+[1-9][\d-]+$/.test(value as string) ||
      $t('validator.phone')
    )
  }

  /**
   * メールアドレスのバリデーション
   *
   * @param value
   * @returns boolean | string if it's invalid, return error message
   * @see https://stackoverflow.com/a/5503271
   */
  const emailValidator = (value: string | null | undefined) => {
    if (isEmpty(value)) {
      return true
    }
    return /^[\w-]+(\.[\w-]+)*(\+[\w-]+)?@[\w-]+\.[\w-]{2,4}$/.test(value as string) || $t('validator.email')
  }

  /**
   * アカウント入力のバリデーション
   * アカウントの長さは5文字以上15文字以内。アカウントに使えるのは、英小文字・数字・アンダースコア（_）のみです。
   *
   * @param value
   * @returns boolean | string if it's invalid, return error message
   */

  const accountValidator = (value: string | null | undefined) => {
    if (isEmpty(value)) {
      return true
    }
    return /^[a-z0-9_]{5,15}$/.test(value as string) || $t('validator.account')
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
  }
}
