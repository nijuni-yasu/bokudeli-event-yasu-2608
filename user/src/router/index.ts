import { type User, getAuth, onAuthStateChanged } from 'firebase/auth'
import type { Router } from 'vue-router'
import { useEventStore, type EventStore } from '@shokujii/base/stores/event.js'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { useCommunityStore, type CommunityStore } from '@shokujii/base/stores/community.js'
import { getLogin, getManageCommunityListPath } from './utils'

import * as ChannelService from '@channel.io/channel-web-sdk-loader'
import { useConfigStore } from '@shokujii/base/stores/config.js'
import { FIRESTORE_LOADING } from '@shokujii/base/utils/const.js'

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
  return ['/profile', '/register/complete', '/register/email'].includes(path) || paths[1] === 'manage'
}

export const setupRouter = (router: Router) => {
  onAuthStateChanged(getAuth(), (user) => {
    const path = router.currentRoute.value.path
    if (user == null && isLoginRequired(path)) {
      router.replace('/')
    }
  })

  // Docs: https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
  router.beforeEach(async (to) => {
    let user: User | null = null
    try {
      user = await waitAdminAuthentication()
    } catch {
      // Do nothing
    }

    // ユーザーがログイン済みか否かでリダイレクト
    if (user == null && isLoginRequired(to.path)) {
      return {
        path: '/',
      }
    }
    if (to.path === getLogin() && user != null) {
      return {
        path: '/',
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
    if (to.path.startsWith('/manage/event/')) {
      const eventId = to.params.eventId as string
      const eventStore = useEventStore(eventId) as EventStore
      const event = await new Promise<BokudeliEvent>((resolve) => {
        watch(
          () => eventStore.event,
          (event) => {
            if (event != null) {
              resolve(event)
            }
          },
          { immediate: true },
        )
      })
      communityAccount = event.community_account
    } else if (to.path.startsWith('/manage/community/')) {
      communityAccount = to.params.communityAccount as string
    }

    if (communityAccount != null) {
      const configStore = useConfigStore()
      const communityStore = useCommunityStore(communityAccount) as CommunityStore
      const canView = await new Promise<boolean>((resolve) => {
        watch(
          () => [configStore.config, communityStore.community, communityStore.members],
          () => {
            if (
              configStore.config !== FIRESTORE_LOADING &&
              configStore.config?.isSupport(getAuth().currentUser?.uid as string) === true
            ) {
              resolve(true)
              return
            }
            const community = communityStore.community
            const members = communityStore.members
            if (community != null && members != null && members.length === community.members.length) {
              const canView = members.some(
                (member) => member?.user_id === getAuth().currentUser?.uid && member?.roles?.includes('manager'),
              )
              resolve(canView)
            }
          },
          { immediate: true },
        )
      })
      return canView ? true : { path: getManageCommunityListPath() }
    }
  })

  // 管理ページ以下にチャネルトークのボタンを表示する
  router.beforeEach((to) => {
    const paths = to.path.split('/')
    if (paths.length > 1 && paths[1] === 'manage') {
      ChannelService.showChannelButton()
    } else {
      ChannelService.hideChannelButton()
    }
  })
}
