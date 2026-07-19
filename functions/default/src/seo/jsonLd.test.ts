import { describe, expect, it } from 'vitest'
import { buildEventJsonLd, buildOrganizationJsonLd } from './jsonLd.js'

describe('buildEventJsonLd', () => {
  const baseInput = {
    eventName: '春の食事会',
    eventDesc: '楽しい食事会です',
    url: 'https://shokujii.jp/c/test/e/event1',
    imageUrl: 'https://shokujii.jp/cover.png',
    startDatetimeMillis: Date.parse('2026-04-01T12:00:00+09:00'),
    endDatetimeMillis: Date.parse('2026-04-01T14:00:00+09:00'),
    shopName: 'テスト食堂',
    eventAddress: '',
    eventAddressBase: '東京都千代田区',
    eventAddressDetail: '1-1',
    communityName: 'テストコミュニティ',
    organizerUrl: 'https://shokujii.jp/c/test',
    isCanceled: false,
  }

  it('includes required Event fields', () => {
    const jsonLd = buildEventJsonLd(baseInput)
    expect(jsonLd['@type']).toBe('Event')
    expect(jsonLd.name).toBe('春の食事会')
    expect(jsonLd.url).toBe(baseInput.url)
    expect(jsonLd.eventStatus).toBe('https://schema.org/EventScheduled')
    expect(jsonLd.startDate).toMatch(/^2026-04-01T12:00:00\+09:00/)
    expect(jsonLd.endDate).toMatch(/^2026-04-01T14:00:00\+09:00/)
  })

  it('sets EventCancelled when event is canceled', () => {
    const jsonLd = buildEventJsonLd({ ...baseInput, isCanceled: true })
    expect(jsonLd.eventStatus).toBe('https://schema.org/EventCancelled')
  })

  it('includes location and organizer', () => {
    const jsonLd = buildEventJsonLd(baseInput)
    const location = jsonLd.location as Record<string, unknown>
    expect(location['@type']).toBe('Place')
    expect(location.name).toBe('テスト食堂')
    const organizer = jsonLd.organizer as Record<string, unknown>
    expect(organizer.name).toBe('テストコミュニティ')
    expect(organizer.url).toBe('https://shokujii.jp/c/test')
  })
})

describe('buildOrganizationJsonLd', () => {
  it('includes required Organization fields', () => {
    const jsonLd = buildOrganizationJsonLd({
      name: 'テストコミュニティ',
      description: 'コミュニティ説明',
      url: 'https://shokujii.jp/c/test',
      addressBase: '東京都',
      addressDetail: '千代田区',
    })
    expect(jsonLd['@type']).toBe('Organization')
    expect(jsonLd.name).toBe('テストコミュニティ')
    expect(jsonLd.address).toBe('東京都 千代田区')
  })

  it('omits address when empty', () => {
    const jsonLd = buildOrganizationJsonLd({
      name: 'テスト',
      description: '',
      url: 'https://shokujii.jp/c/test',
      addressBase: '',
      addressDetail: '',
    })
    expect(jsonLd.address).toBeUndefined()
  })
})
