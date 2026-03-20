import distance from '@turf/distance'
import { point } from '@turf/helpers'

/**
 * PostcodeJP API の allAddress に付く、事業所個別郵便番号由来の末尾注記を除く。
 * 基本住所（*_address_base）はユーザーが編集することができないため
 * 「地階・階層不明」「X階」「以下に掲載がない場合」「次のビルを除く」は除く適用をする。
 */

/** 末尾のみ。直前の全角(U+3000)・半角スペースもまとめて除去 */
const STRIP_POSTCODE_JP_SUFFIXES: RegExp[] = [
  /[\u3000\s]*[（(]?地階・階層不明[）)]?$/,
  /[\u3000\s]*[（(]?[０-９\d]{1,3}階[）)]?$/,
  /[\u3000\s]*[（(]?以下に掲載がない場合[）)]?$/,
  /[\u3000\s]*[（(]?次のビルを除く[）)]?$/,
]

/**
 * @param allAddress PostcodeJP の `allAddress` 相当の文字列
 */
const stripPostcodeJpAllAddressSuffixes = (allAddress: string): string => {
  let s = allAddress.trim()
  let prev: string
  do {
    prev = s
    for (const re of STRIP_POSTCODE_JP_SUFFIXES) {
      s = s.replace(re, '')
    }
    s = s.trimEnd()
  } while (s !== prev)
  return s.trim()
}

export interface LatLogLocation {
  longitude: number
  latitude: number
  postalcode?: string
  address?: string
}

export const fetchLocationByPostalcode = async (postalCode: string): Promise<LatLogLocation | null> => {
  // 空文字列やnullの場合は早期リターン
  if (!postalCode || postalCode.trim() === '') {
    return null
  }
  const apiKey = import.meta.env.VITE_POSTCODE_API_KEY
  const res = await fetch(`https://apis.postcode-jp.com/api/v6/postcodes/${postalCode}?apikey=${apiKey}`)
  if (res.status !== 200) {
    console.error('Error fetching postal code data:', res.status, res.statusText)
    throw new Error('Failed to fetch postal code data')
  }

  const resJson = await res.json()
  if (!Array.isArray(resJson)) {
    console.error('Unexpected response format:', resJson)
    throw new Error('Invalid response format')
  }
  if (resJson.length === 0) {
    return null
  }
  const postalData = resJson[0]
  if (
    !postalData['postcode'] ||
    !postalData['allAddress'] ||
    !postalData['location'] ||
    !postalData['location']['longitude'] ||
    !postalData['location']['latitude']
  ) {
    console.error('Missing required keys in postal data:', postalData)
    throw new Error('Invalid postal data format')
  }
  const postalcode = postalData['postcode']
  const address = stripPostcodeJpAllAddressSuffixes(String(postalData['allAddress']))
  return {
    postalcode,
    address,
    longitude: postalData['location']['longitude'],
    latitude: postalData['location']['latitude'],
  } as LatLogLocation
}

export const calculateDistance = (location1: LatLogLocation, location2: LatLogLocation) => {
  const point1 = point([location1.longitude, location1.latitude])
  const point2 = point([location2.longitude, location2.latitude])
  const result = distance(point1, point2)
  return result
}
