<script setup lang="ts">
import HomeButtonDialog from '@/components/HomeButtonDialog.vue'
import { getAuth, signOut } from 'firebase/auth'
import { useStoreStoredUser } from '@/stores/storedUser'
import { useUserStore, type UserStore } from '@/stores/user'
import UserAvatar from '@/components/UserAvatar.vue'
import userAccessiblePaths from "@/utils/userAccessiblePaths";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import { useStoreUserAdditionalInfo } from "@/stores/userAdditionalInfo";
import { useStoreFirebaseAuthError } from "@/stores/firebaseAuthError";
import { mdiAccountOutline, mdiCartOutline, mdiLogout, mdiEmailOutline, mdiCellphoneArrowDown } from '@mdi/js'

const { storedUser } = storeToRefs(useStoreStoredUser())

const isLogin = computed(() => storedUser.value?.userId != null)
const userStore = ref<UserStore | null>(null)

watch(
    () => storedUser.value?.userId,
    (userId) => {
      if (userId != null) {
        userStore.value = useUserStore(userId) as UserStore
      } else {
        userStore.value = null
      }
    },
    { immediate: true }
)

const user = computed(() => {
  return userStore.value?.user ?? null
})

const route = useRoute()
const router = useRouter()

const login = () => {
  router.push({
    path: '/login',
    query: {
      redirect: route.path
    }
  })
}

const isOpenLogoutDialog = ref(false)
const handleLogoutDialog = () => {
  isOpenLogoutDialog.value = true
}

const logout = async () => {
  const auth = getAuth()
  try {
    useStoreUserAdditionalInfo().reset()
    useStoreFirebaseAuthError().reset()
    await signOut(auth)

    // ログインが必要なページにいる場合トップページに遷移
    if (userAccessiblePaths.includes(route.path)) router.replace('/')
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

          <!-- 👉 homebutton -->
          <v-list-item v-if="isLogin" @click="isOpenHomeButtonDialog = true">
            <template #prepend>
              <v-icon class="me-2" :icon="mdiCellphoneArrowDown" size="22" />
            </template>
            <v-list-item-title>ホーム画面に追加</v-list-item-title>
          </v-list-item>

          <!-- Divider -->
          <v-divider v-if="isLogin" class="my-2" />

          <!-- 👉 Login, Logout -->
          <v-list-item v-if="!isLogin" @click="login">
            <template #prepend>
              <v-icon class="me-2" :icon="mdiLogout" size="22" />
            </template>

            <v-list-item-title>ログイン</v-list-item-title>
          </v-list-item>
          <v-list-item v-else @click="handleLogoutDialog()">
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
  <confirm-dialog v-model="isOpenLogoutDialog" :is-confirm="true" :ok-text="$t('user_profile.logout')" :ok-click="logout">
    <v-card-text class="text-center py-10 text-h4">
      {{ $t('user_profile.logout_modal_title') }}
    </v-card-text>
  </confirm-dialog>
  <home-button-dialog v-model="isOpenHomeButtonDialog" />
</template>
