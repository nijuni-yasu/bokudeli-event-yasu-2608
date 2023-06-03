<script lang="ts" setup>
import { User, getAuth, onAuthStateChanged } from 'firebase/auth'

import { useSkins } from '@core/composable/useSkins'
import { useThemeConfig } from '@core/composable/useThemeConfig'

// @layouts plugin
import { AppContentLayoutNav } from '@layouts/enums'

import { convertFirebaseUserToStoredUser } from '@/schemes/converter'
import { db } from '@/firebase'
import { Timestamp, doc, getDoc, setDoc } from 'firebase/firestore'
import StoredUser, { FirestoredUser } from '@/schemes/storedUser'
import { useStoreStoredUser } from '@/stores/storedUser'
import { useStoreCredential } from '@/stores/credential'

const DefaultLayoutWithHorizontalNav = defineAsyncComponent(
  () => import('./components/DefaultLayoutWithHorizontalNav.vue')
)
const DefaultLayoutWithVerticalNav = defineAsyncComponent(() => import('./components/DefaultLayoutWithVerticalNav.vue'))

const { width: windowWidth } = useWindowSize()
const { appContentLayoutNav, switchToVerticalNavOnLtOverlayNavBreakpoint } = useThemeConfig()

// ℹ️ This will switch to vertical nav when define breakpoint is reached when in horizontal nav layout
// Remove below composable usage if you are not using horizontal nav layout in your app
switchToVerticalNavOnLtOverlayNavBreakpoint(windowWidth)

const { layoutAttrs, injectSkinClasses } = useSkins()

injectSkinClasses()

const convertStoredUserToFirestoredUser = (storedUser: StoredUser): FirestoredUser => {
  return {
    user_id: storedUser.userId,
    user_name: storedUser.userName,
    user_email: storedUser.userEmail,
    user_image_url: storedUser.userImageUrl,
    user_account: storedUser.userAccount,
    user_description: storedUser.userDescription,
    user_sns_facebook: storedUser.userSnsFacebook,
    user_sns_twitter: storedUser.userSnsTwitter,
    created_at: storedUser.createdAt ? Timestamp.fromDate(storedUser.createdAt) : Timestamp.now(),
    updated_at: storedUser.updatedAt ? Timestamp.fromDate(storedUser.updatedAt) : Timestamp.now(),
  }
}

onAuthStateChanged(getAuth(), async (user: User | null) => {
  const store = useStoreStoredUser()
  if (user) {
    // ログイン処理
    const storedUser = convertFirebaseUserToStoredUser(user)

    // Pinia に保存
    store.update(storedUser)

    // Firestore 保存
    const docRef = doc(db, 'users', storedUser.userId)
    const docSnap = await getDoc(docRef)
    const firestoredUser = convertStoredUserToFirestoredUser(storedUser)
    if (docSnap.exists()) {
      // FIXME: ログインされるごとに更新日時が変わってしまうため同じデータの時は更新しないようにする
      await setDoc(
        docRef,
        {
          user_email: firestoredUser.user_email,
          user_image_url: firestoredUser.user_image_url,
          user_sns_facebook: firestoredUser.user_sns_facebook,
          user_sns_twitter: firestoredUser.user_sns_twitter,
          updated_at: Timestamp.now(),
        },
        { merge: true }
      )
    } else {
      firestoredUser.created_at = Timestamp.now()
      firestoredUser.updated_at = Timestamp.now()
      await setDoc(docRef, firestoredUser)
    }
  } else {
    // ログアウト処理
    store.$reset()
    useStoreCredential().$reset()
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
