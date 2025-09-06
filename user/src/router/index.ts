import {
  type User,
  type UserCredential,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  type Unsubscribe,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { loginUser } from '@shokujii/base/composable/loginUser.js'
import type { Router } from 'vue-router'
import userAccessiblePaths from '@shokujii/base/utils/userAccessiblePaths.js'
import { useEventStore, type EventStore } from '@shokujii/base/stores/event.js'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { useCommunityStore, type CommunityStore } from '@shokujii/base/stores/community.js'
import { getLogin, getManageCommunityListPath } from './utils'

import * as ChannelService from '@channel.io/channel-web-sdk-loader'
import { useConfigStore } from '@shokujii/base/stores/config.js'
import { FIRESTORE_LOADING } from '@shokujii/base/utils/const.js'

const checkUser = async (user: User | null) => {
  // リダイレクト結果を取得
  let userCredential: UserCredential | null = null
  try {
    userCredential = await getRedirectResult(getAuth())
  } catch (error) {
    if (error instanceof FirebaseError) {
      useCurrentUserStore().setLastFirebaseError(error)
    } else {
      window.alert('ログインに失敗しました')
      console.error('Error fetching redirect result:', { error })
    }
  }
  const currentUserStore = useCurrentUserStore()
  if (!userCredential && !user) {
    // ログアウト処理
    currentUserStore.signOut()
    return
  }
  if (!userCredential && user) {
    // ログイン済みのユーザーの処理
    await loginUser(user)
  }
  if (userCredential) {
    // リダイレクトでのログイン処理
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

  // ユーザーがログイン済みか否かでリダイレクト
  router.beforeEach((to) => {
    const currentUserStore = useCurrentUserStore()

    if (userAccessiblePaths.includes(to.path) && currentUserStore.firebaseUser == null) {
      router.replace('/')
    }
    if (
      to.path === getLogin() &&
      currentUserStore.firebaseUser != null &&
      currentUserStore.additionalUserInfo === null
    ) {
      router.replace('/')
    }
  })

  let unsubscribeAuthStateChanged: Unsubscribe | null
  router.beforeEach((to) => {
    unsubscribeAuthStateChanged?.()
    const paths = to.path.split('/')
    if (paths[1] === 'manage') {
      if (getAuth().currentUser?.uid == null) {
        return {
          path: '/',
        }
      } else {
        unsubscribeAuthStateChanged = onAuthStateChanged(getAuth(), (user) => {
          if (user == null) {
            router.push('/')
          }
        })
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
              if (members.some((member) => member?.roles == null)) {
                return
              }
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
