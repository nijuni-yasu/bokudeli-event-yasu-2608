import { describe, expect, it } from 'vitest'
import { toPlainTextExcerpt } from './escape.js'

describe('toPlainTextExcerpt', () => {
  it('decodes nbsp entities to spaces', () => {
    expect(toPlainTextExcerpt('hello&nbsp;world')).toBe('hello world')
    expect(toPlainTextExcerpt('hello&#160;world')).toBe('hello world')
  })

  it('strips HTML tags', () => {
    expect(toPlainTextExcerpt('<p>test</p>')).toBe('test')
  })

  it('decodes entities so that buildOgpMetaTags does not double-escape them', () => {
    expect(toPlainTextExcerpt('<p>食事&amp;交流</p>')).toBe('食事&交流')
    expect(toPlainTextExcerpt('a &quot;b&quot; &#39;c&#39;')).toBe('a "b" \'c\'')
  })

  it('keeps entity-escaped tag notation as text', () => {
    expect(toPlainTextExcerpt('&lt;b&gt;強調&lt;/b&gt;')).toBe('<b>強調</b>')
  })
})
