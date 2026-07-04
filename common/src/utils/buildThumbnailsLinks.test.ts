import { describe, expect, it } from 'vitest'
import { buildThumbnailsLinks } from './buildThumbnailsLinks.js'

const FIREBASE_STORAGE_BASE_URL = 'https://firebasestorage.googleapis.com/v0/'

describe('buildThumbnailsLinks', () => {
  it('gs:// URL から Storage サムネイル URL を生成する', () => {
    const url = new URL('gs://test-project.appspot.com/users/uid1/avatar')
    const result = buildThumbnailsLinks('uid1', url, FIREBASE_STORAGE_BASE_URL)
    expect(result).not.toBeNull()
    expect(result?.small).toContain('users%2Fuid1%2Favatar_thumb_small')
    expect(result?.medium).toContain('users%2Fuid1%2Favatar_thumb_medium')
    expect(result?.large).toContain('users%2Fuid1%2Favatar_thumb_large')
  })

  it('Google URL は汎用 https 分岐でサイズ付き URL を返す', () => {
    const googleUrl = new URL('https://lh3.googleusercontent.com/a/ACg8ocExample=s96-c')
    const result = buildThumbnailsLinks('uid1', googleUrl, FIREBASE_STORAGE_BASE_URL)
    expect(result).not.toBeNull()
    expect(result?.small).toBe('https://lh3.googleusercontent.com/a/ACg8ocExample=s50-c')
    expect(result?.medium).toBe('https://lh3.googleusercontent.com/a/ACg8ocExample=s100-c')
    expect(result?.large).toBe('https://lh3.googleusercontent.com/a/ACg8ocExample=s500-c')
  })

  it('Facebook graph URL は null を返す', () => {
    const url = new URL('https://graph.facebook.com/123/picture')
    expect(buildThumbnailsLinks('uid1', url, FIREBASE_STORAGE_BASE_URL)).toBeNull()
  })
})
