import { FacebookAuthProvider, TwitterAuthProvider, type UserInfo } from 'firebase/auth'
import { User as ShokujiiUser } from '@shokujii/common/schemas/User.js'
import axios from 'axios'

export const getBlobIfNecessary = async (providerData: UserInfo[], user: ShokujiiUser): Promise<Blob | null> => {
  // Facebook Login の場合は、画像を Storage にアップロードする
  // ただし、Facebook Login の度に画像を Storage にアップロードするわけにはいかないので、
  // 既存の画像がない場合のみ
  // 想定ケースはFacebookとTwitterでの初回ログイン、メアドログインで画像が設定されていない際にいずれかのSNS連携を実施した場合
  if (
    user.user_image_url == null ||
    user.user_image_url === '' ||
    user.user_image_url.startsWith('https://graph.facebook.com') ||
    user.user_image_url.startsWith('https://pbs.twimg.com')
  ) {
    for (const provider of providerData) {
      switch (provider.providerId) {
        case FacebookAuthProvider.PROVIDER_ID: {
          const pd = providerData.find((info) => {
            return info.providerId === FacebookAuthProvider.PROVIDER_ID
          })
          const imageQueryUrl = pd?.photoURL + '?width=500&height=500&redirect=false'
          const response = await axios.get(imageQueryUrl)
          const imageUrl = !response.data.data.is_silhouette ? response.data.data.url : null
          if (imageUrl == null) {
            return null
          }
          const response2 = await axios.get(imageUrl, {
            responseType: 'blob',
          })
          const blob = response2.data
          return blob
        }
        case TwitterAuthProvider.PROVIDER_ID: {
          const pd = providerData.find((info) => {
            return info.providerId === TwitterAuthProvider.PROVIDER_ID
          })
          // photoURLを加工してオリジナル画像を取得出来るURLに成形
          const splitPhotoURL = pd?.photoURL?.split('_') as string[]
          const photoURL = splitPhotoURL[0] + '_' + splitPhotoURL[1] + '.' + splitPhotoURL[2].split('.')[1]
          const response = await axios.get(photoURL, { responseType: 'blob' })
          const blob = response.data
          return blob
        }
        default:
          break
      }
    }
  }
  return null
}
