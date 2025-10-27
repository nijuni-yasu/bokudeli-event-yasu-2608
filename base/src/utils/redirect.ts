import { FirebaseError } from 'firebase/app'
import {
  getAuth,
  getRedirectResult,
  linkWithCredential,
  OAuthCredential,
  OAuthProvider,
  User,
  UserCredential,
} from 'firebase/auth'

const removePendingCred = () => {
  sessionStorage.removeItem('pendingCred')
}

const setPendingCred = (pendingCred: OAuthCredential) => {
  sessionStorage.setItem('pendingCred', JSON.stringify(pendingCred.toJSON()))
}

const getPendingCred = (): OAuthCredential | null => {
  const jsonString = sessionStorage.getItem('pendingCred')
  if (jsonString == null) {
    return null
  }
  return OAuthProvider.credentialFromJSON(jsonString)
}

export const handleRedirect = async (user: User | null) => {
  // pendingCred はどのフローであっても消しておく
  const pendingCred = getPendingCred()
  removePendingCred()

  let userCredential: UserCredential | null = null
  try {
    userCredential = await getRedirectResult(getAuth())
  } catch (err: unknown) {
    if (err instanceof FirebaseError && err.code === 'auth/account-exists-with-different-credential') {
      const _pendingCred = OAuthProvider.credentialFromError(err)
      if (_pendingCred != null /* false になることは無いはずだが念の為 */) {
        // リンク依頼をセーブしておき次のログイン時に処理する
        setPendingCred(_pendingCred)
      }
    }
    throw err
  }
  if (user != null) {
    if (pendingCred) {
      // リンク依頼がセーブされていたら処理する
      userCredential = await linkWithCredential(user, pendingCred)
    }
    return userCredential
  } else {
    return null
  }
}
