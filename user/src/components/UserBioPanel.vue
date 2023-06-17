<script setup lang="ts">
import StoredUser from '@/schemes/storedUser'
import { useStoreCredential } from '@/stores/credential'
import { useStoreStoredUser } from '@/stores/storedUser'
import { convertStoredUserToFirestoredUser } from '@/schemes/converter'
import { Timestamp, doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import UserBioEditDialog from './UserBioEditDialog.vue'

const props = defineProps<{ userData: StoredUser; isEditable: boolean | undefined }>()
const userData = ref(props.userData)
const isEditable = computed(() => props.isEditable ?? false)

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
const userDescription = computed(() => {
  return userData?.value?.userDescription ?? 'ここに自己紹介文が入ります。'
})
const twitterUrl = computed(() => {
  if (userData?.value?.userSnsTwitter) {
    return 'https://twitter.com/' + userData.value.userSnsTwitter
  } else {
    return undefined
  }
})

const facebookUrl = computed(() => {
  if (userData?.value?.userSnsFacebook) {
    return 'https://www.facebook.com/' + userData.value.userSnsFacebook
  } else {
    return undefined
  }
})

const instagramUrl = computed(() => {
  if (userData?.value?.userSnsInstagram) {
    return 'https://www.instagram.com/' + userData.value.userSnsInstagram
  } else {
    return undefined
  }
})

const isUserInfoEditDialogVisible = ref(false)
const updateUserData = async (storedUser: StoredUser) => {
  const store = useStoreStoredUser()
  store.update(storedUser)

  const docRef = doc(db, 'users', storedUser.userId)
  const docSnap = await getDoc(docRef)
  const { user_name, user_sns_twitter, user_sns_facebook, user_description } =
    convertStoredUserToFirestoredUser(storedUser)
  if (docSnap.exists()) {
    await setDoc(
      docRef,
      {
        user_name,
        user_sns_twitter,
        user_sns_facebook,
        user_description,
        updated_at: Timestamp.now(),
      },
      { merge: true }
    )
  } else {
    console.error('ユーザーが存在しません')
  }
  userData.value = storedUser
}
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
            <a v-if="twitterUrl" :href="twitterUrl" target="_blank">
              <v-btn icon="mdi-twitter" size="x-large" class="ma-3"></v-btn>
            </a>
            <a v-if="facebookUrl" :href="facebookUrl" target="_blank">
              <v-btn icon="mdi-facebook" size="x-large" class="ma-3"></v-btn>
            </a>
            <a v-if="instagramUrl" :href="instagramUrl" target="_blank">
              <v-btn icon="mdi-instagram" size="x-large" class="ma-3"></v-btn>
            </a>
          </v-col>
        </v-row>
        <v-card-text class="text-subtitle-1" style="line-height: 30px">
          {{ userDescription }}
        </v-card-text>
        <v-card-actions v-if="isEditable" class="justify-center">
          <v-btn color="primary" class="me-3" size="large" @click="isUserInfoEditDialogVisible = true"> 編集 </v-btn>
        </v-card-actions>
      </v-card>
      <!-- edit profile dialog data -->
      <user-bio-edit-dialog v-model="isUserInfoEditDialogVisible" :user-data="userData" @submit="updateUserData" />
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
