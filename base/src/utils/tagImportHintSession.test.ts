import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hasSeenTagImportHint, markTagImportHintSeen } from './tagImportHintSession.js'

describe('tagImportHintSession', () => {
  const sessionStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        store = {}
      }),
    }
  })()

  beforeEach(() => {
    sessionStorageMock.clear()
    vi.stubGlobal('sessionStorage', sessionStorageMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('未表示では hasSeenTagImportHint が false', () => {
    expect(hasSeenTagImportHint()).toBe(false)
  })

  it('markTagImportHintSeen 後は hasSeenTagImportHint が true', () => {
    markTagImportHintSeen()
    expect(hasSeenTagImportHint()).toBe(true)
  })
})
