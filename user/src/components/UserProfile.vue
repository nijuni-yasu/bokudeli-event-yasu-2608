<script setup lang="ts">
import HomeButtonDialog from '@shokujii/base/components/HomeButtonDialog.vue'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { useUserStore, type UserStore } from '@shokujii/base/stores/user.js'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import {
  mdiCartOutline,
  mdiCogOutline,
  mdiLogout,
  mdiEmailOutline,
  mdiCellphoneArrowDown,
  mdiReceiptText,
} from '@mdi/js'
import { useRoute } from 'vue-router'
import { getProfile, getOrdersPath } from '@/router/utils'

const route = useRoute()
const { firebaseUser } = storeToRefs(useCurrentUserStore())

const isLogin = computed(() => firebaseUser.value?.uid != null)
const userStore = computed<UserStore | null>(() => {
  const userId = firebaseUser.value?.uid
  return userId != null ? (useUserStore(userId) as UserStore) : null
})

const user = computed(() => {
  return userStore.value?.user ?? null
})

const ordersTabPath = computed(() => getOrdersPath())

const isOrdersTabActive = computed(() => route.path === '/orders')

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
  <UserAvatar v-if="isLogin" :user="user">
    <!-- SECTION Menu -->
    <v-menu activator="parent" width="230" location="bottom end" offset="14px">
      <v-list>
        <!-- 👉 User Avatar & Name（マイページへ） -->
        <v-list-item :to="`/mypage`">
          <template #prepend>
            <v-list-item-action start>
              <UserAvatar :user="user" />
            </v-list-item-action>
          </template>

          <v-list-item-title class="text-h5">{{ user?.user_name }}</v-list-item-title>
        </v-list-item>
        <v-divider class="my-2" />

        <!-- 👉 cart -->
        <v-list-item :to="`/cart`">
          <template #prepend>
            <v-icon class="me-2" :icon="mdiCartOutline" size="22" />
          </template>
          <v-list-item-title>{{ $t('user_profile.cart') }}</v-list-item-title>
        </v-list-item>

        <v-divider class="my-2" />

        <!-- 👉 Order history -->
        <v-list-item :to="ordersTabPath" :active="isOrdersTabActive">
          <template #prepend>
            <v-icon class="me-2" :icon="mdiReceiptText" size="22" />
          </template>
          <v-list-item-title>{{ $t('user_profile.tab_orders') }}</v-list-item-title>
        </v-list-item>

        <v-divider class="my-2" />

        <!-- 👉 Profile edit -->
        <v-list-item :to="getProfile()">
          <template #prepend>
            <v-icon class="me-2" :icon="mdiCogOutline" size="22" />
          </template>
          <v-list-item-title>{{ $t('user_profile.profile_settings') }}</v-list-item-title>
        </v-list-item>

        <v-divider class="my-2" />

        <!-- 👉 homebutton -->
        <v-list-item @click="isOpenHomeButtonDialog = true">
          <template #prepend>
            <v-icon class="me-2" :icon="mdiCellphoneArrowDown" size="22" />
          </template>
          <v-list-item-title>{{ $t('user_profile.add_to_home_screen') }}</v-list-item-title>
        </v-list-item>

        <v-divider class="my-2" />

        <!-- 👉 contact -->
        <v-list-item :href="`https://forms.gle/QSuf1LNP8nR9pZbW9`" target="_blank" rel="noopener noreferrer">
          <template #prepend>
            <v-icon class="me-2" :icon="mdiEmailOutline" size="22" />
          </template>
          <v-list-item-title>{{ $t('user_profile.contact') }}</v-list-item-title>
        </v-list-item>

        <v-divider class="my-2" />

        <!-- 👉 Logout -->
        <v-list-item @click="handleLogoutDialog()">
          <template #prepend>
            <v-icon class="me-2" :icon="mdiLogout" size="22" />
          </template>
          <v-list-item-title>{{ $t('user_profile.logout_menu') }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <!-- !SECTION -->
  </UserAvatar>
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
