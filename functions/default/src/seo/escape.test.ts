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
})
