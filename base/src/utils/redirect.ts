import { FirebaseError } from 'firebase/app'
import { getAuth, getRedirectResult, type User, type UserCredential } from 'firebase/auth'
import { credentialFromError, linkByProviderService, type ProviderIdType } from './providerService'

const PENDING_LINK_KEY = 'pendingLinkRequestProviderId'
const LINKAGE_COMPLETED_TOAST_KEY = 'pendingLinkageCompletedProviderId'

const VALID_PROVIDER_IDS: readonly ProviderIdType[] = ['facebook.com', 'google.com', 'twitter.com']

export const isProviderIdType = (value: string): value is ProviderIdType => {
  return (VALID_PROVIDER_IDS as readonly string[]).includes(value)
}

export const clearPendingLinkRequest = () => {
  sessionStorage.removeItem(PENDING_LINK_KEY)
}

const setPendingLinkRequest = (providerId: string) => {
  sessionStorage.setItem(PENDING_LINK_KEY, providerId)
}

const getPendingLinkRequest = (): string | null => {
  return sessionStorage.getItem(PENDING_LINK_KEY)
}

export const peekPendingLinkRequest = (): string | null => {
  return getPendingLinkRequest()
}

/**
 * 自動連携フロー外（pid / pid1+pid2 なし）に残った stale pending を破棄する。
 */
export const clearStalePendingLinkRequestOutsideAutoLinkage = (context: {
  passCodePid?: string | null
  loginPid1?: string | null
  loginPid2?: string | null
}): void => {
  const pending = peekPendingLinkRequest()
  if (pending == null) {
    return
  }
  const inPassCodeAutoLink =
    context.passCodePid != null && isProviderIdType(context.passCodePid) && pending === context.passCodePid
  const inLoginAutoLink =
    context.loginPid1 != null &&
    context.loginPid2 != null &&
    isProviderIdType(context.loginPid1) &&
    isProviderIdType(context.loginPid2) &&
    pending === context.loginPid1
  if (!inPassCodeAutoLink && !inLoginAutoLink) {
    clearPendingLinkRequest()
  }
}

export const reserveLinkageCompletedToast = (providerId: string): void => {
  sessionStorage.setItem(LINKAGE_COMPLETED_TOAST_KEY, providerId)
}

export const consumeLinkageCompletedToast = (): string | null => {
  const id = sessionStorage.getItem(LINKAGE_COMPLETED_TOAST_KEY)
  if (id != null) {
    sessionStorage.removeItem(LINKAGE_COMPLETED_TOAST_KEY)
  }
  return id
}

export const clearLinkageCompletedToast = (): void => {
  sessionStorage.removeItem(LINKAGE_COMPLETED_TOAST_KEY)
}

/**
 * 自動連携完了トースト用の providerId を解決する。
 * 予約済みトーストと link credential が一致する場合、または /profile 手動連携の場合に providerId を返す。
 */
export const resolveLinkageCompletedProviderId = (
  userCredential: UserCredential | null,
  path: string,
): string | null => {
  if (userCredential == null) {
    return null
  }
  const reserved = sessionStorage.getItem(LINKAGE_COMPLETED_TOAST_KEY)
  if (reserved != null && reserved === userCredential.providerId && userCredential.operationType === 'link') {
    sessionStorage.removeItem(LINKAGE_COMPLETED_TOAST_KEY)
    return reserved
  }
  if (path === '/profile') {
    return userCredential.providerId
  }
  return null
}

/**
 * メール OTP ログイン後に pending SNS 連携を開始する。
 * 本番: linkWithRedirect でページ離脱。復帰後は同一 URL（/pass-code）で handleRedirect が処理する。
 * 開発: linkWithPopup が同期的に UserCredential を返す。
 * 同期失敗時は pending と予約トーストを復元する（linkWithRedirect 成功後はページ離脱のため catch には入らない）。
 */
export const startPendingProviderLink = async (user: User): Promise<UserCredential | null> => {
  const pendingId = peekPendingLinkRequest()
  if (pendingId == null || !isProviderIdType(pendingId)) {
    return null
  }
  clearPendingLinkRequest()
  reserveLinkageCompletedToast(pendingId)
  try {
    return await linkByProviderService(user, pendingId)
  } catch (err: unknown) {
    setPendingLinkRequest(pendingId)
    clearLinkageCompletedToast()
    throw err
  }
}

export const handleRedirect = async (user: User | null) => {
  // 未ログイン時は pending を保持する（/pass-code リロード後の OTP 自動連携で必要）
  let pendingLinkRequestProviderId: string | null = null
  if (user != null) {
    pendingLinkRequestProviderId = getPendingLinkRequest()
    clearPendingLinkRequest()
  }

  let userCredential: UserCredential | null = null
  try {
    userCredential = await getRedirectResult(getAuth())
  } catch (err: unknown) {
    if (err instanceof FirebaseError && err.code === 'auth/account-exists-with-different-credential') {
      const _pendingCred = credentialFromError(err)
      if (_pendingCred != null) {
        // リンク依頼をセーブしておき次のログイン時に処理する
        setPendingLinkRequest(_pendingCred.providerId)
      }
    }
    throw err
  }
  if (user != null) {
    if (
      pendingLinkRequestProviderId != null &&
      isProviderIdType(pendingLinkRequestProviderId) &&
      userCredential?.operationType !== 'link'
    ) {
      reserveLinkageCompletedToast(pendingLinkRequestProviderId)
      try {
        userCredential = await linkByProviderService(user, pendingLinkRequestProviderId)
      } catch (err: unknown) {
        setPendingLinkRequest(pendingLinkRequestProviderId)
        clearLinkageCompletedToast()
        throw err
      }
    }
    return userCredential
  } else {
    return null
  }
}

export const setRedirectPath = (path: string) => {
  sessionStorage.setItem('redirectPath', path)
}

export const getRedirectPath = (willDelete: boolean = true): string | null => {
  const result = sessionStorage.getItem('redirectPath')
  if (willDelete) {
    sessionStorage.removeItem('redirectPath')
  }
  return result
}
