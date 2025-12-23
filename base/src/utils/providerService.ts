import { type FirebaseError } from 'firebase/app'
import {
  getAuth,
  FacebookAuthProvider,
  GoogleAuthProvider,
  TwitterAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  type User,
  linkWithPopup,
  linkWithRedirect,
  reauthenticateWithPopup,
  reauthenticateWithRedirect,
  UserCredential,
  getAdditionalUserInfo,
  type OAuthCredential,
  OAuthProvider,
} from 'firebase/auth'
import { updateProfileFromProviders as _updateProfileFromProviders } from '@shokujii/base/apis/user'
import { User as ShokujiiUser } from '@shokujii/common/schemas/User.js'

export type ProviderIdType = 'facebook.com' | 'google.com' | 'twitter.com'

const getProvider = (providerService: ProviderIdType) => {
  let provider: FacebookAuthProvider | GoogleAuthProvider | TwitterAuthProvider | null = null
  switch (providerService) {
    case 'facebook.com':
      provider = new FacebookAuthProvider()
      provider.addScope('email')
      provider.addScope('public_profile')
      break
    case 'google.com':
      provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('openid')
      break
    case 'twitter.com':
      provider = new TwitterAuthProvider()
      break
    default:
      throw new Error(`Invalid provider service: ${providerService}`)
  }
  return provider
}

export const signInByProviderService = async (providerService: ProviderIdType) => {
  const provider = getProvider(providerService)

  if (import.meta.env.DEV) {
    return await signInWithPopup(getAuth(), provider)
  } else {
    return await signInWithRedirect(getAuth(), provider)
  }
}

/**
 *
 * @param user
 * @param providerService
 * @returns
 */
export const linkByProviderService = async (user: User, providerService: ProviderIdType) => {
  const provider = getProvider(providerService)

  if (import.meta.env.DEV) {
    return await linkWithPopup(user, provider)
  } else {
    return await linkWithRedirect(user, provider)
  }
}

export const reauthenticateByProviderService = async (user: User, providerService: ProviderIdType) => {
  const provider = getProvider(providerService)

  if (import.meta.env.DEV) {
    return await reauthenticateWithPopup(user, provider)
  } else {
    return await reauthenticateWithRedirect(user, provider)
  }
}

export const credentialFromError = (error: FirebaseError): OAuthCredential | null => {
  const providerId = OAuthProvider.credentialFromError(error)?.providerId
  switch (providerId) {
    case 'facebook.com':
      return FacebookAuthProvider.credentialFromError(error)
    case 'google.com':
      return GoogleAuthProvider.credentialFromError(error)
    case 'twitter.com':
      return TwitterAuthProvider.credentialFromError(error)
    default:
      return null
  }
}

export const updateProfileFromProviders = async (userCredential: UserCredential | null) => {
  // updateProfileFromProviders で情報は一括更新したいところだが、
  // 一部の情報はクライアントでしか取得できないため、ここで取得して functions に送る
  let additionalInfo: Partial<ShokujiiUser> | null = null
  if (userCredential != null) {
    const additionalUserInfo = getAdditionalUserInfo(userCredential)
    switch (userCredential.providerId) {
      case TwitterAuthProvider.PROVIDER_ID: {
        if (additionalUserInfo != null) {
          additionalInfo = {
            user_description: additionalUserInfo.profile?.description as string,
            user_sns_twitter: additionalUserInfo.username as string,
          }
        }
        break
      }
    }
  }
  additionalInfo = additionalInfo ?? {}
  return await _updateProfileFromProviders({ additionalInfo })
}
