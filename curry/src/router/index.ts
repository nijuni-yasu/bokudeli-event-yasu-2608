import {
  type User,
  type UserCredential,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  FacebookAuthProvider,
  GoogleAuthProvider,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { useStoreStoredUser } from '@shokujii/base/stores/storedUser.js'
import { useStoreCredential } from '@shokujii/base/stores/credential.js'
import { loginUser, updateCredentialFromUserCredential } from '@shokujii/base/composable/loginUser.js'
import type { Router } from 'vue-router'

const checkUser = async (user: User | null) => {
  // リダイレクト結果を取得
  let userCredential: UserCredential | null = null
  try {
    userCredential = await getRedirectResult(getAuth())
  } catch (error) {
    if (error instanceof FirebaseError) {
      const tokenResponse = error.customData?._tokenResponse as { providerId: string }
      const providerId = tokenResponse.providerId

      let providerService: 'Facebook' | 'Google' | null = null
      switch (providerId) {
        case FacebookAuthProvider.PROVIDER_ID:
          providerService = 'Facebook'
          break
        case GoogleAuthProvider.PROVIDER_ID:
          providerService = 'Google'
          break
      }

      if (error.code === 'auth/account-exists-with-different-credential') {
        switch (providerService) {
          case 'Facebook':
            window.alert('Googleアカウントですでに登録されています')
            break
          case 'Google':
            window.alert('Facebookアカウントですでに登録されています')
            break
          default:
            window.alert('他のアカウントですでに登録されています')
            break
        }
      } else {
        switch (providerService) {
          case 'Facebook':
            window.alert('Facebookログインできませんでした')
            break
          case 'Google':
            window.alert('Googleログインできませんでした')
            break
          default:
            window.alert('ログインできませんでした')
            break
        }
      }
    } else {
      window.alert('ログインに失敗しました')
      console.error('Error fetching redirect result:', { error })
    }
  }
  if (!userCredential && !user) {
    // ログアウト処理
    const store = useStoreStoredUser()
    store.$reset()
    useStoreCredential().$reset()
    return
  }
  if (!userCredential && user) {
    // ログイン済みのユーザーの処理
    await loginUser(user)
  }
  if (userCredential) {
    // リダイレクトでのログイン処理
    await updateCredentialFromUserCredential(userCredential)
    await loginUser(user || userCredential.user)
  }
}

const waitAdminAuthentication = async (): Promise<User | null> => {
  return new Promise<User | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (user: User | null) => {
      unsubscribe()
      await checkUser(user)
      resolve(user)
    })
  })
}

onAuthStateChanged(getAuth(), checkUser)

export const setupRouter = (router: Router) => {
  // Docs: https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
  router.beforeEach(async () => {
    try {
      await waitAdminAuthentication()
    } catch {
      // Do nothing
    }
  })

  router.beforeEach((to) => {
    const paths = to.path.split('/')
    let redirect = false
    if (paths[1] === 'community') {
      if (paths[2]) {
        paths[1] = 'c'
      } else {
        paths[1] = 'communitylist'
      }
      redirect = true
    }
    if (paths[1] === 'users') {
      paths[1] = 'u'
      redirect = true
    }
    if (paths[3] === 'events') {
      paths[3] = 'e'
      redirect = true
    }
    if (paths[1] === 'c' && paths[2] !== paths[2]?.toLowerCase()) {
      paths[2] = paths[2]?.toLowerCase()
      redirect = true
    }
    if (redirect) {
      return {
        path: paths.join('/'),
        query: to.query,
      }
    }
  })
}
