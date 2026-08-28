import { describe, expect, it } from 'vitest'
import { normalizeTag, normalizeTagList, tagCodePointLength } from './normalizeTag.js'

describe('normalizeTag', () => {
  it('前後の空白（全角含む）を除去する', () => {
    expect(normalizeTag('  和食 ')).toBe('和食')
    expect(normalizeTag('\u3000ラーメン\u3000')).toBe('ラーメン')
  })

  it('全角英数字を半角に変換する', () => {
    expect(normalizeTag('ＳａａＳ２')).toBe('SaaS2')
  })

  it('大文字小文字は変換しない', () => {
    expect(normalizeTag('SaaS')).toBe('SaaS')
  })

  it('中間の空白は保持する', () => {
    expect(normalizeTag(' クラフト ビール ')).toBe('クラフト ビール')
  })

  it('空白のみは空文字になる', () => {
    expect(normalizeTag('\u3000  ')).toBe('')
  })
})

describe('tagCodePointLength', () => {
  it('サロゲートペアを 1 文字として数える', () => {
    expect(tagCodePointLength('𠮷野家')).toBe(3)
  })
})

describe('normalizeTagList', () => {
  it('正規化・空文字除去・重複除去（先勝ち）を行う', () => {
    expect(normalizeTagList([' 和食 ', 'ＳａａＳ', '  ', '和食', 'SaaS', '寿司'])).toEqual(['和食', 'SaaS', '寿司'])
  })
})
