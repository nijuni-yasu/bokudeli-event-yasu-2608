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
  if (res.status !== 200) {
    console.error('Error fetching postal code data:', res.status, res.statusText)
    throw new Error('Failed to fetch postal code data') // Added error handling
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
  if (!postalData['postcode'] || !postalData['allAddress'] || !postalData['location'] || !postalData['location']['longitude'] || !postalData['location']['latitude']) {
    console.error('Missing required keys in postal data:', postalData)
    throw new Error('Invalid postal data format')
  }
  const postalcode = postalData['postcode']
  const address = postalData['allAddress']
  return { postalcode, address, longitude: postalData['location']['longitude'], latitude: postalData['location']['latitude'] } as LatLogLocation
}

export const calculateDistance = (location1: LatLogLocation, location2: LatLogLocation) => {
  const point1 = point([location1.longitude, location1.latitude])
  const point2 = point([location2.longitude, location2.latitude])
  const result = distance(point1, point2)
  return result
}
