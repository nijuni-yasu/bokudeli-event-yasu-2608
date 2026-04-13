import { type User, getAuth, onAuthStateChanged } from 'firebase/auth'
import type { Router } from 'vue-router'
import { useConfigStore } from '@shokujii/base/stores/config.js'
import { useEventStore, type EventStore } from '@shokujii/base/stores/event.js'

/** Firebase Auth の初回 onAuthStateChanged まで待つ。セッション復元前の currentUser が null のままになるのを避ける。 */
const waitForAuthInitialState = (): Promise<void> =>
  new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(getAuth(), () => {
      unsubscribe()
      resolve()
    })
  })

export async function waitAuthentication(): Promise<User | null> {
  return new Promise<User | null>((resolve, reject) => {
    const unsubscribe = getAuth().onAuthStateChanged(async (user: User | null) => {
      unsubscribe()
      if (user == null) {
        reject()
        return
      }
      resolve(user)
    })
  })
}

export const setupRouter = (router: Router) => {
  let lastUser: User | null = null
  getAuth().onAuthStateChanged(async (user: User | null) => {
    if (lastUser != null && user == null) {
      router.replace('/login')
    }
    lastUser = user
  })

  // 認証ガードより先に評価する。メンテ中は /login もブロックし未ログインは /maintenance のみ。
  router.beforeEach(async (to) => {
    await waitForAuthInitialState()

    const configStore = useConfigStore()
    const config = await configStore.getResolvedConfig()

    if (to.path === '/maintenance') {
      if (config?.isMaintenanceMode()) {
        return
      }
      return '/'
    }

    if (config?.isMaintenanceMode()) {
      const currentUser = getAuth().currentUser
      if (currentUser != null && config.isSupport(currentUser.uid)) {
        return
      }
      return '/maintenance'
    }
  })

  router.beforeEach(async (to) => {
    if (to.path === '/maintenance') {
      return
    }
    try {
      await waitAuthentication()
      if (to.path === '/login') {
        if (to.query.redirect != null) {
          router.replace(to.query.redirect as string)
        } else {
          router.replace('/')
        }
      }
    } catch {
      await getAuth().signOut()
      if (to.path !== '/login') {
        router.push({ path: '/login', query: { redirect: to.fullPath } })
      }
    }
  })

  // イベント削除チェック
  router.beforeEach(async (to) => {
    // 注文管理ページの場合（/order/:eventId）
    const eventIdMatch = to.path.match(/^\/order\/([^/]+)\/?$/)

    if (eventIdMatch) {
      const eventId = eventIdMatch[1]
      const eventStore = useEventStore(eventId) as EventStore

      try {
        const event = await eventStore.getLoadedEvent(5000)
        if (event.is_deleted) {
          return '/404'
        }
      } catch {
        return '/404'
      }
    }
  })
}
