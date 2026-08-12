import { type User, getAuth, onAuthStateChanged } from 'firebase/auth'
import type { Router } from 'vue-router'
import * as ChannelService from '@channel.io/channel-web-sdk-loader'
import { useEnterpriseCommunityStore } from '@/composable/useEnterpriseCommunityStore'
import { useConfigStore } from '@shokujii/base/stores/config.js'
import {
  useEventStore,
  buildEventStoreOptions,
  type EventStore,
  type BokudeliEvent,
} from '@shokujii/base/stores/event.js'
import { FIRESTORE_LOADING } from '@shokujii/base/utils/const.js'
import { setRedirectPath } from '@shokujii/base/utils/redirect'
import { getManageCommunityListPath } from './utils'
import { ZodError } from 'zod'
import { setPendingToast } from '@/utils/pendingToast'
import { useEnterpriseStore } from '@/stores/enterprise'
import { isLoginRequired } from '@/router/authGuards.js'
import {
  ensureEnterpriseTenantConsistent,
  waitEnterpriseAuthentication,
} from '@/utils/ensureEnterpriseTenantConsistent'
import { evaluateManageCommunityCanView, MANAGE_COMMUNITY_GUARD_TIMEOUT_MS } from '@/router/manageCommunityCanView.js'

const EVENT_GUARD_LOAD_TIMEOUT_MS = 8000

async function loadEventForRouteGuard(eventStore: EventStore): Promise<BokudeliEvent> {
  try {
    return await eventStore.getLoadedEvent(EVENT_GUARD_LOAD_TIMEOUT_MS)
  } catch (first) {
    if (first instanceof ZodError) {
      throw first
    }
    return await eventStore.getLoadedEvent(EVENT_GUARD_LOAD_TIMEOUT_MS)
  }
}

export const setupRouter = (router: Router) => {
  let lastUser: User | null = null

  router.beforeEach(async (to) => {
    await waitEnterpriseAuthentication()

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
      user = await waitEnterpriseAuthentication()
    } catch {
      // Do nothing
    }
    if (user == null) {
      if (isLoginRequired(to.path)) {
        return { path: '/login', state: { redirect: to.fullPath } }
      }
    } else if (to.path === '/login') {
      return (to.query?.redirect as string) ?? '/'
    } else if (isLoginRequired(to.path)) {
      const tenantOk = await ensureEnterpriseTenantConsistent(user)
      if (!tenantOk) {
        return { path: '/404' }
      }
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
      const enterpriseStore = useEnterpriseStore()
      const enterpriseId = enterpriseStore.enterprise?.enterprise_id
      const eventStore = useEventStore(eventId, buildEventStoreOptions(enterpriseId)) as EventStore
      let event: BokudeliEvent
      try {
        event = await loadEventForRouteGuard(eventStore)
        if (event.is_deleted) {
          return '/404'
        }
        if (enterpriseId != null && event.enterprise_id != null && event.enterprise_id !== enterpriseId) {
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
      const communityStore = useEnterpriseCommunityStore(communityAccount)
      const canView = await new Promise<boolean>((resolve) => {
        let settled = false
        let unwatch: (() => void) | undefined

        const finish = (value: boolean) => {
          if (settled) {
            return
          }
          settled = true
          unwatch?.()
          window.clearTimeout(timeoutId)
          resolve(value)
        }

        const timeoutId = window.setTimeout(() => finish(false), MANAGE_COMMUNITY_GUARD_TIMEOUT_MS)

        unwatch = watch(
          () => [configStore.config, communityStore.community],
          () => {
            const config = configStore.config
            const currentUserId = getAuth().currentUser?.uid
            const enterpriseStore = useEnterpriseStore()
            const enterpriseId = enterpriseStore.enterprise?.enterprise_id
            const result = evaluateManageCommunityCanView({
              config,
              community: communityStore.community,
              currentUserId,
              enterpriseId,
              isSupport: config !== FIRESTORE_LOADING && config?.isSupport(currentUserId as string) === true,
            })
            if (result != null) {
              finish(result)
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

    const configStore = useConfigStore()
    const config = await configStore.getResolvedConfig()
    const isSupport = config?.isSupport(user.uid) ?? false
    if (!isSupport) {
      const tenantOk = await ensureEnterpriseTenantConsistent(user)
      if (!tenantOk) {
        setPendingToast('管理者権限が必要です', 'error')
        return { path: '/' }
      }
    }
  })
}
