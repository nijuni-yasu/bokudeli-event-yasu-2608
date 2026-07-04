export type Sizes = 'large' | 'medium' | 'small'
export type ThumbnailLinks = { [K in Sizes]: string }

const SIZE_LIST: {
  name: Sizes
  value: number
}[] = [
  {
    name: 'large',
    value: 500,
  },
  {
    name: 'medium',
    value: 100,
  },
  {
    name: 'small',
    value: 50,
  },
]

export const buildThumbnailsLinks = (
  userId: string,
  url: URL,
  firebaseStorageBaseUrl: string,
  cacheBuster?: number,
): ThumbnailLinks | null => {
  if (url.protocol === 'gs:') {
    const cacheSuffix = cacheBuster != null && cacheBuster > 0 ? `&t=${cacheBuster}` : ''
    return SIZE_LIST.reduce((result, size) => {
      const hostname = url.href.match(/^gs:\/\/([^/]+)(\/.*)$/)?.[1]
      const base = url.pathname.split('/').pop()?.split('.')
      const imageName = base?.[0]
      const ext = (base?.length ?? 0) > 1 ? '.' + base?.slice(1)?.join('.') : ''
      result[size.name] =
        `${firebaseStorageBaseUrl}b/${hostname}/o/` +
        encodeURIComponent(`users/${userId}/${imageName}_thumb_${size.name}${ext}`) +
        `?alt=media${cacheSuffix}`
      return result
    }, {} as ThumbnailLinks)
  } else if (url.hostname === 'graph.facebook.com') {
    return null
  } else {
    return SIZE_LIST.reduce((result, size) => {
      const sizedUrl = new URL(url.href)
      sizedUrl.pathname = sizedUrl.pathname.split('=')[0] + '=' + `s${size.value}-c`
      result[size.name] = sizedUrl.href
      return result
    }, {} as ThumbnailLinks)
  }
  /* else if (url.hostname === 'platform-lookaside.fbsbx.com') {
    return SIZE_LIST.reduce((result, size) => {
      url.searchParams.set('width', size.value.toString())
      url.searchParams.set('height', size.value.toString())
      result[size.name] = url.href
      return result
    }, {} as ThumbnailLinks)
  } */ // Facebook は後からサイズ変更には対応していない
}

/**
 * Get thumbnail URL for user image with custom size
 * @param userId - The user ID
 * @param imageUrl - The image URL (can be gs:// or https://)
 * @param size - The size type ('large', 'medium', 'small')
 * @param firebaseStorageBaseUrl - The Firebase Storage base URL (defaults to production URL)
 * @returns Thumbnail URL or empty string if no image
 */
export function getUserImageUrl(
  userId: string,
  imageUrl: string | undefined,
  size: Sizes,
  firebaseStorageBaseUrl: string,
): string {
  if (!imageUrl) {
    return ''
  }

  try {
    const url = new URL(imageUrl)

    const thumbnails = buildThumbnailsLinks(userId, url, firebaseStorageBaseUrl)
    if (thumbnails && thumbnails[size]) {
      return thumbnails[size]
    } else {
      return imageUrl
    }
  } catch (error) {
    console.error(`Failed to generate thumbnail URL: ${imageUrl}`, error)
    return ''
  }
}
