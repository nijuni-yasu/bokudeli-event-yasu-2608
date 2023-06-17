<script setup lang="ts">
import avatar1 from '@images/avatars/avatar-1.png'
import LoginDialog from '@/components/LoginDialog.vue'
import { getAuth, signOut } from 'firebase/auth'
import { useStoreStoredUser } from '@/stores/storedUser'
import { useStoreCredential } from '@/stores/credential'

const { storedUser } = storeToRefs(useStoreStoredUser())

const userId = computed(() => storedUser?.value?.userId ?? '')
const isLogin = computed(() => userId.value !== '')
const userName = computed(() => storedUser?.value?.userName ?? 'ゲスト')
const avatar = computed(() => {
  if (storedUser?.value?.userImageUrl) {
    const store = useStoreCredential()
    const baseUrl = storedUser.value.userImageUrl + '?width=40&height=40'
    const accessTokenQuery = store.credential?.accessToken ? '&access_token=' + store.credential.accessToken : ''
    return baseUrl + accessTokenQuery
  } else {
    return avatar1
  }
})

const isOpenLoginDialog = ref(false)

const logout = async () => {
  const auth = getAuth()
  try {
    await signOut(auth)
  } catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <div>
    <v-badge dot location="bottom right" offset-x="3" offset-y="3" color="success">
      <v-avatar class="cursor-pointer" color="primary" variant="tonal">
        <v-img :src="avatar" />

        <!-- SECTION Menu -->
        <v-menu activator="parent" width="230" location="bottom end" offset="14px">
          <v-list>
            <!-- 👉 User Avatar & Name -->
            <v-list-item>
              <template #prepend>
                <v-list-item-action start>
                  <v-badge dot location="bottom right" offset-x="3" offset-y="3" color="success">
                    <v-avatar color="primary" variant="tonal">
                      <v-img :src="avatar" />
                    </v-avatar>
                  </v-badge>
                </v-list-item-action>
              </template>

              <v-list-item-title class="font-weight-medium">{{ userName }}</v-list-item-title>
            </v-list-item>
            <v-divider class="my-2" />

            <!-- 👉 Profile -->
            <v-list-item v-if="isLogin" :to="`/mypage`">
              <template #prepend>
                <v-icon class="me-2" icon="mdi-account-outline" size="22" />
              </template>
              <v-list-item-title>プロフィール</v-list-item-title>
            </v-list-item>

            <!-- Divider -->
            <v-divider v-if="isLogin" class="my-2" />

            <!-- 👉 Login, Logout -->
            <v-list-item v-if="!isLogin" @click="isOpenLoginDialog = true">
              <template #prepend>
                <v-icon class="me-2" icon="mdi-logout" size="22" />
              </template>

              <v-list-item-title>ログイン</v-list-item-title>
            </v-list-item>
            <v-list-item v-else @click="logout()">
              <template #prepend>
                <v-icon class="me-2" icon="mdi-logout" size="22" />
              </template>
              <v-list-item-title>ログアウト</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <!-- !SECTION -->
      </v-avatar>
    </v-badge>
    <login-dialog v-model="isOpenLoginDialog" />
  </div>
</template>
