export const fetchLocationByPostalcode = async (postalCode) => {
  const res = await fetch(`https://geoapi.heartrails.com/api/json?method=searchByPostal&postal=${postalCode}`)
  // TODO エラー処理
  const resJson = await res.json()
  const location = resJson.response.location[0]
  const postalcode = location['postal']
  const address = location['prefecture'] + location['city'] + location['town']
  return { postalcode, address, longitude: location.x, latitude: location.y }
}