import type { PartnerShop } from '../schemas/PartnerShop.js'
import { isInShopTime } from './datetime.js'

/** 開催地の緯度経度（km 距離計算用） */
export type EventLocationLatLng = {
  longitude: number
  latitude: number
}

export type DeliverablePartnerShop = PartnerShop & {
  distance: number
  min_orders_on_spot: number
}

/**
 * 2 点間の球面距離を km で返す（イベント編集ウィザード従来の Turf 近似に相当）。
 */
export function distanceKmBetween(a: EventLocationLatLng, b: EventLocationLatLng): number {
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return R * c
}

/** 店舗の `shop_range_min_orders` の最大 range を距離上限とする配達圏内判定。営業時間や承認状態は見ない */
function isWithinShopDeliveryRange(shop: PartnerShop, eventLocation: EventLocationLatLng): boolean {
  if (shop.shop_address_longitude == null || shop.shop_address_latitude == null) {
    return false
  }
  const dist = distanceKmBetween(eventLocation, {
    longitude: shop.shop_address_longitude,
    latitude: shop.shop_address_latitude,
  })
  let maxRange: number | undefined
  for (const o of shop.shop_range_min_orders) {
    if (o.range != null && (maxRange == null || o.range > maxRange)) {
      maxRange = o.range
    }
  }
  return maxRange != null && dist <= maxRange
}

/**
 * 郵便番号から解決した位置と開催開始日時に対し、配達・営業条件を満たす店のみを返す。
 * 並びは距離レンジに応じた min_orders_on_spot の昇順（EventEdit.vue の shops computed と同一ルール）。
 */
export function getDeliverablePartnerShopsSorted(
  eventLocation: EventLocationLatLng | null,
  eventStartMillis: number | null | undefined,
  partnerShops: readonly PartnerShop[] | null | undefined,
): DeliverablePartnerShop[] {
  if (eventLocation == null || partnerShops == null || partnerShops.length === 0) {
    return []
  }
  if (eventStartMillis == null || eventStartMillis === 0) {
    return []
  }

  const mapped = partnerShops
    .map((shop) => {
      if (shop.shop_address_longitude == null || shop.shop_address_latitude == null) {
        return null
      }
      const shopLocation: EventLocationLatLng = {
        longitude: shop.shop_address_longitude,
        latitude: shop.shop_address_latitude,
      }
      const dist = distanceKmBetween(eventLocation, shopLocation)
      const rangeIndex = shop.shop_range_min_orders.findIndex((order) => order?.range != null && order.range >= dist)
      const min_orders_on_spot = shop.shop_range_min_orders[rangeIndex]?.min_orders ?? 30
      const withExtras = Object.assign(Object.create(Object.getPrototypeOf(shop)), shop, {
        distance: dist,
        min_orders_on_spot,
      }) as DeliverablePartnerShop
      return withExtras
    })
    .filter((row): row is DeliverablePartnerShop => row != null)
    .filter(
      (shop) =>
        isWithinShopDeliveryRange(shop, eventLocation) &&
        isInShopTime(eventStartMillis, shop) &&
        shop.is_approved &&
        shop.is_open,
    )
    .sort((a, b) => a.min_orders_on_spot - b.min_orders_on_spot)

  return mapped
}

/**
 * 指定した shop_id が、開催地・開始日時において配達可能店リストに含まれるか。
 * shop_id が空のときは true（店未選択は別バリデーション）。
 */
export function isPartnerShopIdDeliverableAt(
  shopId: string,
  eventLocation: EventLocationLatLng | null,
  eventStartMillis: number | null | undefined,
  partnerShops: readonly PartnerShop[] | null | undefined,
): boolean {
  if (shopId === '') {
    return true
  }
  const list = getDeliverablePartnerShopsSorted(eventLocation, eventStartMillis, partnerShops)
  return list.some((s) => s.shop_id === shopId)
}

/**
 * 指定した shop_id が距離だけで見て配達圏内に含まれるか（営業時間 / is_approved / is_open は判定しない）。
 * 集約バリデーションで「営業時間外」と「配達圏外」を独立した理由コードに分離するために使う。
 * shop_id が空のときは true（店未選択は別バリデーション）。
 */
export function isPartnerShopIdInDeliveryRange(
  shopId: string,
  eventLocation: EventLocationLatLng | null,
  partnerShops: readonly PartnerShop[] | null | undefined,
): boolean {
  if (shopId === '') {
    return true
  }
  if (eventLocation == null || partnerShops == null) {
    return false
  }
  const shop = partnerShops.find((s) => s.shop_id === shopId)
  if (shop == null) {
    return false
  }
  return isWithinShopDeliveryRange(shop, eventLocation)
}
