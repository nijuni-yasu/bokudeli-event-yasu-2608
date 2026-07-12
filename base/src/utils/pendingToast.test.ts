import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { consumePendingToast, setPendingToast } from './pendingToast.js'

const PENDING_TOAST_KEY = 'pendingToast'

describe('pendingToast', () => {
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
    sessionStorageMock.getItem.mockClear()
    sessionStorageMock.setItem.mockClear()
    sessionStorageMock.removeItem.mockClear()
    vi.stubGlobal('sessionStorage', sessionStorageMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('setPendingToast / consumePendingToast で往復できる', () => {
    setPendingToast('連携しました', 'success')

    expect(consumePendingToast()).toEqual({ message: '連携しました', color: 'success' })
    expect(consumePendingToast()).toBeNull()
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(PENDING_TOAST_KEY)
  })

  it('不正な JSON は null を返す', () => {
    sessionStorageMock.getItem.mockReturnValue('{invalid')

    expect(consumePendingToast()).toBeNull()
  })

  it('形が不正な JSON は null を返す', () => {
    sessionStorageMock.getItem.mockReturnValue(JSON.stringify({ foo: 'bar' }))

    expect(consumePendingToast()).toBeNull()
  })
})
