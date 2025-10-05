export const fetchFacebookImage = async (photoURL: string): Promise<Blob | null> => {
  const imageQueryUrl = `${photoURL}?width=500&height=500&redirect=false`

  // JSON レスポンスを取得
  const response = await fetch(imageQueryUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image query: ${response.statusText}`)
  }
  const data = await response.json()

  const imageUrl = !data.data.is_silhouette ? data.data.url : null
  if (imageUrl == null) {
    return null
  }

  // 画像本体を取得
  const response2 = await fetch(imageUrl)
  if (!response2.ok) {
    throw new Error(`Failed to fetch image: ${response2.statusText}`)
  }
  return await response2.blob()
}

export const fetchTwitterImage = async (photoURL: string): Promise<Blob | null> => {
  // photoURLを加工してオリジナル画像を取得出来るURLに成形
  const splitPhotoURL = photoURL?.split('_')
  if (splitPhotoURL == null || splitPhotoURL.length < 2) {
    return null
  }
  const url = splitPhotoURL[0] + '_' + splitPhotoURL[1] + '.' + splitPhotoURL[2].split('.')[1]
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`)
  }
  return await response.blob()
}
