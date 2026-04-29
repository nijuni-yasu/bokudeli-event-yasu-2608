import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import { PartnerShop } from '../schemas/PartnerShop.js'
import {
  distanceKmBetween,
  getDeliverablePartnerShopsSorted,
  isPartnerShopIdDeliverableAt,
} from './partnerShopDeliverable.js'

const tokyoStation = { longitude: 139.767125, latitude: 35.681236 }

/** JST で営業時間内の月曜 12:00 のエポック */
function mondayNoonJst2026(): number {
  return DateTime.fromObject({ year: 2026, month: 6, day: 1, hour: 12, minute: 0 }, { zone: 'Asia/Tokyo' }).toMillis()
}

function makeShop(
  shopId: string,
  lat: number,
  lon: number,
  overrides: Partial<ConstructorParameters<typeof PartnerShop>[2]> = {},
): PartnerShop {
  return new PartnerShop('partner1', shopId, {
    shop_address_latitude: lat,
    shop_address_longitude: lon,
    is_approved: true,
    is_open: true,
    shop_name: `Shop ${shopId}`,
    ...overrides,
  })
}

describe('distanceKmBetween', () => {
  it('同一点は距離 0 に近い', () => {
    expect(distanceKmBetween(tokyoStation, tokyoStation)).toBeLessThan(0.001)
  })

  it('東京駅と大阪駅付近は数百 km 離れている', () => {
    const osaka = { longitude: 135.502165, latitude: 34.693738 }
    const d = distanceKmBetween(tokyoStation, osaka)
    expect(d).toBeGreaterThan(300)
    expect(d).toBeLessThan(500)
  })
})

describe('getDeliverablePartnerShopsSorted', () => {
  const start = mondayNoonJst2026()

  it('開催地が null のときは空配列', () => {
    expect(getDeliverablePartnerShopsSorted(null, start, [makeShop('a', 35.681236, 139.767125)])).toEqual([])
  })

  it('開始日時が無効のときは空配列', () => {
    expect(getDeliverablePartnerShopsSorted(tokyoStation, null, [makeShop('a', 35.681236, 139.767125)])).toEqual([])
    expect(getDeliverablePartnerShopsSorted(tokyoStation, 0, [makeShop('a', 35.681236, 139.767125)])).toEqual([])
  })

  it('圏内・営業内・承認済みの店だけ返す', () => {
    const near = makeShop('near', 35.681236, 139.767125)
    const far = makeShop('far', 34.693738, 135.502165)
    const list = getDeliverablePartnerShopsSorted(tokyoStation, start, [near, far])
    expect(list.map((s) => s.shop_id)).toEqual(['near'])
  })

  it('未承認の店は含めない', () => {
    const shop = makeShop('x', 35.681236, 139.767125, { is_approved: false })
    expect(getDeliverablePartnerShopsSorted(tokyoStation, start, [shop])).toEqual([])
  })
})

describe('isPartnerShopIdDeliverableAt', () => {
  const start = mondayNoonJst2026()
  const near = makeShop('near', 35.681236, 139.767125)

  it('shop_id が空なら true', () => {
    expect(isPartnerShopIdDeliverableAt('', tokyoStation, start, [near])).toBe(true)
  })

  it('配達可能なら true', () => {
    expect(isPartnerShopIdDeliverableAt('near', tokyoStation, start, [near])).toBe(true)
  })

  it('配達圏外なら false', () => {
    expect(isPartnerShopIdDeliverableAt('osaka', tokyoStation, start, [near])).toBe(false)
  })
})
