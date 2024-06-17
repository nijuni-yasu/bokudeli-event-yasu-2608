import distance from '@turf/distance'
import { point } from '@turf/helpers'

export interface LatLogLocation {
  longitude: number
  latitude: number
  postalcode?: string
  address?: string
}

export const fetchLocationByPostalcode = async (postalCode: string) => {
  const res = await fetch(`https://geoapi.heartrails.com/api/json?method=searchByPostal&postal=${postalCode}`)
  //TODO エラー処理
  const resJson = await res.json()
  const location = resJson.response.location[0]
  const postalcode = location['postal']
  const address = location['prefecture'] + location['city'] + location['town']
  return { postalcode, address, longitude: location.x, latitude: location.y } as LatLogLocation
}

export const calculateDistance = (location1: LatLogLocation, location2: LatLogLocation) => {
  const point1 = point([location1.longitude, location1.latitude])
  const point2 = point([location2.longitude, location2.latitude])
  const result = distance(point1, point2)
  return result
}
