<script setup lang="ts">
import HomeButtonDialog from '@shokujii/base/components/HomeButtonDialog.vue'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { useUserStore, type UserStore } from '@shokujii/base/stores/user.js'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { mdiAccountOutline, mdiCartOutline, mdiLogout, mdiEmailOutline, mdiCellphoneArrowDown, mdiCog } from '@mdi/js'
import { getProfile } from '@/router/utils'

const { firebaseUser } = storeToRefs(useCurrentUserStore())

const isLogin = computed(() => firebaseUser.value?.uid != null)
const userStore = computed<UserStore | null>(() => {
  const userId = firebaseUser.value?.uid
  return userId != null ? (useUserStore(userId) as UserStore) : null
})

const user = computed(() => {
  return userStore.value?.user ?? null
})

const isOpenHomeButtonDialog = ref(false)

const isOpenLogoutDialog = ref(false)
const handleLogoutDialog = () => {
  isOpenLogoutDialog.value = true
}

const logout = async () => {
  await useCurrentUserStore().signOut()
}
</script>

<template>
  <v-badge v-if="isLogin" dot location="bottom right" offset-x="3" offset-y="3" color="success">
    <UserAvatar :user="user">
      <!-- SECTION Menu -->
      <v-menu activator="parent" width="230" location="bottom end" offset="14px">
        <v-list>
          <!-- 👉 User Avatar & Name -->
          <v-list-item>
            <template #prepend>
              <v-list-item-action start>
                <v-badge dot location="bottom right" offset-x="3" offset-y="3" color="success">
                  <UserAvatar :user="user" />
                </v-badge>
              </v-list-item-action>
            </template>

            <v-list-item-title class="font-weight-medium">{{ user?.user_name }}</v-list-item-title>
          </v-list-item>
          <v-divider class="my-2" />

          <!-- 👉 Profile -->
          <v-list-item :to="`/mypage`">
            <template #prepend>
              <v-icon class="me-2" :icon="mdiAccountOutline" size="22" />
            </template>
            <v-list-item-title>マイページ</v-list-item-title>
          </v-list-item>

          <!-- Divider -->
          <v-divider class="my-2" />

          <!-- 👉 cart -->
          <v-list-item :to="`/cart`">
            <template #prepend>
              <v-icon class="me-2" :icon="mdiCartOutline" size="22" />
            </template>
            <v-list-item-title>カート</v-list-item-title>
          </v-list-item>
          <!-- Divider -->
          <v-divider class="my-2" />

          <!-- 👉 howto -->
          <v-list-item :href="`https://forms.gle/QSuf1LNP8nR9pZbW9`" target="_blank">
            <template #prepend>
              <v-icon class="me-2" :icon="mdiEmailOutline" size="22" />
            </template>
            <v-list-item-title>お問い合わせ</v-list-item-title>
          </v-list-item>

          <!-- Divider -->
          <v-divider class="my-2" />

          <!-- 👉 Profile settings -->
          <v-list-item :to="getProfile()">
            <template #prepend>
              <v-icon class="me-2" :icon="mdiCog" size="22" />
            </template>
            <v-list-item-title>設定</v-list-item-title>
          </v-list-item>

          <!-- Divider -->
          <v-divider class="my-2" />

          <!-- 👉 homebutton -->
          <v-list-item @click="isOpenHomeButtonDialog = true">
            <template #prepend>
              <v-icon class="me-2" :icon="mdiCellphoneArrowDown" size="22" />
            </template>
            <v-list-item-title>ホーム画面に追加</v-list-item-title>
          </v-list-item>

          <!-- Divider -->
          <v-divider class="my-2" />

          <!-- 👉 Logout -->
          <v-list-item @click="handleLogoutDialog()">
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
  <confirm-dialog
    v-model="isOpenLogoutDialog"
    :is-confirm="true"
    :ok-text="$t('user_profile.logout')"
    :ok-click="logout"
  >
    <v-card-text class="text-center py-10 text-h4">
      {{ $t('user_profile.logout_modal_title') }}
    </v-card-text>
  </confirm-dialog>
  <home-button-dialog v-model="isOpenHomeButtonDialog" />
</template>
