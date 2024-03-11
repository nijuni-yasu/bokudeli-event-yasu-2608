import {
  type User,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  UserCredential,
  FacebookAuthProvider,
  GoogleAuthProvider,
} from 'firebase/auth'
import { useStoreStoredUser } from '@/stores/storedUser'
import { useStoreCredential } from '@/stores/credential'
import { loginUser, updateCredentialFromUserCredential } from '@/composable/loginUser'
import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router'
import routes from '~pages'
import { FirebaseError } from 'firebase/app'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...setupLayouts(routes)],
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

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

// Docs: https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
router.beforeEach(async () => {
  try {
    await waitAdminAuthentication()
  } catch {
    // Do nothing
  }
})

export default router
