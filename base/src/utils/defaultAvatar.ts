import defaultAvatarFallback from '../assets/images/avatars/default_profile_01.png'

const defaultAvatarImages = import.meta.glob<{ default: string }>('../assets/images/avatars/default_profile_*.png', {
  eager: true,
})

const DEFAULT_AVATAR_URLS = Object.keys(defaultAvatarImages)
  .sort()
  .map((path) => defaultAvatarImages[path]?.default)
  .filter((url): url is string => url != null)

const hashSeedToIndex = (seed: string, size: number): number => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash % size
}

export const getDefaultAvatarUrl = (userId?: string): string => {
  if (DEFAULT_AVATAR_URLS.length === 0) {
    return defaultAvatarFallback
  }
  if (userId == null || userId === '') {
    return DEFAULT_AVATAR_URLS[0]!
  }
  return DEFAULT_AVATAR_URLS[hashSeedToIndex(userId, DEFAULT_AVATAR_URLS.length)]!
}
