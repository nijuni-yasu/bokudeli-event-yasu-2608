import { describe, expect, it } from 'vitest'
import { isChunkLoadError } from './isChunkLoadError.js'

describe('isChunkLoadError', () => {
  it('ChunkLoadError 名の Error を検知する', () => {
    const err = new Error('Something went wrong')
    err.name = 'ChunkLoadError'
    expect(isChunkLoadError(err)).toBe(true)
  })

  it('Failed to fetch dynamically imported module を検知する', () => {
    const err = new Error('Failed to fetch dynamically imported module: https://example.com/assets/foo.js')
    expect(isChunkLoadError(err)).toBe(true)
  })

  it('Loading chunk メッセージを検知する', () => {
    const err = new Error('Loading chunk 123 failed')
    expect(isChunkLoadError(err)).toBe(true)
  })

  it('Importing a module script failed を検知する', () => {
    const err = new Error('Importing a module script failed')
    expect(isChunkLoadError(err)).toBe(true)
  })

  it('文字列形式の Chunk エラーを検知する', () => {
    expect(isChunkLoadError('dynamically imported module failed')).toBe(true)
  })

  it('無関係なエラーは false を返す', () => {
    expect(isChunkLoadError(new Error('Network request failed'))).toBe(false)
    expect(isChunkLoadError('something else')).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
  })
})
