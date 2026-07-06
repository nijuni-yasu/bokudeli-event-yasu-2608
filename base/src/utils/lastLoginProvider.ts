import type { UserCredential } from 'firebase/auth'
import { type ProviderIdType } from './providerService.js'

export type LastLoginProviderId = ProviderIdType | 'custom'

const STORAGE_KEY = 'shokujii:last_login_provider'

const VALID_IDS = new Set<string>(['google.com', 'facebook.com', 'twitter.com', 'custom'])

const isValidId = (value: string): value is LastLoginProviderId => VALID_IDS.has(value)

export const getLastLoginProvider = (): LastLoginProviderId | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value == null || !isValidId(value)) {
      return null
    }
    return value
  } catch {
    return null
  }
}

export const setLastLoginProvider = (id: LastLoginProviderId): void => {
  if (!isValidId(id)) {
    return
  }
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // SSR / private mode 等
  }
}

export const recordLastLoginFromCredential = (credential: UserCredential): void => {
  const { providerId } = credential
  if (providerId != null && isValidId(providerId)) {
    setLastLoginProvider(providerId)
  }
}
