<script lang="ts" setup>
import { GoogleAuthProvider, User, getAuth, getRedirectResult, onAuthStateChanged } from 'firebase/auth'

import { useSkins } from '@core/composable/useSkins'
import { useThemeConfig } from '@core/composable/useThemeConfig'

// @layouts plugin
import { AppContentLayoutNav } from '@layouts/enums'

import {
  convertDocumentDataToStoredUser,
  convertFirebaseUserToStoredUser,
  convertStoredUserToFirestoredUser,
} from '@/schemes/converter'
import { db } from '@/firebase'
import { Timestamp, doc, getDoc, setDoc } from 'firebase/firestore'
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

const router = useRouter()

const fetchRedirectResult = async () => {
  try {
    const result = await getRedirectResult(getAuth())
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result)
      if (credential) {
        const store = useStoreCredential()
        store.update(credential)
      }
    }
  } catch (error) {
    console.error('Error fetching redirect result:', error)
  }
}

onAuthStateChanged(getAuth(), async (user: User | null) => {
  fetchRedirectResult()

  const store = useStoreStoredUser()
  if (user) {
    // ログイン処理
    const storedUser = await convertFirebaseUserToStoredUser(user)

    const docRef = doc(db, 'users', storedUser.userId)
    const docSnap = await getDoc(docRef)

    // Pinia のデータを更新
    const currentStoredUser = convertDocumentDataToStoredUser(docSnap.data())
    store.update(currentStoredUser)

    // Firestore 保存
    const firestoredUser = convertStoredUserToFirestoredUser(storedUser)

    if (docSnap.exists()) {
      // 既にユーザーが存在する場合は更新
      // FIXME: ログインされるごとに更新日時が変わってしまうため同じデータの時は更新しないようにする
      await setDoc(
        docRef,
        {
          user_email: firestoredUser.user_email,
          updated_at: Timestamp.now(),
        },
        { merge: true }
      )
    } else {
      // Pinia に保存
      store.update(storedUser)

      // ユーザーが存在しない場合は新規作成
      firestoredUser.created_at = Timestamp.now()
      firestoredUser.updated_at = Timestamp.now()
      await setDoc(docRef, firestoredUser)

      // 新規ユーザーはマイページに遷移
      router.push('/mypage')
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
