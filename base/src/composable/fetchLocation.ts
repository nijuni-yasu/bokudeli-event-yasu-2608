import distance from '@turf/distance'
import { point } from '@turf/helpers'

export interface LatLogLocation {
  longitude: number
  latitude: number
  postalcode?: string
  address?: string
}

export const fetchLocationByPostalcode = async (postalCode: string) => {
  const apiKey = import.meta.env.VITE_POSTCODE_API_KEY
  const res = await fetch(`https://apis.postcode-jp.com/api/v6/postcodes/${postalCode}?apikey=${apiKey}`)
  //TODO エラー処理
  const resJson = await res.json()
  const postalData = resJson[0]
  const postalcode = postalData['postalcode']
  const address = postalData['allAddress']
  return { postalcode, address, longitude: postalData['location']['longitude'], latitude: postalData['location']['latitude'] } as LatLogLocation
}

export const calculateDistance = (location1: LatLogLocation, location2: LatLogLocation) => {
  const point1 = point([location1.longitude, location1.latitude])
  const point2 = point([location2.longitude, location2.latitude])
  const result = distance(point1, point2)
  return result
}
