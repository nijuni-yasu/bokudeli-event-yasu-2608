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
            round
            class="mb-4"
          >
            <v-img v-if="avatar" :src="avatar"></v-img>
            <span v-else class="font-weight-semibold text-5xl">{{ userName }}</span>
          </v-avatar>
        </v-card-title>
        <v-row class="justify-center">        
          <div class="mb-2 text-h4">{{ userName }}</div>
        </v-row>
        <v-row class="justify-center">
          <v-col cols="auto">
            <a href="https://twitter.com/" target="_blank">
              <v-btn icon="mdi-twitter" size="x-large" class="ma-3"></v-btn>
            </a>
            <a href="https://facebook.com/" target="_blank">
              <v-btn icon="mdi-facebook" size="x-large" class="ma-3"></v-btn>
            </a>
            <a href="https://instagram.com/" target="_blank">
              <v-btn icon="mdi-instagram" size="x-large" class="ma-3"></v-btn>
            </a>
          </v-col>
        </v-row>
        <v-card-text class="text-subtitle-1" style="line-height:30px;">
          自己紹介・自己紹介・自己紹介・自己紹介・自己紹介・自己紹介・自己紹介・自己紹介・自己紹介・自己紹介・自己紹介・自己紹介・自己紹介・自己紹介・自己紹介・自己紹介・自己紹介・自己紹介・自己紹介・自己紹介・自己紹介・自己紹介
        </v-card-text>
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
