/** Google が停止・削除アカウント向けに返すプレースホルダー画像の SHA-256（サイズ別） */
export const GOOGLE_UNAVAILABLE_AVATAR_HASHES = new Set([
  '48490e7b8828a034f98959c6cf282c4d32890974799adc2e6c06873cb09b3830', // s50-c
  '4859abb919a4830e3d236642ba2c574e0d792effd3f6c34d46d3c9b28ef71787', // s100-c
  'be72600edcedcd445fe0a4b36a7d012efbf1c3dd70d73cb2b8a534671f421814', // s500-c
])

export type GoogleProfileImageResult =
  | { status: 'valid'; blob: Blob }
  | { status: 'placeholder' }
  | { status: 'indeterminate' }

export const isGoogleProfileImageUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname === 'lh3.googleusercontent.com'
  } catch {
    return false
  }
}

export const normalizeGoogleProfileImageUrl = (url: string, size: number): string => {
  const parsed = new URL(url)
  parsed.pathname = `${parsed.pathname.split('=')[0]}=s${size}-c`
  return parsed.href
}

export const sha256Hex = async (data: Uint8Array): Promise<string> => {
  const hash = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const isGoogleUnavailableAvatarHash = (hashHex: string): boolean => GOOGLE_UNAVAILABLE_AVATAR_HASHES.has(hashHex)

/** クライアント fetch でハッシュ判定できる Google アバター URL（グレー斜線プレースホルダー等） */
export const isGoogleAvatarHashCheckableUrl = (url: string): boolean => {
  if (!isGoogleProfileImageUrl(url)) {
    return false
  }
  const { pathname } = new URL(url)
  // Google アバター URL の pathname プレフィックスで判定する。
  // - /a/ … 停止・削除アカウント向けのグレー斜線プレースホルダー（旧形式）
  // - /a-/ … 一般ユーザーの Google 写真も含むが、削除済みアカウントの斜線プレースホルダーもこの形式
  //   注意: '/a-/foo'.startsWith('/a/') は false のため、/a-/ は明示的に OR する必要がある
  // fetch + SHA-256 で GOOGLE_UNAVAILABLE_AVATAR_HASHES と照合し、一致時のみプレースホルダーとみなす。
  // 一般ユーザーの /a-/ 写真はハッシュ不一致のため従来どおり表示される。
  // CORS 非許可などで fetch できない URL は false（判定不能）とし、v-img 表示に任せる。
  return pathname.startsWith('/a/') || pathname.startsWith('/a-/')
}

export const isGoogleUnavailableAvatar = async (url: string): Promise<boolean> => {
  if (!isGoogleAvatarHashCheckableUrl(url)) {
    return false
  }
  try {
    const fetchUrl = normalizeGoogleProfileImageUrl(url, 500)
    const response = await fetch(fetchUrl)
    if (!response.ok) {
      return false
    }
    const buffer = new Uint8Array(await response.arrayBuffer())
    const hashHex = await sha256Hex(buffer)
    return isGoogleUnavailableAvatarHash(hashHex)
  } catch {
    // CORS 等で fetch できない URL（青い Google デフォルト等）は v-img 表示に任せる
    return false
  }
}

export const fetchGoogleProfileImage = async (photoURL: string): Promise<GoogleProfileImageResult> => {
  const url = normalizeGoogleProfileImageUrl(photoURL, 500)
  const response = await fetch(url)
  if (!response.ok) {
    return { status: 'indeterminate' }
  }
  const buffer = new Uint8Array(await response.arrayBuffer())
  const hashHex = await sha256Hex(buffer)
  if (isGoogleUnavailableAvatarHash(hashHex)) {
    return { status: 'placeholder' }
  }
  const contentType = response.headers.get('content-type') ?? 'image/png'
  return { status: 'valid', blob: new Blob([buffer], { type: contentType }) }
}
