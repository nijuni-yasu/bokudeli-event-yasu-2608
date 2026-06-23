import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const CHUNK_ERROR = new Error('Failed to fetch dynamically imported module: https://example.com/assets/foo.js')

vi.mock('@shokujii/base/plugins/i18n/index.js', () => ({
  getI18n: () => ({
    global: {
      t: (key: string) => key,
    },
  }),
}))

import {
  clearStaleChunkReloadFlag,
  isStaleChunkRetryExhausted,
  STALE_CHUNK_RELOAD_SESSION_KEY,
  tryReloadForStaleChunk,
} from './reloadForStaleChunk.js'

describe('reloadForStaleChunk', () => {
  const reloadMock = vi.fn()
  const sessionStorageMock = (() => {
    const store = new Map<string, string>()
    return {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value)
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key)
      }),
      clear: () => store.clear(),
    }
  })()

  beforeEach(() => {
    sessionStorageMock.clear()
    reloadMock.mockClear()
    sessionStorageMock.getItem.mockClear()
    sessionStorageMock.setItem.mockClear()
    sessionStorageMock.removeItem.mockClear()

    const createdElements: Array<{ id: string }> = []
    vi.stubGlobal('sessionStorage', sessionStorageMock)
    vi.stubGlobal('location', { reload: reloadMock })
    vi.stubGlobal('setTimeout', (handler: TimerHandler) => {
      if (typeof handler === 'function') {
        handler()
      }
      return 0 as ReturnType<typeof setTimeout>
    })
    vi.stubGlobal('window', {
      setTimeout: (handler: TimerHandler) => {
        if (typeof handler === 'function') {
          handler()
        }
        return 0 as ReturnType<typeof setTimeout>
      },
      location: { reload: reloadMock },
    })
    vi.stubGlobal('document', {
      getElementById: vi.fn((id: string) => createdElements.find((element) => element.id === id) ?? null),
      createElement: vi.fn(() => {
        const element = { id: '', textContent: '', style: {} as CSSStyleDeclaration, setAttribute: vi.fn() }
        createdElements.push(element)
        return element
      }),
      body: { appendChild: vi.fn() },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('tryReloadForStaleChunk', () => {
    it('Chunk 以外のエラーは false を返し reload しない', () => {
      expect(tryReloadForStaleChunk(new Error('Network request failed'))).toBe(false)
      expect(reloadMock).not.toHaveBeenCalled()
      expect(sessionStorageMock.setItem).not.toHaveBeenCalled()
    })

    it('Chunk エラーかつフラグなしは true を返し reload する', () => {
      expect(tryReloadForStaleChunk(CHUNK_ERROR)).toBe(true)
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(STALE_CHUNK_RELOAD_SESSION_KEY, '1')
      expect(reloadMock).toHaveBeenCalledOnce()
    })

    it('Chunk エラーかつフラグありは false を返し reload しない', () => {
      sessionStorageMock.setItem(STALE_CHUNK_RELOAD_SESSION_KEY, '1')

      expect(tryReloadForStaleChunk(CHUNK_ERROR)).toBe(false)
      expect(reloadMock).not.toHaveBeenCalled()
    })
  })

  describe('isStaleChunkRetryExhausted', () => {
    it('Chunk エラーかつフラグありは true', () => {
      sessionStorageMock.setItem(STALE_CHUNK_RELOAD_SESSION_KEY, '1')
      expect(isStaleChunkRetryExhausted(CHUNK_ERROR)).toBe(true)
    })

    it('Chunk エラーかつフラグなしは false', () => {
      expect(isStaleChunkRetryExhausted(CHUNK_ERROR)).toBe(false)
    })

    it('Chunk 以外は false', () => {
      sessionStorageMock.setItem(STALE_CHUNK_RELOAD_SESSION_KEY, '1')
      expect(isStaleChunkRetryExhausted(new Error('Network request failed'))).toBe(false)
    })
  })

  describe('clearStaleChunkReloadFlag', () => {
    it('sessionStorage のフラグを削除する', () => {
      sessionStorageMock.setItem(STALE_CHUNK_RELOAD_SESSION_KEY, '1')

      clearStaleChunkReloadFlag()

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(STALE_CHUNK_RELOAD_SESSION_KEY)
      expect(sessionStorageMock.getItem(STALE_CHUNK_RELOAD_SESSION_KEY)).toBeNull()
    })
  })
})
