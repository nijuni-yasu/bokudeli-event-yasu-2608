import { describe, expect, it } from 'vitest'
import { withEnterpriseLogoCacheBust } from './enterpriseLogoUrl.js'

describe('withEnterpriseLogoCacheBust', () => {
  it('version <= 0 のとき URL をそのまま返す', () => {
    expect(withEnterpriseLogoCacheBust('https://example.com/logo.png', 0)).toBe('https://example.com/logo.png')
    expect(withEnterpriseLogoCacheBust('https://example.com/logo.png', -1)).toBe('https://example.com/logo.png')
  })

  it('HTTP(S) URL に v= クエリを付与する', () => {
    expect(withEnterpriseLogoCacheBust('https://example.com/logo.png', 1700000000000)).toBe(
      'https://example.com/logo.png?v=1700000000000',
    )
  })

  it('既存クエリがある場合は &v= で連結する', () => {
    expect(withEnterpriseLogoCacheBust('https://example.com/logo.png?token=abc', 42)).toBe(
      'https://example.com/logo.png?token=abc&v=42',
    )
  })

  it('相対パスは cache-bust しない', () => {
    expect(withEnterpriseLogoCacheBust('/assets/logo.png', 123)).toBe('/assets/logo.png')
  })
})
