import { describe, expect, it } from 'vitest'
import {
  injectSeoHtml,
  SEO_BODY_BEGIN,
  SEO_BODY_END,
  SEO_HEAD_BEGIN,
  SEO_HEAD_END,
  OGP_BEGIN_TAG,
  OGP_END_TAG,
} from './htmlInjection.js'

const SAMPLE_HTML = `<!doctype html>
<html lang="ja">
  <head>
    <title>食事でつながる「shokujii」</title>
    <meta
      name="description"
      content="ランチ会・食事会の幹事向けプラットフォーム。イベント・会議・セミナー・社内交流会・異業種交流会。飲食店からお弁当やケータリングを配達・デリバリー"
    />
    ${OGP_BEGIN_TAG}
    <meta property="og:title" content="default" />
    ${OGP_END_TAG}
    ${SEO_HEAD_BEGIN}
    ${SEO_HEAD_END}
  </head>
  <body>
    <div id="app">
      ${SEO_BODY_BEGIN}
      ${SEO_BODY_END}
      <div class="loading"></div>
    </div>
  </body>
</html>`

const baseContext = {
  pageTitle: 'テストイベント',
  metaDescription: 'テスト説明文',
  canonicalUrl: 'https://shokujii.jp/c/test/e/abc123',
  jsonLd: { '@context': 'https://schema.org', '@type': 'Event', name: 'テストイベント' },
  prerenderHtml: '<article><h1>テストイベント</h1></article>',
  ogp: {
    site: 'https://shokujii.jp',
    url: 'https://shokujii.jp/c/test/e/abc123',
    image: 'https://shokujii.jp/cover.png',
    imageType: 'image/png',
    title: 'テストイベント',
    description: 'テスト説明文',
  },
}

describe('injectSeoHtml', () => {
  it('replaces title with page-specific document title', () => {
    const result = injectSeoHtml(SAMPLE_HTML, baseContext)
    expect(result).toContain('<title>テストイベント | shokujii</title>')
  })

  it('injects meta description, canonical, and JSON-LD into SEO_HEAD block', () => {
    const result = injectSeoHtml(SAMPLE_HTML, baseContext)
    expect(result).toContain('<meta name="description" content="テスト説明文">')
    expect(result).toContain('<link rel="canonical" href="https://shokujii.jp/c/test/e/abc123">')
    expect(result).toContain('<script type="application/ld+json">')
    expect(result).toContain('"@type":"Event"')
  })

  it('removes static meta description so only one description tag remains', () => {
    const result = injectSeoHtml(SAMPLE_HTML, baseContext)
    const matches = result.match(/<meta name="description"/g)
    expect(matches?.length).toBe(1)
    expect(result).toContain('content="テスト説明文"')
    expect(result).not.toContain('幹事向けプラットフォーム')
  })

  it('replaces OGP block while keeping markers', () => {
    const result = injectSeoHtml(SAMPLE_HTML, baseContext)
    expect(result).toContain(OGP_BEGIN_TAG)
    expect(result).toContain(OGP_END_TAG)
    expect(result).toContain('property="og:title" content="テストイベント"')
    expect(result).not.toContain('content="default"')
  })

  it('injects prerender HTML into SEO_BODY block', () => {
    const result = injectSeoHtml(SAMPLE_HTML, baseContext)
    expect(result).toContain('<h1>テストイベント</h1>')
    expect(result).toContain(SEO_BODY_BEGIN)
    expect(result).toContain(SEO_BODY_END)
  })

  it('escapes HTML in meta description', () => {
    const result = injectSeoHtml(SAMPLE_HTML, {
      ...baseContext,
      metaDescription: 'A & B <script>',
    })
    expect(result).toContain('content="A &amp; B &lt;script&gt;"')
  })

  it('escapes HTML in document title', () => {
    const result = injectSeoHtml(SAMPLE_HTML, {
      ...baseContext,
      pageTitle: 'A & B <script>',
    })
    expect(result).toContain('<title>A &amp; B &lt;script&gt; | shokujii</title>')
  })

  it('does not treat $ in title as replace special sequence', () => {
    const result = injectSeoHtml(SAMPLE_HTML, {
      ...baseContext,
      pageTitle: 'Price $& sale',
    })
    expect(result).toContain('<title>Price $&amp; sale | shokujii</title>')
  })

  it('escapes closing script tag in JSON-LD', () => {
    const result = injectSeoHtml(SAMPLE_HTML, {
      ...baseContext,
      jsonLd: { '@context': 'https://schema.org', '@type': 'Event', name: '</script><script>alert(1)' },
    })
    expect(result).toContain('"name":"<\\/script><script>alert(1)"')
    expect(result).not.toMatch(/<script type="application\/ld\+json">[^<]*<\/script><script>/)
  })
})

describe('SEO markers', () => {
  it('SEO_HEAD markers exist in user index.html contract', () => {
    expect(SEO_HEAD_BEGIN).toBe('<!-- SEO_HEAD_BEGIN -->')
    expect(SEO_HEAD_END).toBe('<!-- SEO_HEAD_END -->')
  })
})
