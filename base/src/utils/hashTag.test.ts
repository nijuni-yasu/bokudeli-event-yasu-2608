import { describe, expect, it } from 'vitest'
import { buildTwitterHashTagSearchUrl, trimHashTag } from './hashTag'

describe('trimHashTag', () => {
  it('先頭 # と記号を除去する', () => {
    expect(trimHashTag('#foo&bar')).toBe('foobar')
  })
})

describe('buildTwitterHashTagSearchUrl', () => {
  it('ハッシュタグをエンコードして検索 URL を組み立てる', () => {
    expect(buildTwitterHashTagSearchUrl('test&tag')).toBe('https://twitter.com/search?q=%23test%26tag&f=live')
  })

  it('空白のみなら undefined', () => {
    expect(buildTwitterHashTagSearchUrl('   ')).toBeUndefined()
  })
})
