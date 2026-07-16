import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./providerService.js', () => ({
  credentialFromError: vi.fn(),
  linkByProviderService: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  getRedirectResult: vi.fn(),
}))

import { getRedirectResult } from 'firebase/auth'
import { linkByProviderService } from './providerService.js'
import {
  clearLinkageCompletedToast,
  clearPendingLinkRequest,
  clearStalePendingLinkRequestOutsideAutoLinkage,
  consumeLinkageCompletedToast,
  handleRedirect,
  isProviderIdType,
  peekPendingLinkRequest,
  reserveLinkageCompletedToast,
  resolveLinkageCompletedProviderId,
  startPendingProviderLink,
} from './redirect.js'

const PENDING_LINK_KEY = 'pendingLinkRequestProviderId'
const LINKAGE_COMPLETED_TOAST_KEY = 'pendingLinkageCompletedProviderId'

const linkCredential = (providerId: string): import('firebase/auth').UserCredential =>
  ({ providerId, operationType: 'link' }) as import('firebase/auth').UserCredential

const createSessionStorageMock = () => {
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
    store,
  }
}

describe('redirect session helpers', () => {
  const sessionStorageMock = createSessionStorageMock()

  beforeEach(() => {
    sessionStorageMock.clear()
    vi.stubGlobal('sessionStorage', sessionStorageMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('peekPendingLinkRequest / clearPendingLinkRequest で往復できる', () => {
    sessionStorageMock.setItem(PENDING_LINK_KEY, 'facebook.com')
    expect(peekPendingLinkRequest()).toBe('facebook.com')
    clearPendingLinkRequest()
    expect(peekPendingLinkRequest()).toBeNull()
  })

  it('reserveLinkageCompletedToast / consumeLinkageCompletedToast で往復できる', () => {
    reserveLinkageCompletedToast('google.com')
    expect(consumeLinkageCompletedToast()).toBe('google.com')
    expect(consumeLinkageCompletedToast()).toBeNull()
  })

  it('clearLinkageCompletedToast で予約を削除できる', () => {
    reserveLinkageCompletedToast('facebook.com')
    clearLinkageCompletedToast()
    expect(consumeLinkageCompletedToast()).toBeNull()
  })

  it('isProviderIdType は有効な provider のみ true', () => {
    expect(isProviderIdType('facebook.com')).toBe(true)
    expect(isProviderIdType('invalid')).toBe(false)
  })
})

describe('clearStalePendingLinkRequestOutsideAutoLinkage', () => {
  const sessionStorageMock = createSessionStorageMock()

  beforeEach(() => {
    sessionStorageMock.clear()
    vi.stubGlobal('sessionStorage', sessionStorageMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('自動連携フロー外では stale pending を破棄する', () => {
    sessionStorageMock.setItem(PENDING_LINK_KEY, 'facebook.com')

    clearStalePendingLinkRequestOutsideAutoLinkage({})

    expect(peekPendingLinkRequest()).toBeNull()
  })

  it('pass-code の pid ありでは pending を保持する', () => {
    sessionStorageMock.setItem(PENDING_LINK_KEY, 'facebook.com')

    clearStalePendingLinkRequestOutsideAutoLinkage({ passCodePid: 'facebook.com' })

    expect(peekPendingLinkRequest()).toBe('facebook.com')
  })

  it('login の pid1/pid2 ありでは pending を保持する', () => {
    sessionStorageMock.setItem(PENDING_LINK_KEY, 'facebook.com')

    clearStalePendingLinkRequestOutsideAutoLinkage({
      loginPid1: 'facebook.com',
      loginPid2: 'google.com',
    })

    expect(peekPendingLinkRequest()).toBe('facebook.com')
  })

  it('login の pid1 と pending が不一致のとき stale pending を破棄する', () => {
    sessionStorageMock.setItem(PENDING_LINK_KEY, 'google.com')

    clearStalePendingLinkRequestOutsideAutoLinkage({
      loginPid1: 'facebook.com',
      loginPid2: 'google.com',
    })

    expect(peekPendingLinkRequest()).toBeNull()
  })

  it('pass-code の pid と pending が不一致のとき stale pending を破棄する', () => {
    sessionStorageMock.setItem(PENDING_LINK_KEY, 'google.com')

    clearStalePendingLinkRequestOutsideAutoLinkage({ passCodePid: 'facebook.com' })

    expect(peekPendingLinkRequest()).toBeNull()
  })

  it('pending が無いときは no-op', () => {
    clearStalePendingLinkRequestOutsideAutoLinkage({})

    expect(peekPendingLinkRequest()).toBeNull()
  })
})

describe('resolveLinkageCompletedProviderId', () => {
  const sessionStorageMock = createSessionStorageMock()

  beforeEach(() => {
    sessionStorageMock.clear()
    vi.stubGlobal('sessionStorage', sessionStorageMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('予約と link credential が一致するとき providerId を返し予約を消費する', () => {
    reserveLinkageCompletedToast('facebook.com')
    const result = resolveLinkageCompletedProviderId(linkCredential('facebook.com'), '/login')
    expect(result).toBe('facebook.com')
    expect(sessionStorageMock.getItem(LINKAGE_COMPLETED_TOAST_KEY)).toBeNull()
  })

  it('/profile では予約がなくても credential の providerId を返す', () => {
    const result = resolveLinkageCompletedProviderId(linkCredential('google.com'), '/profile')
    expect(result).toBe('google.com')
  })

  it('予約と不一致かつ /profile 以外では null を返し予約を保持する', () => {
    reserveLinkageCompletedToast('facebook.com')
    const result = resolveLinkageCompletedProviderId(linkCredential('google.com'), '/login')
    expect(result).toBeNull()
    expect(sessionStorageMock.getItem(LINKAGE_COMPLETED_TOAST_KEY)).toBe('facebook.com')
  })

  it('予約と providerId が一致しても signIn では null を返し予約を保持する', () => {
    reserveLinkageCompletedToast('facebook.com')
    const result = resolveLinkageCompletedProviderId(
      { providerId: 'facebook.com', operationType: 'signIn' } as import('firebase/auth').UserCredential,
      '/login',
    )
    expect(result).toBeNull()
    expect(sessionStorageMock.getItem(LINKAGE_COMPLETED_TOAST_KEY)).toBe('facebook.com')
  })
})

describe('startPendingProviderLink', () => {
  const sessionStorageMock = createSessionStorageMock()
  const user = { uid: 'user-1' } as import('firebase/auth').User

  beforeEach(() => {
    sessionStorageMock.clear()
    vi.stubGlobal('sessionStorage', sessionStorageMock)
    vi.mocked(linkByProviderService).mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('link 前に pending を clear し予約トーストを設定する', async () => {
    sessionStorageMock.setItem(PENDING_LINK_KEY, 'facebook.com')
    vi.mocked(linkByProviderService).mockResolvedValue(linkCredential('facebook.com'))

    await startPendingProviderLink(user)

    expect(sessionStorageMock.getItem(PENDING_LINK_KEY)).toBeNull()
    expect(sessionStorageMock.getItem(LINKAGE_COMPLETED_TOAST_KEY)).toBe('facebook.com')
    expect(linkByProviderService).toHaveBeenCalledWith(user, 'facebook.com')
  })

  it('同期失敗時に pending と予約を復元する', async () => {
    sessionStorageMock.setItem(PENDING_LINK_KEY, 'facebook.com')
    vi.mocked(linkByProviderService).mockRejectedValue(new Error('link failed'))

    await expect(startPendingProviderLink(user)).rejects.toThrow('link failed')

    expect(sessionStorageMock.getItem(PENDING_LINK_KEY)).toBe('facebook.com')
    expect(sessionStorageMock.getItem(LINKAGE_COMPLETED_TOAST_KEY)).toBeNull()
  })
})

describe('handleRedirect', () => {
  const sessionStorageMock = createSessionStorageMock()
  const user = { uid: 'user-1' } as import('firebase/auth').User

  beforeEach(() => {
    sessionStorageMock.clear()
    vi.stubGlobal('sessionStorage', sessionStorageMock)
    vi.mocked(linkByProviderService).mockReset()
    vi.mocked(getRedirectResult).mockReset()
    vi.mocked(getRedirectResult).mockResolvedValue(null)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('user が null のとき pending を保持する', async () => {
    sessionStorageMock.setItem(PENDING_LINK_KEY, 'facebook.com')

    await handleRedirect(null)

    expect(sessionStorageMock.getItem(PENDING_LINK_KEY)).toBe('facebook.com')
    expect(linkByProviderService).not.toHaveBeenCalled()
  })

  it('user あり・pending あり・signIn のとき link 前に予約して linkByProviderService を呼ぶ', async () => {
    sessionStorageMock.setItem(PENDING_LINK_KEY, 'facebook.com')
    vi.mocked(getRedirectResult).mockResolvedValue({
      providerId: 'google.com',
      operationType: 'signIn',
    } as import('firebase/auth').UserCredential)
    vi.mocked(linkByProviderService).mockResolvedValue(linkCredential('facebook.com'))

    await handleRedirect(user)

    expect(sessionStorageMock.getItem(PENDING_LINK_KEY)).toBeNull()
    expect(sessionStorageMock.getItem(LINKAGE_COMPLETED_TOAST_KEY)).toBe('facebook.com')
    expect(linkByProviderService).toHaveBeenCalledWith(user, 'facebook.com')
  })

  it('operationType link のとき再 link しない', async () => {
    sessionStorageMock.setItem(PENDING_LINK_KEY, 'facebook.com')
    vi.mocked(getRedirectResult).mockResolvedValue(linkCredential('facebook.com'))

    await handleRedirect(user)

    expect(linkByProviderService).not.toHaveBeenCalled()
    expect(sessionStorageMock.getItem(LINKAGE_COMPLETED_TOAST_KEY)).toBeNull()
  })

  it('link 同期失敗時に pending と予約を復元する', async () => {
    sessionStorageMock.setItem(PENDING_LINK_KEY, 'facebook.com')
    vi.mocked(getRedirectResult).mockResolvedValue({
      providerId: 'google.com',
      operationType: 'signIn',
    } as import('firebase/auth').UserCredential)
    vi.mocked(linkByProviderService).mockRejectedValue(new Error('link failed'))

    await expect(handleRedirect(user)).rejects.toThrow('link failed')

    expect(sessionStorageMock.getItem(PENDING_LINK_KEY)).toBe('facebook.com')
    expect(sessionStorageMock.getItem(LINKAGE_COMPLETED_TOAST_KEY)).toBeNull()
  })
})
