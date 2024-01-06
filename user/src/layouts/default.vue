<script lang="ts" setup>
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  OAuthCredential,
  User,
  UserCredential,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
} from 'firebase/auth'

import { useSkins } from '@core/composable/useSkins'
import { useThemeConfig } from '@core/composable/useThemeConfig'

// @layouts plugin
import { AppContentLayoutNav } from '@layouts/enums'

import { useStoreStoredUser } from '@/stores/storedUser'
import { useStoreCredential } from '@/stores/credential'
import { loginUser, updateCredentialFromUserCredential } from '@/composable/loginUser'

const DefaultLayoutWithHorizontalNav = defineAsyncComponent(
  () => import('./components/DefaultLayoutWithHorizontalNav.vue'),
)
const DefaultLayoutWithVerticalNav = defineAsyncComponent(() => import('./components/DefaultLayoutWithVerticalNav.vue'))

const { width: windowWidth } = useWindowSize()
const { appContentLayoutNav, switchToVerticalNavOnLtOverlayNavBreakpoint } = useThemeConfig()

// ℹ️ This will switch to vertical nav when define breakpoint is reached when in horizontal nav layout
// Remove below composable usage if you are not using horizontal nav layout in your app
switchToVerticalNavOnLtOverlayNavBreakpoint(windowWidth)

const { layoutAttrs, injectSkinClasses } = useSkins()

injectSkinClasses()

onAuthStateChanged(getAuth(), async (user: User | null) => {
  // リダイレクト結果を取得
  const userCredential = await getRedirectResult(getAuth())
  if (!userCredential && !user) {
    // ログアウト処理
    const store = useStoreStoredUser()
    store.$reset()
    useStoreCredential().$reset()
    return
  }
  if (!userCredential && user) {
    // ログイン済みのユーザーの処理
    await loginUser(user)
  }
  if (userCredential) {
    // リダイレクトでのログイン処理
    await updateCredentialFromUserCredential(userCredential)
    await loginUser(user || userCredential.user)
  }
})
</script>

<template>
  <template v-if="appContentLayoutNav === AppContentLayoutNav.Vertical">
    <DefaultLayoutWithVerticalNav v-bind="layoutAttrs" />
  </template>
  <template v-else>
    <DefaultLayoutWithHorizontalNav v-bind="layoutAttrs" />
  </template>
</template>

<style lang="scss">
// As we are using `layouts` plugin we need its styles to be imported
@use '@layouts/styles/default-layout';
</style>
