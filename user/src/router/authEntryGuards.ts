import { FirebaseError } from 'firebase/app'
import { getAdditionalUserInfo, getAuth, signOut, type UserCredential } from 'firebase/auth'
import type { LocationQuery } from 'vue-router'
import { getI18n } from '@shokujii/base/plugins/i18n/index.js'

/**
 * /login 導線で OAuth により誤って作成された Auth ユーザーを削除してサインアウトする。
 * signOut のみだと Auth 孤児が残り、2 回目以降 isNewUser=false で暗黙登録をバイパスしうる。
 * delete 失敗時は throw し、呼び出し側で拒否フローを中断する。
 */
export async function rejectNewUserOnLogin(userCredential: UserCredential): Promise<void> {
  await userCredential.user.delete()
  await signOut(getAuth())
}

/**
 * /register 導線で既存 SNS ユーザーを拒否したあと、Auth セッションを残さない。
 * 正当な既存ユーザーのため delete は行わない。
 */
export async function rejectExistingUserOnRegister(): Promise<void> {
  await signOut(getAuth())
}

/** delete 失敗など拒否フロー中断時に、ログイン済みガードへの誤遷移を防ぐ */
export async function signOutBestEffort(): Promise<void> {
  try {
    await signOut(getAuth())
  } catch (err) {
    console.error('Failed to sign out after auth entry rejection:', err)
  }
}

export const alertExistsCredential = (providerId: string | undefined) => {
  const i18n = getI18n()
  if (providerId != null) {
    window.alert(
      // @ts-expect-error i18n.global.t の型がユニオンになってしまう TODO 直し方確認
      i18n.global.t('user.exists_credential', {
        // @ts-expect-error i18n.global.t の型がユニオンになってしまう
        snsName: i18n.global.t(`sns_name['${providerId}']`),
      }),
    )
    return
  }
  window.alert(
    // @ts-expect-error i18n.global.t の型がユニオンになってしまう TODO 直し方確認
    i18n.global.t('user.exists_credential_generic'),
  )
}

export const alertProfileLinkageFailed = (providerId: string | undefined) => {
  const i18n = getI18n()
  if (providerId != null) {
    window.alert(
      // @ts-expect-error i18n.global.t の型がユニオンになってしまう TODO 直し方確認
      i18n.global.t('profile.linkage_failed', {
        // @ts-expect-error i18n.global.t の型がユニオンになってしまう
        snsName: i18n.global.t(`sns_name['${providerId}']`),
      }),
    )
    return
  }
  window.alert(
    // @ts-expect-error i18n.global.t の型がユニオンになってしまう TODO 直し方確認
    i18n.global.t('profile.linkage_failed_generic'),
  )
}

/**
 * OAuth 復帰時に updateProfileFromProviders が失敗した場合の cleanup とリダイレクト先を返す。
 * cleanup 失敗時は false を返し navigation をキャンセルする。
 * /profile では signOut せず undefined を返し、当該画面に留まる。
 */
export async function handleProfileUpdateFailure(
  toPath: string,
  query: LocationQuery,
  userCredential: UserCredential | null,
  error?: unknown,
): Promise<{ path: string; query: LocationQuery } | false | undefined> {
  try {
    if (toPath !== '/profile') {
      if (toPath === '/register' && userCredential != null) {
        const aui = getAdditionalUserInfo(userCredential)
        if (aui?.isNewUser === true) {
          await rejectNewUserOnLogin(userCredential)
        } else {
          await signOutBestEffort()
        }
      } else {
        await signOutBestEffort()
      }
    }
  } catch (err) {
    console.error(err)
    await signOutBestEffort()
    return false
  }

  const providerId = userCredential?.providerId

  if (toPath === '/profile') {
    if (userCredential != null) {
      alertProfileLinkageFailed(providerId ?? undefined)
    }
    return undefined
  }

  const i18n = getI18n()
  if (error instanceof FirebaseError && error.code === 'functions/already-exists') {
    window.alert(
      // @ts-expect-error i18n.global.t の型がユニオンになってしまう TODO 直し方確認
      i18n.global.t('register.already_registered'),
    )
    return { path: '/login', query }
  }

  if (toPath === '/register') {
    if (providerId != null) {
      window.alert(
        // @ts-expect-error i18n.global.t の型がユニオンになってしまう TODO 直し方確認
        i18n.global.t('register.register_fail', {
          // @ts-expect-error i18n.global.t の型がユニオンになってしまう
          sns_name: i18n.global.t(`sns_name['${providerId}']`),
        }),
      )
    } else {
      window.alert(
        // @ts-expect-error i18n.global.t の型がユニオンになってしまう TODO 直し方確認
        i18n.global.t('register.register_fail_generic'),
      )
    }
    return { path: '/register', query }
  }

  if (providerId != null) {
    window.alert(
      // @ts-expect-error i18n.global.t の型がユニオンになってしまう TODO 直し方確認
      i18n.global.t('login.login_fail', {
        // @ts-expect-error i18n.global.t の型がユニオンになってしまう
        sns_name: i18n.global.t(`sns_name['${providerId}']`),
      }),
    )
  } else {
    window.alert(
      // @ts-expect-error i18n.global.t の型がユニオンになってしまう TODO 直し方確認
      i18n.global.t('login.login_fail_generic'),
    )
  }
  return { path: '/login', query }
}
