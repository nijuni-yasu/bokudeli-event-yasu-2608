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
} from 'firebase/auth'
import { updateProfileFromProviders as _updateProfileFromProviders } from '@shokujii/base/apis/user'
import { User as ShokujiiUser } from '@shokujii/common/schemas/User.js'

export type ProviderIdType = 'facebook.com' | 'google.com' | 'twitter.com'

export const signInByProviderService = async (providerService: ProviderIdType) => {
  let provider: FacebookAuthProvider | GoogleAuthProvider | TwitterAuthProvider | null = null

  switch (providerService) {
    case 'facebook.com':
      provider = new FacebookAuthProvider()
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
  }

  if (import.meta.env.DEV) {
    return await signInWithPopup(getAuth(), provider)
  } else {
    return await signInWithRedirect(getAuth(), provider)
  }
}

/**
 *
 * @param user
 * @param providerService 'Facebook', 'Google', 'Twitter' は旧仕様
 * @returns
 */
export const linkByProviderService = async (
  user: User,
  providerService: ProviderIdType | 'Facebook' | 'Google' | 'Twitter',
) => {
  let provider: FacebookAuthProvider | GoogleAuthProvider | TwitterAuthProvider | null = null

  switch (providerService) {
    case 'Facebook':
    case 'facebook.com':
      provider = new FacebookAuthProvider()
      provider.addScope('email')
      provider.addScope('public_profile')
      break
    case 'Google':
    case 'google.com':
      provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('openid')
      break
    case 'Twitter':
    case 'twitter.com':
      provider = new TwitterAuthProvider()
      break
  }

  if (import.meta.env.DEV) {
    return await linkWithPopup(user, provider)
  } else {
    return await linkWithRedirect(user, provider)
  }
}

export const reauthenticateByProviderService = async (user: User, providerService: ProviderIdType) => {
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
  }

  if (import.meta.env.DEV) {
    return await reauthenticateWithPopup(user, provider)
  } else {
    return await reauthenticateWithRedirect(user, provider)
  }
}

export const getCredentialWithPopup = async (providerService: ProviderIdType) => {
  let provider: FacebookAuthProvider | GoogleAuthProvider | TwitterAuthProvider | null = null

  switch (providerService) {
    case 'facebook.com':
      provider = new FacebookAuthProvider()
      provider.addScope('public_profile')
      provider.setCustomParameters({
        display: 'popup',
      })
      break
    case 'google.com':
      provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('openid')
      break
    case 'twitter.com':
      provider = new TwitterAuthProvider()
      break
  }

  return await signInWithPopup(getAuth(), provider)
}

export const updateProfileFromProviders = async (userCredential: UserCredential | null) => {
  // updateProfileFromProviders で情報は一括更新したいところだが、
  // 一部の情報はクライアントでしか取得できないため、ここで取得して functions に送る
  let additinalInfo: Partial<ShokujiiUser> | null = null
  if (userCredential != null) {
    const additionalUserInfo = getAdditionalUserInfo(userCredential)
    switch (userCredential.providerId) {
      case TwitterAuthProvider.PROVIDER_ID: {
        if (additionalUserInfo != null) {
          additinalInfo = {
            user_description: additionalUserInfo.profile?.description as string,
            user_sns_twitter: additionalUserInfo.username as string,
          }
        }
        break
      }
    }
  }
  additinalInfo = additinalInfo ?? {}
  return await _updateProfileFromProviders({ additinalInfo })
}
