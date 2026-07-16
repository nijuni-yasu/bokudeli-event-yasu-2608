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
import { recordLastLoginFromCredential } from '@shokujii/base/utils/lastLoginProvider.js'
import { setPendingToast } from '@shokujii/base/utils/pendingToast.js'
import {
  clearPendingLinkRequest,
  getRedirectPath,
  handleRedirect,
  isProviderIdType,
  resolveLinkageCompletedProviderId,
  setRedirectPath,
} from '@shokujii/base/utils/redirect'
import {
  rejectExistingUserOnRegister,
  rejectNewUserOnLogin,
  alertExistsCredential,
  alertProfileLinkageFailed,
  handleProfileUpdateFailure,
  signOutBestEffort,
} from './authEntryGuards.js'
import { getManageCommunityListPath } from './utils'
import { isEnterpriseUserFromClaims } from '@shokujii/base/utils/enterpriseUserClaims.js'
import { ZodError } from 'zod'

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
    paths[1] === 'chat' ||
    (paths[1] === 'c' && paths[3] === 'invites')
  )
}

type RouterTranslate = (key: string, values?: Record<string, string>) => string

const routerTranslate = (): RouterTranslate => getI18n().global.t as RouterTranslate

export const setupRouter = (router: Router) => {
  const setLinkageCompletedPendingToast = (providerId: string): void => {
    const t = routerTranslate()
    setPendingToast(
      t('profile.linkage_completed', {
        snsName: t(`sns_name['${providerId}']`),
      }),
      'success',
    )
  }

  // 初期化時かログアウト時かを識別するため、前回のユーザー状態を保持
  let lastUser: User | null = null

  router.beforeEach(async (to) => {
    // メンテ中はログイン画面も含めブロックする。サポートはメンテ開始前にログイン済みでバイパスする。
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

    // ログアウト or 初期化時の処理
    if (user === null) {
      // ログイン必須ページの場合はログインページへ
      if (isLoginRequired(path)) {
        router.replace({ path: '/login', state: { redirect: fullPath } })
        // ログイン状態 → ログアウト時のみ
      } else if (lastUser !== null) {
        router.replace('/')
      }
    }

    // 現在の状態を保存
    lastUser = user
  })

  router.afterEach((to, from) => {
    // in-app ガードで setRedirectPath 済みの /inapp-login 遷移では上書きしない（RC-9）
    if (to.path === '/inapp-login') {
      return
    }
    // 遷移先(to.path)が、ログインページまたはアプリ内ログインページの場合かつ、
    // 遷移元(from.path)が、ログインページまたはアプリ内ログインページでない場合にのみ、リダイレクトのパスを保存する
    // sessionStorageには、招待URLを考慮し、クエリパラメータも含めてfrom.fullPathで保存
    if (
      ['/login', '/register', '/inapp-login'].includes(to.path) &&
      !['/login', '/register', '/inapp-login'].includes(from.path)
    ) {
      setRedirectPath(history.state?.redirect ?? from.fullPath)
    }
  })

  // アプリ内ブラウザでログインページにアクセスした場合は専用ページにリダイレクト
  // 通常のブラウザでアプリ内ログインページにアクセスした場合は通常のログインページにリダイレクト
  const isInApp = isInAppBrowser(navigator.userAgent)
  router.beforeEach((to) => {
    if ((to.path === '/login' || to.path === '/register') && isInApp) {
      setRedirectPath((history.state?.redirect as string | undefined) ?? to.fullPath)
      return {
        path: '/inapp-login',
        query: to.query,
      }
    }
    if (to.path === '/inapp-login' && !isInApp) {
      return {
        path: getRedirectPath(false) ?? '/login',
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
    if (['/login', '/register', '/register/complete', '/profile', '/pass-code'].includes(to.path)) {
      let user = null
      let userCredential: UserCredential | null = null
      try {
        user = await waitAdminAuthentication()
        userCredential = await handleRedirect(user)
      } catch (err: unknown) {
        if (err instanceof FirebaseError && err.code === 'auth/account-exists-with-different-credential') {
          if (to.path === '/register') {
            clearPendingLinkRequest()
            const i18n = getI18n()
            window.alert(
              // @ts-expect-error i18n.global.t の型がユニオンになってしまう TODO 直し方確認
              i18n.global.t('register.already_registered'),
            )
            return { path: '/login', query: to.query }
          }
          if (to.path === '/profile') {
            clearPendingLinkRequest()
            const pendingCred = credentialFromError(err)
            alertExistsCredential(pendingCred?.providerId)
            return
          }
          const pendingCred = credentialFromError(err)
          // email が同じ時に発生するエラーなので、email は必ず存在する
          const email = err.customData!.email as string
          const methods = await fetchSignInMethodsForEmail(getAuth(), email)
          const existingProviderId = methods[0]
          if (existingProviderId == null) {
            // カスタムトークンログインを行い、メールアドレスが既に存在している場合
            const pendingProviderId = pendingCred?.providerId
            return {
              path: '/pass-code',
              state: { email, mode: 'login' },
              ...(pendingProviderId != null && isProviderIdType(pendingProviderId)
                ? { query: { pid: pendingProviderId } }
                : {}),
            }
          } else {
            return {
              path: '/login',
              query: { ...to.query, pid1: pendingCred?.providerId, pid2: existingProviderId },
            }
          }
        }
        console.error(err)
        if (to.path === '/profile') {
          clearPendingLinkRequest()
          if (err instanceof FirebaseError) {
            if (err.code === 'auth/credential-already-in-use') {
              alertExistsCredential(credentialFromError(err)?.providerId)
            } else {
              const pendingCred = credentialFromError(err)
              alertProfileLinkageFailed(pendingCred?.providerId ?? userCredential?.providerId)
            }
          } else {
            alertProfileLinkageFailed(userCredential?.providerId)
          }
          return
        }
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
        if (to.path === '/pass-code') {
          return undefined
        }
        return getRedirectPath() ?? undefined
      }

      // OAuth 復帰でない /pass-code（メール変更 OTP 等）はガード処理をスキップする
      if (to.path === '/pass-code' && userCredential == null) {
        return undefined
      }

      if (to.path === '/login' && userCredential != null) {
        const aui = getAdditionalUserInfo(userCredential)
        if (aui?.isNewUser === true) {
          try {
            await rejectNewUserOnLogin(userCredential)
          } catch (err) {
            console.error(err)
            await signOutBestEffort()
            const i18n = getI18n()
            window.alert(
              // @ts-expect-error i18n.global.t の型がユニオンになってしまう TODO 直し方確認
              i18n.global.t('login.login_fail', {
                // @ts-expect-error i18n.global.t の型がユニオンになってしまう
                sns_name: i18n.global.t(`sns_name['${userCredential.providerId}']`),
              }),
            )
            return
          }
          const i18n = getI18n()
          window.alert(
            // @ts-expect-error i18n.global.t の型がユニオンになってしまう TODO 直し方確認
            i18n.global.t('login.not_registered'),
          )
          return { path: '/register', query: to.query }
        }
      }

      if (to.path === '/register' && userCredential != null) {
        const aui = getAdditionalUserInfo(userCredential)
        if (aui?.isNewUser === false) {
          const i18n = getI18n()
          window.alert(
            // @ts-expect-error i18n.global.t の型がユニオンになってしまう TODO 直し方確認
            i18n.global.t('register.already_registered'),
          )
          try {
            await rejectExistingUserOnRegister()
          } catch (err) {
            console.error(err)
          }
          return { path: '/login', query: to.query }
        }
      }

      let shokujiiUser = null
      try {
        const response = await updateProfileFromProviders(userCredential)
        shokujiiUser = response?.data?.user ?? null
      } catch (err) {
        return await handleProfileUpdateFailure(to.path, to.query, userCredential, err)
      }

      if (shokujiiUser == null) {
        return await handleProfileUpdateFailure(to.path, to.query, userCredential)
      }

      const providerIdForToast = resolveLinkageCompletedProviderId(userCredential, to.path)
      if (providerIdForToast != null) {
        setLinkageCompletedPendingToast(providerIdForToast)
      }

      // profile に戻ってきた場合はリンクなので画面はそのまま
      if (to.path === '/profile') {
        return
      }

      if (userCredential != null) {
        recordLastLoginFromCredential(userCredential)
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

  // エンタープライズユーザーが PF 版に入らないよう暫定ガード（PA-03d / A-3）
  router.beforeEach(async (to) => {
    if (to.path === '/maintenance') {
      return
    }
    let user: User | null = null
    try {
      user = await waitAdminAuthentication()
    } catch {
      return
    }
    if (user == null) {
      return
    }
    const token = await user.getIdTokenResult()
    if (isEnterpriseUserFromClaims(token.claims)) {
      if (to.path === '/') {
        return
      }
      return { path: '/', query: { ...to.query, enterprise_blocked: '1' } }
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
      if (['/login', '/register', '/inapp-login'].includes(to.path)) {
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
    // イベントページ or イベント管理ページの場合: 削除済みイベントは404へリダイレクト
    // 例: /c/example-community/e/abc123, /manage/event/abc123
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
    // コミュニティアカウントを取得できた場合は、コミュニティ管理権限をチェック
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
