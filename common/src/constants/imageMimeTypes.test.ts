import { describe, expect, it } from 'vitest'
import { ALLOWED_IMAGE_ACCEPT_ATTR, ALLOWED_IMAGE_MIME_TYPES, isAllowedImageMimeType } from './imageMimeTypes.js'

describe('ALLOWED_IMAGE_MIME_TYPES', () => {
  it('対応形式（JPEG / PNG / APNG / GIF / WebP）の 5 種を順序固定で保持する', () => {
    expect(ALLOWED_IMAGE_MIME_TYPES).toEqual(['image/jpeg', 'image/png', 'image/apng', 'image/gif', 'image/webp'])
  })
})

describe('ALLOWED_IMAGE_ACCEPT_ATTR', () => {
  it('accept 属性向けにカンマ区切り文字列を返す', () => {
    expect(ALLOWED_IMAGE_ACCEPT_ATTR).toBe('image/jpeg, image/png, image/apng, image/gif, image/webp')
  })
})

describe('isAllowedImageMimeType', () => {
  it('許可された MIME タイプ 5 種で true を返す', () => {
    expect(isAllowedImageMimeType('image/jpeg')).toBe(true)
    expect(isAllowedImageMimeType('image/png')).toBe(true)
    expect(isAllowedImageMimeType('image/apng')).toBe(true)
    expect(isAllowedImageMimeType('image/gif')).toBe(true)
    expect(isAllowedImageMimeType('image/webp')).toBe(true)
  })

  it('非対応形式（SVG / AVIF / HEIC / HEIF / BMP / TIFF / JPEG XL / JPEG 2000）で false を返す', () => {
    expect(isAllowedImageMimeType('image/svg+xml')).toBe(false)
    expect(isAllowedImageMimeType('image/avif')).toBe(false)
    expect(isAllowedImageMimeType('image/heic')).toBe(false)
    expect(isAllowedImageMimeType('image/heif')).toBe(false)
    expect(isAllowedImageMimeType('image/bmp')).toBe(false)
    expect(isAllowedImageMimeType('image/tiff')).toBe(false)
    expect(isAllowedImageMimeType('image/jxl')).toBe(false)
    expect(isAllowedImageMimeType('image/jp2')).toBe(false)
  })

  it('null / undefined / 空文字で false を返す', () => {
    expect(isAllowedImageMimeType(null)).toBe(false)
    expect(isAllowedImageMimeType(undefined)).toBe(false)
    expect(isAllowedImageMimeType('')).toBe(false)
  })

  it('画像以外の MIME タイプ（application/pdf 等）で false を返す', () => {
    expect(isAllowedImageMimeType('application/pdf')).toBe(false)
    expect(isAllowedImageMimeType('text/plain')).toBe(false)
    expect(isAllowedImageMimeType('image/')).toBe(false)
  })
})
