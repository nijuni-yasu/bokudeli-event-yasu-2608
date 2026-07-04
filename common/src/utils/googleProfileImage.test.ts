import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  GOOGLE_UNAVAILABLE_AVATAR_HASHES,
  fetchGoogleProfileImage,
  isGoogleProfileImageUrl,
  normalizeGoogleProfileImageUrl,
} from './googleProfileImage.js'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('isGoogleProfileImageUrl', () => {
  it('Google プロフィール画像 URL を true と判定する', () => {
    expect(isGoogleProfileImageUrl('https://lh3.googleusercontent.com/a/ACg8ocExample=s500-c')).toBe(true)
  })

  it('その他の URL は false と判定する', () => {
    expect(isGoogleProfileImageUrl('https://example.com/photo.png')).toBe(false)
    expect(isGoogleProfileImageUrl('gs://bucket/users/uid/avatar.png')).toBe(false)
  })

  it('SSRF 想定 URL は false と判定する', () => {
    expect(isGoogleProfileImageUrl('https://lh3.googleusercontent.com.attacker.example/path')).toBe(false)
    expect(isGoogleProfileImageUrl('https://lh3.googleusercontent.com@evil.com/path')).toBe(false)
  })
})

describe('normalizeGoogleProfileImageUrl', () => {
  it('サイズ指定を置き換える', () => {
    const url = 'https://lh3.googleusercontent.com/a/ACg8ocExample=s50-c'
    expect(normalizeGoogleProfileImageUrl(url, 500)).toBe('https://lh3.googleusercontent.com/a/ACg8ocExample=s500-c')
  })
})

describe('fetchGoogleProfileImage', () => {
  const googleUrl = 'https://lh3.googleusercontent.com/a/ACg8ocExample=s96-c'

  it('HTTP エラー時は indeterminate を返す', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    await expect(fetchGoogleProfileImage(googleUrl)).resolves.toEqual({ status: 'indeterminate' })
  })

  it('既知プレースホルダーハッシュの場合は placeholder を返す', async () => {
    const placeholderHash = [...GOOGLE_UNAVAILABLE_AVATAR_HASHES][0]!
    const digestBytes = new Uint8Array(32)
    for (let i = 0; i < 32; i++) {
      digestBytes[i] = parseInt(placeholderHash.slice(i * 2, i * 2 + 2), 16)
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(8),
        headers: { get: () => 'image/png' },
      }),
    )
    vi.spyOn(crypto.subtle, 'digest').mockResolvedValue(digestBytes.buffer)
    await expect(fetchGoogleProfileImage(googleUrl)).resolves.toEqual({ status: 'placeholder' })
  })

  it('有効な画像の場合は valid と Blob を返す', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4])
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => bytes.buffer,
        headers: { get: () => 'image/jpeg' },
      }),
    )
    vi.spyOn(crypto.subtle, 'digest').mockResolvedValue(new Uint8Array(32).buffer)
    const result = await fetchGoogleProfileImage(googleUrl)
    expect(result.status).toBe('valid')
    if (result.status === 'valid') {
      expect(result.blob.type).toBe('image/jpeg')
    }
  })
})
