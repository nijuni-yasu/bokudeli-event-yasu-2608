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
} from 'firebase/auth'

export const signInByProviderService = async (providerService: 'Facebook' | 'Google' | 'Twitter') => {
  let provider: FacebookAuthProvider | GoogleAuthProvider | TwitterAuthProvider | null = null

  switch (providerService) {
    case 'Facebook':
      provider = new FacebookAuthProvider()
      provider.addScope('public_profile')
      break
    case 'Google':
      provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('openid')
      break
    case 'Twitter':
      provider = new TwitterAuthProvider()
      break
  }

  if (import.meta.env.DEV) {
    return await signInWithPopup(getAuth(), provider)
  } else {
    return await signInWithRedirect(getAuth(), provider)
  }
}

export const linkByProviderService = async (user: User , providerService: 'Facebook' | 'Google' | 'Twitter') => {
  let provider: FacebookAuthProvider | GoogleAuthProvider | TwitterAuthProvider | null = null

  switch (providerService) {
    case 'Facebook':
      provider = new FacebookAuthProvider()
      provider.addScope('email')
      provider.addScope('public_profile')
      break
    case 'Google':
      provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('openid')
      break
    case 'Twitter':
      provider = new TwitterAuthProvider()
      break
  }

  if (import.meta.env.DEV) {
    return await linkWithPopup(user, provider);
  } else {
    return await linkWithRedirect(user, provider)
  }
}

export const reauthenticateByProviderService = async (user: User , providerService: 'Facebook' | 'Google' | 'Twitter') => {
  let provider: FacebookAuthProvider | GoogleAuthProvider | TwitterAuthProvider | null = null

  switch (providerService) {
    case 'Facebook':
      provider = new FacebookAuthProvider()
      provider.addScope('email')
      provider.addScope('public_profile')
      break
    case 'Google':
      provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('openid')
      break
    case 'Twitter':
      provider = new TwitterAuthProvider()
      break
  }

  if (import.meta.env.DEV) {
    return await reauthenticateWithPopup(user, provider);
  } else {
    return await reauthenticateWithRedirect(user, provider)
  }
}

export const getCredentialWithPopup = async (providerService: 'Facebook' | 'Google' | 'Twitter') => {
  let provider: FacebookAuthProvider | GoogleAuthProvider | TwitterAuthProvider | null = null

  switch (providerService) {
    case 'Facebook':
      provider = new FacebookAuthProvider()
      provider.addScope('public_profile')
      provider.setCustomParameters({
        display: 'popup',
      })
      break
    case 'Google':
      provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('openid')
      break
    case 'Twitter':
      provider = new TwitterAuthProvider()
      break
  }

  return await signInWithPopup(getAuth(), provider)
}