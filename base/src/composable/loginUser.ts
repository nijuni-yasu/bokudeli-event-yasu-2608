import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import axios from 'axios'
import { FacebookAuthProvider, TwitterAuthProvider, type User } from 'firebase/auth'
import { watch } from 'vue'

export const loginUser = async (user: User) => {
  // ログイン処理
  const currentUserStore = useCurrentUserStore()

  await new Promise<void>((resolve) => {
    let unwatch: (() => void) | null = null

    unwatch = watch(
      () => currentUserStore.user,
      () => {
        if (currentUserStore.user != null) {
          if (unwatch) {
            unwatch()
          }
          resolve()
        }
      },
      { immediate: true },
    )
  })

  const currentUser = currentUserStore.user! // watchでnullでないことが保証されている

  // Facebook Login の場合は、画像を Storage にアップロードする
  // ただし、Facebook Login の度に画像を Storage にアップロードするわけにはいかないので、
  // 既存の画像がない場合のみ
  // 想定ケースはFacebookとTwitterでの初回ログイン、メアドログインで画像が設定されていない際にいずれかのSNS連携を実施した場合
  if (
    currentUser.user_image_url == null ||
    currentUser.user_image_url === '' ||
    currentUser.user_image_url.startsWith('https://graph.facebook.com') ||
    currentUser.user_image_url.startsWith('https://pbs.twimg.com')
  ) {
    for (const provider of user.providerData) {
      switch (provider.providerId) {
        case FacebookAuthProvider.PROVIDER_ID:
          {
            const providerData = user.providerData.find((info) => {
              return info.providerId === FacebookAuthProvider.PROVIDER_ID
            })
            const imageQueryUrl = providerData?.photoURL + '?width=500&height=500&redirect=false'
            // ログインに影響が出ないよう、非同期で画像を取得する
            axios.get(imageQueryUrl).then(async (response) => {
              const imageUrl = !response.data.data.is_silhouette ? response.data.data.url : null
              if (imageUrl == null) {
                return
              }
              const response2 = await axios.get(imageUrl, {
                responseType: 'blob',
              })
              const blob = response2.data
              await currentUserStore.uploadUserImage(blob)
            })
          }
          break
        case TwitterAuthProvider.PROVIDER_ID:
          {
            const providerData = user.providerData.find((info) => {
              return info.providerId === TwitterAuthProvider.PROVIDER_ID
            })
            // photoURLを加工してオリジナル画像を取得出来るURLに成形
            const splitPhotoURL = providerData?.photoURL?.split('_') as string[]
            const photoURL = splitPhotoURL[0] + '_' + splitPhotoURL[1] + '.' + splitPhotoURL[2].split('.')[1]

            // ログインに影響が出ないよう、非同期で画像を取得する
            axios.get(photoURL, { responseType: 'blob' }).then(async (response) => {
              const blob = response.data
              await currentUserStore.uploadUserImage(blob)
            })
          }
          break
        default:
          break
      }
    }
  }
}
