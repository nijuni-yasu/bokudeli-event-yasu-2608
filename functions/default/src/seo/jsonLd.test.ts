import { describe, expect, it } from 'vitest'
import {
  buildBreadcrumbListJsonLd,
  buildEventJsonLd,
  buildEventJsonLdNode,
  buildHomePageJsonLd,
  buildJsonLdDocument,
  buildOrganizationJsonLd,
  buildOrganizationJsonLdNode,
} from './jsonLd.js'
import { OGP_SITE_NAME } from './metaTags.js'

const getGraphNode = (document: Record<string, unknown>, index: number): Record<string, unknown> => {
  const graph = document['@graph'] as Record<string, unknown>[]
  return graph[index]
}

describe('buildEventJsonLdNode', () => {
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
    const jsonLd = buildEventJsonLdNode(baseInput)
    expect(jsonLd['@type']).toBe('Event')
    expect(jsonLd.name).toBe('春の食事会')
    expect(jsonLd.url).toBe(baseInput.url)
    expect(jsonLd.eventStatus).toBe('https://schema.org/EventScheduled')
    expect(jsonLd.eventAttendanceMode).toBe('https://schema.org/OfflineEventAttendanceMode')
    expect(jsonLd.startDate).toMatch(/^2026-04-01T12:00:00\+09:00/)
    expect(jsonLd.endDate).toMatch(/^2026-04-01T14:00:00\+09:00/)
  })

  it('sets EventCancelled when event is canceled', () => {
    const jsonLd = buildEventJsonLdNode({ ...baseInput, isCanceled: true })
    expect(jsonLd.eventStatus).toBe('https://schema.org/EventCancelled')
  })

  it('includes PostalAddress location and organizer url', () => {
    const jsonLd = buildEventJsonLdNode(baseInput)
    const location = jsonLd.location as Record<string, unknown>
    expect(location['@type']).toBe('Place')
    expect(location.name).toBe('テスト食堂')
    const address = location.address as Record<string, unknown>
    expect(address['@type']).toBe('PostalAddress')
    expect(address.addressCountry).toBe('JP')
    expect(address.addressRegion).toBe('東京都')
    expect(address.streetAddress).toBe('千代田区 1-1')
    const organizer = jsonLd.organizer as Record<string, unknown>
    expect(organizer.name).toBe('テストコミュニティ')
    expect(organizer.url).toBe('https://shokujii.jp/c/test')
  })

  it('decodes nbsp in description', () => {
    const jsonLd = buildEventJsonLdNode({ ...baseInput, eventDesc: 'hello&nbsp;world' })
    expect(jsonLd.description).toBe('hello world')
  })
})

describe('buildEventJsonLd', () => {
  it('wraps event node in @graph document', () => {
    const document = buildEventJsonLd({
      eventName: '春の食事会',
      eventDesc: '説明',
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
    })
    expect(document['@context']).toBe('https://schema.org')
    expect(getGraphNode(document, 0)['@type']).toBe('Event')
  })
})

describe('buildOrganizationJsonLdNode', () => {
  it('includes required Organization fields', () => {
    const jsonLd = buildOrganizationJsonLdNode({
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
    const jsonLd = buildOrganizationJsonLdNode({
      name: 'テスト',
      description: '',
      url: 'https://shokujii.jp/c/test',
      addressBase: '',
      addressDetail: '',
    })
    expect(jsonLd.address).toBeUndefined()
  })
})

describe('buildOrganizationJsonLd', () => {
  it('wraps organization node in @graph document', () => {
    const document = buildOrganizationJsonLd({
      name: 'テスト',
      description: '',
      url: 'https://shokujii.jp/c/test',
      addressBase: '',
      addressDetail: '',
    })
    expect(document['@context']).toBe('https://schema.org')
    expect(getGraphNode(document, 0)['@type']).toBe('Organization')
  })
})

describe('buildBreadcrumbListJsonLd', () => {
  it('builds ordered breadcrumb items', () => {
    const jsonLd = buildBreadcrumbListJsonLd([
      { name: OGP_SITE_NAME, url: 'https://shokujii.jp/' },
      { name: 'テストコミュニティ', url: 'https://shokujii.jp/c/test' },
      { name: '春の食事会', url: 'https://shokujii.jp/c/test/e/event1' },
    ])
    const items = jsonLd.itemListElement as Record<string, unknown>[]
    expect(items).toHaveLength(3)
    expect(items[0]).toMatchObject({
      '@type': 'ListItem',
      position: 1,
      name: OGP_SITE_NAME,
      item: 'https://shokujii.jp/',
    })
    expect(items[2]).toMatchObject({
      position: 3,
      name: '春の食事会',
      item: 'https://shokujii.jp/c/test/e/event1',
    })
  })
})

describe('buildJsonLdDocument', () => {
  it('combines multiple nodes without duplicate @context', () => {
    const document = buildJsonLdDocument(
      buildEventJsonLdNode({
        eventName: '春の食事会',
        eventDesc: '説明',
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
      }),
      buildBreadcrumbListJsonLd([{ name: OGP_SITE_NAME, url: 'https://shokujii.jp/' }]),
    )
    const graph = document['@graph'] as Record<string, unknown>[]
    expect(graph).toHaveLength(2)
    expect(graph[0]['@type']).toBe('Event')
    expect(graph[1]['@type']).toBe('BreadcrumbList')
    expect(graph[0]['@context']).toBeUndefined()
  })
})

describe('buildHomePageJsonLd', () => {
  it('includes Organization and WebSite nodes with publisher reference', () => {
    const document = buildHomePageJsonLd('https://shokujii.jp')
    const graph = document['@graph'] as Record<string, unknown>[]
    expect(graph).toHaveLength(2)
    expect(graph[0]).toMatchObject({
      '@type': 'Organization',
      '@id': 'https://shokujii.jp/#organization',
      name: OGP_SITE_NAME,
      url: 'https://shokujii.jp',
      logo: 'https://shokujii.jp/shokujii_ogp.png',
    })
    expect(graph[1]).toMatchObject({
      '@type': 'WebSite',
      '@id': 'https://shokujii.jp/#website',
      url: 'https://shokujii.jp',
      name: OGP_SITE_NAME,
      publisher: {
        '@id': 'https://shokujii.jp/#organization',
      },
    })
  })
})
