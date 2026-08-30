import { describe, expect, it } from 'vitest'
import { buildCommunityListPrerenderHtml } from './prerenderCommunityList.js'

describe('buildCommunityListPrerenderHtml', () => {
  it('includes h1, top link, and community links', () => {
    const html = buildCommunityListPrerenderHtml('https://shokujii.jp', [
      { communityAccount: 'TestComm', communityName: 'テストコミュニティ' },
      { communityAccount: 'other', communityName: 'その他' },
    ])
    expect(html).toContain('<h1>コミュニティ一覧</h1>')
    expect(html).toContain('<a href="https://shokujii.jp/">トップ</a>')
    expect(html).toContain('<a href="https://shokujii.jp/c/testcomm">テストコミュニティ</a>')
    expect(html).toContain('<a href="https://shokujii.jp/c/other">その他</a>')
  })

  it('escapes HTML in community names', () => {
    const html = buildCommunityListPrerenderHtml('https://shokujii.jp', [
      { communityAccount: 'x', communityName: '<script>' },
    ])
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
