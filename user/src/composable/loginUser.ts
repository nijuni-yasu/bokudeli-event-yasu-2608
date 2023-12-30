import { db } from '@/firebase'
import {
  convertDocumentDataToStoredUser,
  convertFirebaseUserToStoredUser,
  convertStoredUserToFirestoredUser,
} from '@/schemes/converter'
import { useStoreCredential } from '@/stores/credential'
import { useStoreStoredUser } from '@/stores/storedUser'
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
  const storedUser = await convertFirebaseUserToStoredUser(user)

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
    await setDoc(docRef, firestoredUser)

    // Pinia に保存
    store.update(storedUser)
  } else if (currentStoredUser.userEmail === storedUser.userEmail) {
    // 既にユーザーが存在しメールアドレスが変更されている場合は更新する
    await setDoc(
      docRef,
      {
        user_email: storedUser.userEmail,
        updated_at: Timestamp.now(),
      },
      { merge: true },
    )

    // Pinia に保存
    const updatedStoredUser = { ...currentStoredUser, userEmail: storedUser.userEmail }
    store.update(updatedStoredUser)
  }
}
