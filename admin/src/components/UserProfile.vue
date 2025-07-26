<script setup lang="ts">
import { getAuth, signOut } from 'firebase/auth'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import { mdiLogout } from '@mdi/js'
import { usePartnerStore } from '@shokujii/base/stores/_partner.js'

const auth = getAuth()
const name = ref<string | null>(null)

auth.onAuthStateChanged((user) => {
  if (user != null) {
    const partnerStore = usePartnerStore(user.uid)
    if (partnerStore.shops != null) {
      name.value = partnerStore.shops[0]?.shop_name ?? null
    } else {
      watchOnce(storeToRefs(partnerStore).shops, (shops) => {
        if (shops?.[0]?.shop_name != null) {
          name.value = shops[0].shop_name
        } else {
          name.value = null
        }
      })
    }
  } else {
    name.value = null
  }
})

const logout = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <div>
    <span class="me-4">{{ name }}</span>
    <UserAvatar :user="name" class="cursor-pointer">
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
