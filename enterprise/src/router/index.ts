import { type User, getAuth, onAuthStateChanged } from 'firebase/auth'
import type { Router } from 'vue-router'
import * as ChannelService from '@channel.io/channel-web-sdk-loader'
import { useCommunityStore, type CommunityStore } from '@shokujii/base/stores/community.js'
import { useConfigStore } from '@shokujii/base/stores/config.js'
import { useEventStore, type EventStore, type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { FIRESTORE_LOADING } from '@shokujii/base/utils/const.js'
import { setRedirectPath } from '@shokujii/base/utils/redirect'
import { getManageCommunityListPath } from './utils'
import { ZodError } from 'zod'
import { setPendingToast } from '@/utils/pendingToast'

const waitAdminAuthentication = async (): Promise<User | null> => {
  return new Promise<User | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (user: User | null) => {
      unsubscribe()
      resolve(user)
    })
  })
}

const isLoginRequired = (path: string) => {
  const paths = path.split('/')
  return (
    path === '/profile' || paths[1] === 'manage' || paths[1] === 'admin' || (paths[1] === 'c' && paths[3] === 'invites')
  )
}

export const setupRouter = (router: Router) => {
  let lastUser: User | null = null

  router.beforeEach(async (to) => {
    await waitAdminAuthentication()

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

  onAuthStateChanged(getAuth(), (user) => {
    const path = router.currentRoute.value.path
    const fullPath = router.currentRoute.value.fullPath

    if (user === null) {
      if (isLoginRequired(path)) {
        router.replace({ path: '/login', state: { redirect: fullPath } })
      } else if (lastUser !== null) {
        router.replace('/')
      }
    }

    lastUser = user
  })

  router.afterEach((to, from) => {
    if (to.path === '/login' && from.path !== '/login') {
      setRedirectPath(history.state?.redirect ?? from.fullPath)
    }
  })

  router.beforeEach(async (to) => {
    let user: User | null = null
    try {
      user = await waitAdminAuthentication()
    } catch {
      // Do nothing
    }
    if (user == null) {
      if (isLoginRequired(to.path)) {
        return { path: '/login', state: { redirect: to.fullPath } }
      }
    } else if (to.path === '/login') {
      return (to.query?.redirect as string) ?? '/'
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

  router.beforeEach(async (to) => {
    let communityAccount: string | null = null
    const eventIdMatch = to.path.match(/\/c\/[^/]+\/e\/([^/]+)/) || to.path.match(/\/manage\/event\/([^/]+)/)
    if (eventIdMatch) {
      const eventId = eventIdMatch[1]
      const eventStore = useEventStore(eventId) as EventStore
      let event: BokudeliEvent
      try {
        event = await eventStore.getLoadedEvent(5000)
        if (event.is_deleted) {
          return '/404'
        }
      } catch (err) {
        if (err instanceof ZodError) {
          return '/520'
        }
        return '/404'
      }
      if (to.path.startsWith('/manage/event/')) {
        communityAccount = event.community_account
      }
    } else if (to.path.startsWith('/manage/community/')) {
      communityAccount = to.params.communityAccount as string
    }
    if (communityAccount != null) {
      const configStore = useConfigStore()
      const communityStore = useCommunityStore(communityAccount) as CommunityStore
      const canView = await new Promise<boolean>((resolve) => {
        let unwatch: (() => void) | undefined
        unwatch = watch(
          () => [configStore.config, communityStore.community],
          () => {
            if (
              configStore.config !== FIRESTORE_LOADING &&
              configStore.config?.isSupport(getAuth().currentUser?.uid as string) === true
            ) {
              unwatch?.()
              resolve(true)
              return
            }
            const community = communityStore.community
            const currentUserId = getAuth().currentUser?.uid

            if (community != null && currentUserId != null) {
              const canView = community.managers.some((managerRef) => managerRef.id === currentUserId)
              unwatch?.()
              resolve(canView)
            }
          },
          { immediate: true },
        )
      })
      return canView ? true : { path: getManageCommunityListPath() }
    }
  })

  router.beforeEach((to) => {
    const paths = to.path.split('/')
    if (paths.length > 1 && paths[1] === 'manage') {
      ChannelService.showChannelButton()
    } else {
      ChannelService.hideChannelButton()
    }
  })

  router.beforeEach(async (to) => {
    if (!to.path.startsWith('/admin')) {
      return
    }

    const user = getAuth().currentUser
    if (user == null) {
      return { path: '/login', state: { redirect: to.fullPath } }
    }

    const tokenResult = await user.getIdTokenResult()
    if (tokenResult.claims.enterprise_role !== 'admin') {
      setPendingToast('管理者権限が必要です', 'error')
      return { path: '/' }
    }
  })
}
