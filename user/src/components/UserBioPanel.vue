<script setup lang="ts">
import StoredUser from '@/schemes/storedUser'
import { useStoreCredential } from '@/stores/credential'

const props = defineProps<{ userData: StoredUser }>()
const userData = computed(() => props.userData)

const avatar = computed(() => {
  if (userData?.value?.userImageUrl) {
    const store = useStoreCredential()
    const baseUrl = userData.value.userImageUrl + '?width=200&height=200'
    const accessTokenQuery = store.credential?.accessToken ? '&access_token=' + store.credential.accessToken : ''
    return baseUrl + accessTokenQuery
  } else {
    return null
  }
})

const userName = computed(() => userData?.value?.userName ?? 'ゲスト')
</script>

<template>
  <v-row class="user-bio-panel">
    <!-- user profile -->
    <v-col cols="12">
      <v-card class="pt-10">
        <v-card-title class="d-flex align-center flex-column">
          <v-avatar
            :color="avatar ? '' : 'primary'"
            :class="avatar ? '' : 'v-avatar-light-bg primary--text'"
            size="200"
            rounded
            class="mb-4"
          >
            <v-img v-if="avatar" :src="avatar"></v-img>
            <span v-else class="font-weight-semibold text-5xl">{{ userName }}</span>
          </v-avatar>

          <span class="mb-2">{{ userName }}</span>

          <!-- <v-list>
            <v-list-item dense class="px-0 mb-n2">
              <span class="font-weight-medium text-no-wrap me-2">Twitter:</span>
              <span class="text--secondary">{{ userName }}</span>
            </v-list-item>
            <v-list-item dense class="px-0 mb-n2">
              <span class="font-weight-medium text-no-wrap me-2">Facebook:</span>
              <span class="text--secondary">{{ userName }}</span>
            </v-list-item>
            <v-list-item dense class="px-0 mb-n2">
              <span class="font-weight-medium text-no-wrap me-2">Instagram:</span>
              <span class="text--secondary">{{ userName }}</span>
            </v-list-item>
          </v-list> -->
        </v-card-title>

        <!-- <v-card-actions class="justify-center">
          <v-btn color="primary" class="me-3" @click="isBioDialogOpen = !isBioDialogOpen"> Edit </v-btn>
        </v-card-actions> -->
      </v-card>

      <!-- edit profile dialog data -->
      <!-- <user-bio-edit :is-bio-dialog-open.sync="isBioDialogOpen" :user-data="userData"></user-bio-edit> -->
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
