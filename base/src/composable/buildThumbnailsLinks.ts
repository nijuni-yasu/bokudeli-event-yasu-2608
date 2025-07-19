import { FIREBASE_STORAGE_BASE_URL } from '@shokujii/base/firebase'

type Sizes = 'large' | 'medium' | 'small'
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

export const buildThumbnailsLinks = (userId: string, url: URL): ThumbnailLinks | null => {
  if (url.protocol === 'gs:') {
    return SIZE_LIST.reduce((result, size) => {
      const hostname = url.href.match(/^gs:\/\/([^/]+)(\/.*)$/)?.[1]
      const base = url.pathname.split('/').pop()?.split('.')
      const imageName = base?.[0]
      const ext = (base?.length ?? 0) > 1 ? '.' + base?.slice(1)?.join('.') : ''
      result[size.name] =
        `${FIREBASE_STORAGE_BASE_URL}b/${hostname}/o/` +
        encodeURIComponent(`users/${userId}/${imageName}_thumb_${size.name}${ext}`) +
        '?alt=media'
      return result
    }, {} as ThumbnailLinks)
  } else if (url.hostname === 'lh3.googleusercontent.com') {
    return SIZE_LIST.reduce((result, size) => {
      url.pathname = url.pathname.split('=')[0] + '=' + `s${size.value}-c`
      result[size.name] = url.href
      return result
    }, {} as ThumbnailLinks)
  } else {
    return SIZE_LIST.reduce((result, size) => {
      url.pathname = url.pathname.split('=')[0] + '=' + `s${size.value}-c`
      result[size.name] = url.href
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
  return null
}
