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
import { FacebookAuthProvider, GoogleAuthProvider, OAuthCredential, User, UserCredential } from 'firebase/auth'
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

  const docRef = doc(db, 'users', storedUser.userId)
  const docSnap = await getDoc(docRef)

  // Pinia のデータを更新
  const currentStoredUser = convertDocumentDataToStoredUser(docSnap.data())
  store.update(currentStoredUser)

  if (!docSnap.exists()) {
    // ユーザーが存在しない場合は新規作成
    const firestoredUser = convertStoredUserToFirestoredUser(storedUser)
    firestoredUser.created_at = Timestamp.now()
    firestoredUser.updated_at = Timestamp.now()
    await setDoc(docRef, firestoredUser.convertToDocumentData())

    // Pinia に保存
    store.update(storedUser)
  } else {
    if (currentStoredUser.userEmail !== storedUser.userEmail || !currentStoredUser.userImageUrl) {
      // 既にユーザーが存在しメールアドレスが変更されている場合は更新する
      // 画像がない場合も更新する
      await setDoc(
        docRef,
        {
          user_email: storedUser.userEmail,
          user_image_url: storedUser.userImageUrl,
          updated_at: Timestamp.now(),
        },
        { merge: true },
      )

      // Pinia に保存
      const updatedStoredUser = {
        ...currentStoredUser,
        userEmail: storedUser.userEmail,
        userImageUrl: storedUser.userImageUrl,
      }
      store.update(updatedStoredUser)
    }
  }

  // Facebook Login の場合は、画像を Storage にアップロードする
  // ただし、Facebook Login の度に画像を Storage にアップロードするわけにはいかないので、
  // 既存の画像がない場合のみ
  if (currentStoredUser.userImageUrl == null || currentStoredUser.userImageUrl === '') {
    for (const provider of user.providerData) {
      switch (provider.providerId) {
        case FacebookAuthProvider.PROVIDER_ID:
          {
            const credentialStore = useStoreCredential()
            if (!credentialStore.credential) {
              break
            }
            const imageQueryUrl =
              user.photoURL + `?width=500&height=500&redirect=false&access_token=${credentialStore.credential.accessToken}`
            // ログインに影響が出ないよう、非同期で画像を取得する
            axios.get(imageQueryUrl).then(async response => {
              const imageUrl = !response.data.data.is_silhouette ? response.data.data.url : null
              if (imageUrl == null) {
                return
              }
              const response2 = await axios.get(imageUrl, {
                responseType: 'blob'
              })
              const blob = response2.data;
              const userStore = useUserStore(storedUser.userId) as UserStore
              await userStore.uploadUserImage(blob)
            })
          }
          break
        default:
          break
      }
    }
  }
}
