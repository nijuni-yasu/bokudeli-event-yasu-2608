import type { UserCredential } from 'firebase/auth'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getLastLoginProvider, recordLastLoginFromCredential, setLastLoginProvider } from './lastLoginProvider.js'

const STORAGE_KEY = 'shokujii:last_login_provider'

const mockCredential = (providerId: string): UserCredential =>
  ({
    providerId,
  }) as UserCredential

describe('lastLoginProvider', () => {
  const localStorageMock = (() => {
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
    localStorageMock.clear()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    vi.stubGlobal('localStorage', localStorageMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('getLastLoginProvider は未保存時 null を返す', () => {
    expect(getLastLoginProvider()).toBeNull()
  })

  it('setLastLoginProvider / getLastLoginProvider が往復できる', () => {
    setLastLoginProvider('google.com')
    expect(getLastLoginProvider()).toBe('google.com')
    expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'google.com')
  })

  it('不正値は get で null を返す', () => {
    localStorageMock.setItem(STORAGE_KEY, 'invalid-provider')
    expect(getLastLoginProvider()).toBeNull()
  })

  it('recordLastLoginFromCredential は SNS providerId のみ保存する', () => {
    recordLastLoginFromCredential(mockCredential('facebook.com'))
    expect(getLastLoginProvider()).toBe('facebook.com')
  })

  it('recordLastLoginFromCredential は未知の providerId を保存しない', () => {
    recordLastLoginFromCredential(mockCredential('password'))
    expect(getLastLoginProvider()).toBeNull()
  })

  it('custom を保存できる', () => {
    setLastLoginProvider('custom')
    expect(getLastLoginProvider()).toBe('custom')
  })
})
