import { FirebaseError } from 'firebase/app'
import {
  type User,
  type UserCredential,
  fetchSignInMethodsForEmail,
  getAdditionalUserInfo,
  getAuth,
  onAuthStateChanged,
} from 'firebase/auth'
import type { Router } from 'vue-router'
import * as ChannelService from '@channel.io/channel-web-sdk-loader'
import { getI18n } from '@shokujii/base/plugins/i18n/index.js'
import { useCommunityStore, type CommunityStore } from '@shokujii/base/stores/community.js'
import { useConfigStore } from '@shokujii/base/stores/config.js'
import { useEventStore, type EventStore, type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { FIRESTORE_LOADING } from '@shokujii/base/utils/const.js'
import { isInAppBrowser } from '@shokujii/base/utils/browser'
import { credentialFromError, updateProfileFromProviders } from '@shokujii/base/utils/providerService'
import { getRedirectPath, handleRedirect, setRedirectPath } from '@shokujii/base/utils/redirect'
import { getManageCommunityListPath } from './utils'

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
    ['/profile', '/register/complete', '/register/email'].includes(path) ||
    paths[1] === 'manage' ||
    (paths[1] === 'c' && paths[3] === 'invites')
  )
}

export const setupRouter = (router: Router) => {
  // ログイン状態の変化を監視
  onAuthStateChanged(getAuth(), (user) => {
    const path = router.currentRoute.value.path
    const fullPath = router.currentRoute.value.fullPath

    // ログアウト時の処理
    if (user == null) {
      // ログイン必須ページの場合はログインページへ
      if (isLoginRequired(path)) {
        router.replace({ path: '/login', state: { redirect: fullPath } })
      } else {
        router.replace('/')
      }
    }
  })

  router.afterEach((to, from) => {
    // 遷移先(to.path)が、ログインページまたはアプリ内ログインページの場合かつ、
    // 遷移元(from.path)が、ログインページまたはアプリ内ログインページでない場合にのみ、リダイレクトのパスを保存する
    // sessionStorageには、招待URLを考慮し、クエリパラメータも含めてfrom.fullPathで保存
    if (['/login', '/inapp-login'].includes(to.path) && !['/login', '/inapp-login'].includes(from.path)) {
      setRedirectPath(history.state?.redirect ?? from.fullPath)
    }
  })

  // アプリ内ブラウザでログインページにアクセスした場合は専用ページにリダイレクト
  // 通常のブラウザでアプリ内ログインページにアクセスした場合は通常のログインページにリダイレクト
  const isInApp = isInAppBrowser(navigator.userAgent)
  router.beforeEach((to) => {
    if (to.path === '/login' && isInApp) {
      return {
        path: '/inapp-login',
        query: to.query,
      }
    }
    if (to.path === '/inapp-login' && !isInApp) {
      return {
        path: '/login',
        query: to.query,
      }
    }
  })

  // Docs: https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
  let isFirstTime = true
  router.beforeEach(async (to) => {
    if (!isFirstTime) {
      return
    }
    isFirstTime = false

    // リダイレクトで戻ってきた場合の処理
    // TODO リダイレクトの返りは一つのページにまとめた方がよいかもしれない
    if (['/login', '/register/complete', '/profile'].includes(to.path)) {
      let user = null
      let userCredential: UserCredential | null = null
      try {
        user = await waitAdminAuthentication()
        userCredential = await handleRedirect(user)
      } catch (err: unknown) {
        if (err instanceof FirebaseError && err.code === 'auth/account-exists-with-different-credential') {
          const pendingCred = credentialFromError(err)
          // email が同じ時に発生するエラーなので、email は必ず存在する
          const email = err.customData!.email as string
          const methods = await fetchSignInMethodsForEmail(getAuth(), email)
          const existingProviderId = methods[0]
          if (existingProviderId == null) {
            // カスタムトークンログインを行い、メールアドレスが既に存在している場合
            return {
              path: '/pass-code',
              state: { email },
            }
          } else {
            return {
              path: '/login',
              query: { ...to.query, pid1: pendingCred?.providerId, pid2: existingProviderId },
            }
          }
        }
        console.error(err)
        // 今のところ router からは notification を出せないので window.alert で代用
        // useI18n() は plugin の中からは使えないので、 getI18n で直接取得する
        const i18n = getI18n()
        if (err instanceof FirebaseError) {
          const pendingCred = credentialFromError(err)
          if (err.code === 'auth/credential-already-in-use') {
            window.alert(
              // @ts-expect-error i18n.global.t の型がユニオンになってしまう TODO 直し方確認
              i18n.global.t('user.exists_credential', {
                // @ts-expect-error i18n.global.t の型がユニオンになってしまう
                snsName: i18n.global.t(`sns_name['${pendingCred.providerId}']`),
              }),
            )
          } else {
            window.alert(
              // @ts-expect-error i18n.global.t の型がユニオンになってしまう
              i18n.global.t('login.login_fail', { sns_name: i18n.global.t(`sns_name['${pendingCred.providerId}']`) }),
            )
          }
        } else {
          window.alert('Error')
        }
        return
      }

      // 未ログインのときは無駄な通信が発生するのでここで終了
      // userCredential は null でも意味がある（passcode の初回ログイン時など）
      if (user == null) {
        return getRedirectPath() ?? undefined
      }

      let shokujiiUser = null
      try {
        const response = await updateProfileFromProviders(userCredential).catch((error) => {
          console.error('updateProfileFromProviders error:', error)
        })
        shokujiiUser = response?.data?.user
      } catch (err) {
        console.error(err)
      }

      if (shokujiiUser == null) {
        return getRedirectPath() ?? '/'
      }

      // profile に戻ってきた場合はリンクなので画面はそのまま
      if (to.path === '/profile') {
        return
      }

      // メールアドレスが無い場合はメールアドレス設定へ
      if (!shokujiiUser.user_email) {
        return {
          path: '/register/email',
        }
      }

      let isNewUser = history.state?.isNewUser ?? false
      // プロフィールが埋まっていても新規ユーザーのときだけ動作を変える
      if (userCredential != null) {
        const aui = getAdditionalUserInfo(userCredential)
        isNewUser ||= aui?.isNewUser ?? false
      }

      // プロフィール名かアイコンが設定されていなければ、登録完了（プロフィール登録誘導）へ
      if (!shokujiiUser.user_name || !shokujiiUser.user_image_url) {
        return {
          path: '/register/complete',
          state: { isNewUser },
        }
      }

      if (isNewUser) {
        return {
          path: '/profile',
          state: { isNewUser },
        }
      }
      // 元いたページへ
      return getRedirectPath() ?? '/'
    }
  })

  // ログイン状態に応じてページアクセスを制御
  // 未ログインユーザーはログイン必須ページからリダイレクト
  // ログイン済みユーザーはログインページ/アプリ内ログインページからリダイレクト
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
    } else {
      if (['/login', '/inapp-login'].includes(to.path)) {
        return (to.query?.redirect as string) ?? '/'
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
