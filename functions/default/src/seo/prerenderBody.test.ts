import { describe, expect, it } from 'vitest'
import { buildEventPrerenderHtml, buildCommunityPrerenderHtml } from './prerenderBody.js'

describe('buildEventPrerenderHtml', () => {
  it('includes h1, datetime, shop name, and address', () => {
    const html = buildEventPrerenderHtml({
      eventName: '春の食事会',
      eventDesc: '説明文',
      startDatetimeMillis: Date.parse('2026-04-01T12:00:00+09:00'),
      shopName: 'テスト食堂',
      eventAddress: '',
      eventAddressBase: '東京都千代田区',
      eventAddressDetail: '',
    })
    expect(html).toContain('<h1>春の食事会</h1>')
    expect(html).toContain('テスト食堂')
    expect(html).toContain('東京都千代田区')
  })

  it('escapes HTML in event name', () => {
    const html = buildEventPrerenderHtml({
      eventName: '<script>alert(1)</script>',
      eventDesc: '',
      startDatetimeMillis: Date.now(),
      shopName: '店',
      eventAddress: '',
      eventAddressBase: '',
      eventAddressDetail: '',
    })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

describe('buildCommunityPrerenderHtml', () => {
  it('includes community name and description', () => {
    const html = buildCommunityPrerenderHtml({
      communityName: 'テストコミュニティ',
      communityDesc: 'コミュニティの説明',
    })
    expect(html).toContain('<h1>テストコミュニティ</h1>')
    expect(html).toContain('コミュニティの説明')
  })
})
