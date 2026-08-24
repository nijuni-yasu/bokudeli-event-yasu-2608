import { describe, expect, it } from 'vitest'
import { buildEventMapsSearchUrl } from './eventMapsSearchUrl'

describe('buildEventMapsSearchUrl', () => {
  it('住所と会場名を連結してエンコードする', () => {
    expect(buildEventMapsSearchUrl('東京都渋谷区1-2-3', 'カフェ&バー')).toBe(
      'https://www.google.co.jp/maps/search/%E6%9D%B1%E4%BA%AC%E9%83%BD%E6%B8%8B%E8%B0%B7%E5%8C%BA1-2-3%20%E3%82%AB%E3%83%95%E3%82%A7%26%E3%83%90%E3%83%BC',
    )
  })

  it('空の要素と前後の空白を除いて連結する', () => {
    expect(buildEventMapsSearchUrl(' 東京都 ', '')).toBe(
      'https://www.google.co.jp/maps/search/%E6%9D%B1%E4%BA%AC%E9%83%BD',
    )
  })

  it('住所・会場名がどちらも空なら undefined', () => {
    expect(buildEventMapsSearchUrl('', '')).toBeUndefined()
    expect(buildEventMapsSearchUrl('   ', ' ')).toBeUndefined()
  })
})
