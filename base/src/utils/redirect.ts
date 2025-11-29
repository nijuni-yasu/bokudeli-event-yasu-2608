import { FirebaseError } from 'firebase/app'
import { getAuth, getRedirectResult, type User, type UserCredential } from 'firebase/auth'
import { credentialFromError, linkByProviderService, type ProviderIdType } from './providerService'

const removePendingLinkRequest = () => {
  sessionStorage.removeItem('pendingLinkRequestProviderId')
}

const setPendingLinkRequest = (providerId: string) => {
  sessionStorage.setItem('pendingLinkRequestProviderId', providerId)
}

const getPendingLinkRequest = (): string | null => {
  return sessionStorage.getItem('pendingLinkRequestProviderId')
}

export const handleRedirect = async (user: User | null) => {
  // pendingLinkRequestProviderId はどのフローであっても消しておく
  const pendingLinkRequestProviderId = getPendingLinkRequest()
  removePendingLinkRequest()

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
    if (pendingLinkRequestProviderId != null) {
      // リンク依頼がセーブされていたら処理する
      userCredential = await linkByProviderService(user, pendingLinkRequestProviderId as ProviderIdType)
    }
    return userCredential
  } else {
    return null
  }
}
