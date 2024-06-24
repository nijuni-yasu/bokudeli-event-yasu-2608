/**
 * 多くは '@/@core/utils/validators' に実装されているが、日本語に変換するためにここに実装する
 * TODO 本来は i18n で対応したほうが良い
 */
import { requiredValidator as _requiredValidator, urlValidator as _urlValidator } from '@core/utils/validators'

export const requiredValidator = (value: unknown) => {
  return typeof _requiredValidator(value) !== 'string' || '必須項目です'
}

export const urlValidator = (value: unknown) => {
  return typeof _urlValidator(value) !== 'string' || 'URLの形式が正しくありません'
}

export const postalCodeValidator = (value: string | null | undefined) => {
  if (isEmpty(value)) {
    return true
  }
  return /^\d{7}$/.test(value as string) || '郵便番号は7桁の数字で入力してください'
}

export const positiveIntegerValidator = (value: string | null | undefined) => {
  if (isEmpty(value)) {
    return true
  }
  return /^\d+$/.test(value as string) || '正の整数を入力してください'
}

/**
 * 電話番号のバリデーション
 *
 * @param value
 * @returns boolean | string if it's invalid, return error message
 * @see https://akinov.hatenablog.com/entry/2017/05/31/194421
 */
export const phoneValidator = (value: string | null | undefined) => {
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
    '有効な電話番号を入力してください'
  )
}

/**
 * メールアドレスのバリデーション
 *
 * @param value
 * @returns boolean | string if it's invalid, return error message
 */
export const emailValidator = (value: string | null | undefined) => {
  if (isEmpty(value)) {
    return true
  }
  return /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(value as string) || '有効なメールアドレスを入力してください'
}

/**
 * アカウント入力のバリデーション
 * アカウントの長さは5文字以上15文字以内。アカウントに使えるのは、英小文字・数字・アンダースコア（_）のみです。
 *
 * @param value
 * @returns boolean | string if it's invalid, return error message
 */
export const accountValidator = (value: string | null | undefined) => {
  if (isEmpty(value)) {
    return true
  }
  return (
    /^[a-z0-9_]{5,15}$/.test(value as string) ||
    'アカウントは5文字以上15文字以内にしてください。アカウントに使えるのは「英小文字・数字・アンダースコア」のみです。'
  )
}
