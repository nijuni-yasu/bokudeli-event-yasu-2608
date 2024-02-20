import {
  type User,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
} from 'firebase/auth'
import { useStoreStoredUser } from '@/stores/storedUser'
import { useStoreCredential } from '@/stores/credential'
import { loginUser, updateCredentialFromUserCredential } from '@/composable/loginUser'
import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router'
import routes from '~pages'

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
  const userCredential = await getRedirectResult(getAuth())
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

export default router
