import { fetchLocationByPostalcode } from './fetchLocation.js'

const POSTAL_CODE_7_DIGITS = /^\d{7}$/

/**
 * 郵便番号に対し PostcodeJP API が返す基本住所と、保存している基本住所文字列が一致するか。
 * ドメインに依存しない検証用。空や形式不正・API 失敗時は false。
 */
export async function isAddressBaseValidForPostalcode(postalcode: string, addressBase: string): Promise<boolean> {
  const pc = postalcode.trim()
  const base = addressBase.trim()
  if (pc === '' || base === '') {
    return false
  }
  if (!POSTAL_CODE_7_DIGITS.test(pc)) {
    return false
  }
  try {
    const location = await fetchLocationByPostalcode(pc)
    if (location?.address == null) {
      return false
    }
    return location.address === base
  } catch {
    return false
  }
}
