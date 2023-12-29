/**
 * 多くは '@/@core/utils/validators' に実装されているが、日本語に変換するためにここに実装する
 * TODO 本来は i18n で対応したほうが良い
 */
import { isEmpty } from '@/@core/utils'
import { requiredValidator as _requiredValidator, urlValidator as _urlValidator } from '@/@core/utils/validators'

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
