import { describe, expect, it } from 'vitest'
import { buildEventPrerenderHtml, buildCommunityPrerenderHtml } from './prerenderBody.js'

const SITE = 'https://shokujii.jp'

describe('buildEventPrerenderHtml', () => {
  it('includes h1, datetime, shop name, address, and internal links', () => {
    const html = buildEventPrerenderHtml({
      site: SITE,
      communityAccount: 'test',
      communityName: 'テストコミュニティ',
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
    expect(html).toContain('<a href="https://shokujii.jp/">トップ</a>')
    expect(html).toContain('<a href="https://shokujii.jp/c/test">テストコミュニティ</a>')
  })

  it('escapes HTML in event name', () => {
    const html = buildEventPrerenderHtml({
      site: SITE,
      communityAccount: 'test',
      communityName: 'コミュニティ',
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
  it('includes community name, description, and internal links', () => {
    const html = buildCommunityPrerenderHtml({
      site: SITE,
      communityName: 'テストコミュニティ',
      communityDesc: 'コミュニティの説明',
    })
    expect(html).toContain('<h1>テストコミュニティ</h1>')
    expect(html).toContain('コミュニティの説明')
    expect(html).toContain('<a href="https://shokujii.jp/">トップ</a>')
    expect(html).toContain('<a href="https://shokujii.jp/communitylist">コミュニティ一覧</a>')
  })
})
