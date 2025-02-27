import { db } from '@/firebase'
import {
  convertDocumentDataToStoredUser,
  convertFirebaseUserToStoredUser,
  convertStoredUserToFirestoredUser,
} from '@/schemes/converter'
import { useStoreCredential } from '@/stores/credential'
import { useStoreStoredUser } from '@/stores/storedUser'
import { useUserStore, type UserStore } from '@/stores/user'
import axios from 'axios'
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  TwitterAuthProvider,
  OAuthCredential,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { Timestamp, doc, getDoc, setDoc } from 'firebase/firestore'

export const updateCredentialFromUserCredential = async (redirectResult: UserCredential) => {
  try {
    let credential: OAuthCredential | null = null
    switch (redirectResult.providerId) {
      case FacebookAuthProvider.PROVIDER_ID:
        credential = FacebookAuthProvider.credentialFromResult(redirectResult)
        break
      case GoogleAuthProvider.PROVIDER_ID:
        credential = GoogleAuthProvider.credentialFromResult(redirectResult)
        break
      case TwitterAuthProvider.PROVIDER_ID:
        credential = TwitterAuthProvider.credentialFromResult(redirectResult)
        break
      default:
        console.error('Unknown providerId:', redirectResult.providerId)
        return
    }
    if (credential) {
      const store = useStoreCredential()
      store.update(credential)
    }
  } catch (error) {
    console.error('Error fetching redirect result:', error)
  }
}

export const loginUser = async (user: User) => {
  // ログイン処理
  const store = useStoreStoredUser()
  const storedUser = convertFirebaseUserToStoredUser(user)

  const userSnapShot = await getDoc(doc(db, 'users', storedUser.userId))
  const personalInformationSnapshot = await getDoc(doc(db, 'users_personal_information', storedUser.userId))

  let currentStoredUser
  if (userSnapShot == null || !userSnapShot.exists()) {
    // ユーザーが存在しない場合は新規作成
    const firestoredUser = convertStoredUserToFirestoredUser(storedUser)
    firestoredUser.created_at = Timestamp.now()
    firestoredUser.updated_at = Timestamp.now()
    await setDoc(userSnapShot.ref, firestoredUser.convertToDocumentData())
    await setDoc(personalInformationSnapshot.ref, { user_email: storedUser.userEmail })

    // Pinia に保存
    store.update(storedUser)
    currentStoredUser = storedUser
  } else {
    if (!currentStoredUser.userImageUrl) {
      // 画像がない場合更新する
      await setDoc(
        userSnapShot.ref,
        {
          user_image_url: storedUser.userImageUrl === '' ? null : storedUser.userImageUrl,
          updated_at: Timestamp.now(),
        },
        { merge: true },
      )
      await setDoc(personalInformationSnapshot.ref, { user_email: storedUser.userEmail }, { merge: true })

      // Pinia に保存
      currentStoredUser = {
        ...currentStoredUser,
        userEmail: storedUser.userEmail,
        userImageUrl: storedUser.userImageUrl,
      }
    }
    store.update(currentStoredUser)
  }

  // Facebook Login の場合は、画像を Storage にアップロードする
  // ただし、Facebook Login の度に画像を Storage にアップロードするわけにはいかないので、
  // 既存の画像がない場合のみ
  // 想定ケースはFacebookとTwitterでの初回ログイン、メアドログインで画像が設定されていない際にいずれかのSNS連携を実施した場合
  if (currentStoredUser.userImageUrl == null || currentStoredUser.userImageUrl === '') {
    for (const provider of user.providerData) {
      switch (provider.providerId) {
        case FacebookAuthProvider.PROVIDER_ID:
          {
            const providerData = user.providerData.find((info) => {
              return info.providerId === FacebookAuthProvider.PROVIDER_ID
            })
            const imageQueryUrl = providerData?.photoURL + `?width=500&height=500&redirect=false`
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
              const userStore = useUserStore(storedUser.userId) as UserStore
              await userStore.uploadUserImage(blob)
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
            const photoURL = splitPhotoURL[0] + '_' + splitPhotoURL[1] + '.' + splitPhotoURL[2].split('.')[1];

            // ログインに影響が出ないよう、非同期で画像を取得する
            axios.get(photoURL, { responseType: "blob" }).then(async (response) => {
              const blob = response.data
              const userStore = useUserStore(storedUser.userId) as UserStore
              await userStore.uploadUserImage(blob)
            });
          }
          break
        default:
          break
      }
    }
  }
}
