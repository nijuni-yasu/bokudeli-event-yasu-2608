import { type User, getAuth } from 'firebase/auth'
import type { Router } from 'vue-router'

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
}
