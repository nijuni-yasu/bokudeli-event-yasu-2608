import { type User, getAuth } from 'firebase/auth'
import type { Router } from 'vue-router'
import { useEventStore, type EventStore } from '@shokujii/base/stores/event.js'

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

  router.beforeEach(async (to) => {
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
