import { describe, expect, it } from 'vitest'
import { orderTagsWithHighlightFirst } from './tagDisplayOrder.js'

describe('orderTagsWithHighlightFirst', () => {
  it('ハイライトタグを先頭に並べる', () => {
    expect(orderTagsWithHighlightFirst(['B', 'A', 'C'], (t) => t === 'A' || t === 'C')).toEqual(['A', 'C', 'B'])
  })
})
