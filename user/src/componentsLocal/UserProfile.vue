<script setup lang="ts">
import LoginDialog from '@/components/LoginDialog.vue'
import { getAuth, signOut } from 'firebase/auth'
import { useStoreStoredUser } from '@/stores/storedUser'
import { useUserStore, type UserStore } from '@/stores/user'
import UserAvatar from '@/components/UserAvatar.vue'
import { mdiAccountOutline, mdiCartOutline, mdiLogout, mdiEmailOutline  } from '@mdi/js'

const { storedUser } = storeToRefs(useStoreStoredUser())

const isLogin = computed(() => storedUser.value?.userId != null)
const user = computed(() => {
  const userId = storedUser.value?.userId
  return userId == null ? null : (useUserStore(userId) as UserStore).user
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
  <v-badge dot location="bottom right" offset-x="3" offset-y="3" color="success">
    <UserAvatar :user="user" class="cursor-pointer">
      <!-- SECTION Menu -->
      <v-menu activator="parent" width="230" location="bottom end" offset="14px">
        <v-list>
          <!-- 👉 User Avatar & Name -->
          <v-list-item v-if="isLogin">
            <template #prepend>
              <v-list-item-action start>
                <v-badge dot location="bottom right" offset-x="3" offset-y="3" color="success">
                  <UserAvatar :user="user" />
                </v-badge>
              </v-list-item-action>
            </template>

            <v-list-item-title class="font-weight-medium">{{ user?.user_name }}</v-list-item-title>
          </v-list-item>
          <v-divider v-if="isLogin" class="my-2" />

          <!-- 👉 Profile -->
          <v-list-item v-if="isLogin" :to="`/mypage`">
            <template #prepend>
              <v-icon class="me-2" :icon="mdiAccountOutline" size="22" />
            </template>
            <v-list-item-title>マイページ</v-list-item-title>
          </v-list-item>

          <!-- Divider -->
          <v-divider v-if="isLogin" class="my-2" />

          <!-- 👉 cart -->
          <v-list-item v-if="isLogin" :to="`/cart`">
            <template #prepend>
              <v-icon class="me-2" :icon="mdiCartOutline" size="22" />
            </template>
            <v-list-item-title>カート</v-list-item-title>
          </v-list-item>
          <!-- Divider -->
          <v-divider v-if="isLogin" class="my-2" />

          <!-- 👉 howto -->
          <v-list-item v-if="isLogin" :href="`https://forms.gle/QSuf1LNP8nR9pZbW9`" target="_blank">
            <template #prepend>
              <v-icon class="me-2" :icon="mdiEmailOutline" size="22" />
            </template>
            <v-list-item-title>お問い合わせ</v-list-item-title>
          </v-list-item>

          <!-- Divider -->
          <v-divider v-if="isLogin" class="my-2" />

          <!-- 👉 Login, Logout -->
          <v-list-item v-if="!isLogin" @click="isOpenLoginDialog = true">
            <template #prepend>
              <v-icon class="me-2" :icon="mdiLogout" size="22" />
            </template>

            <v-list-item-title>ログイン</v-list-item-title>
          </v-list-item>
          <v-list-item v-else @click="logout()">
            <template #prepend>
              <v-icon class="me-2" :icon="mdiLogout" size="22" />
            </template>
            <v-list-item-title>ログアウト</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <!-- !SECTION -->
    </UserAvatar>
  </v-badge>
  <login-dialog v-model="isOpenLoginDialog" />
</template>
