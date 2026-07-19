import { describe, expect, it } from 'vitest'
import { buildSitemapXml, formatSitemapLastmod } from './sitemap.js'

describe('buildSitemapXml', () => {
  it('generates valid urlset with escaped characters', () => {
    const xml = buildSitemapXml([
      { loc: 'https://shokujii.jp/' },
      { loc: 'https://shokujii.jp/c/test', lastmod: '2026-07-19' },
      { loc: 'https://example.com/a&b' },
    ])
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<loc>https://shokujii.jp/</loc>')
    expect(xml).toContain('<lastmod>2026-07-19</lastmod>')
    expect(xml).toContain('<loc>https://example.com/a&amp;b</loc>')
    expect(xml.match(/<url>/g)?.length).toBe(3)
  })

  it('omits lastmod when not provided', () => {
    const xml = buildSitemapXml([{ loc: 'https://shokujii.jp/communitylist' }])
    expect(xml).not.toContain('<lastmod>')
  })
})

describe('formatSitemapLastmod', () => {
  it('formats millis as YYYY-MM-DD', () => {
    const millis = Date.parse('2026-07-19T15:30:00+09:00')
    expect(formatSitemapLastmod(millis)).toBe('2026-07-19')
  })
})
