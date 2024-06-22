<script setup lang="ts">
import { getAuth, signOut } from 'firebase/auth'
import UserAvatar from '@/components/UserAvatar.vue'
import { mdiLogout } from '@mdi/js'

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
    <UserAvatar :user="null" class="cursor-pointer">
      <v-menu activator="parent" width="230" location="bottom end" offset="14px">
        <v-list>
          <v-list-item @click="logout()">
            <template #prepend>
              <v-icon class="me-2" :icon="mdiLogout" size="22" />
            </template>
            <v-list-item-title>{{ $t('logout') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </UserAvatar>
  </div>
</template>
