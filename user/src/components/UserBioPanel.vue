<script setup lang="ts">
// import StoredUser from '@/schemes/storedUser'
import { useStoreStoredUser } from '@/stores/storedUser'
import { FirestoredUser } from '@/schemes/storedUser'
import { convertFirestoredUserToStoredUser } from '@/schemes/converter'
import { Timestamp, doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import UserBioEditDialog from './UserBioEditDialog.vue'
import { buildFacebookUrl, buildInstagramUrl, buildTwitterUrl } from '@/composable/buildSnsLinks'

const props = defineProps<{ userData: FirestoredUser; isEditable: boolean | undefined }>()

const storedUserStore = useStoreStoredUser()

const userData = ref(props.userData)
const isEditable = computed(() => props.isEditable ?? false)

const avatar = computed(() => userData?.value?.user_image_url ?? null)

const userName = computed(() => userData?.value?.user_name ?? 'ゲスト')
const userDescription = computed(() => {
  return userData.value?.user_description ||
    ((storedUserStore.storedUser?.userId !== userData.value?.user_id) ? '' : 'ここに自己紹介文が入ります。')
})
const twitterUrl = computed(() => (
  userData?.value?.user_sns_twitter ? buildTwitterUrl(userData.value.user_sns_twitter) : undefined 
))

const facebookUrl = computed(() => (
  userData?.value?.user_sns_facebook ? buildFacebookUrl(userData.value.user_sns_facebook) : undefined
))

const instagramUrl = computed(() => (
  userData?.value?.user_sns_instagram ? buildInstagramUrl(userData.value.user_sns_instagram) : undefined
))

const isUserInfoEditDialogVisible = ref(false)
const updateUserData = async (user: FirestoredUser) => {
  storedUserStore.update(convertFirestoredUserToStoredUser(user))

  const docRef = doc(db, 'users', user.user_id)
  const docSnap = await getDoc(docRef)
  const { user_name, user_image_url, user_sns_twitter, user_sns_facebook, user_sns_instagram, user_description } = user
  if (docSnap.exists()) {
    await setDoc(
      docRef,
      {
        user_name,
        user_image_url,
        user_sns_twitter,
        user_sns_facebook,
        user_sns_instagram,
        user_description,
        updated_at: Timestamp.now(),
      },
      { merge: true },
    )
  } else {
    console.error('ユーザーが存在しません')
  }
  userData.value = user
}
</script>

<template>
  <v-row class="user-bio-panel">
    <!-- user profile -->
    <v-col cols="12">
      <v-card class="pt-8">
        <v-card-title class="d-flex align-center flex-column">
          <v-avatar
            :color="avatar ? '' : 'primary'"
            :class="avatar ? '' : 'v-avatar-light-bg primary--text'"
            size="200"
            round
            class="mb-4"
          >
            <v-img v-if="avatar" :src="avatar" cover/>
            <span v-else class="font-weight-semibold text-5xl">{{ userName }}</span>
          </v-avatar>
        </v-card-title>
          <v-card-text>
          <div class="text-h5 text-center">{{ userName }}</div>
          </v-card-text>
        <v-row class="justify-center">
          <v-col cols="auto">
            <a v-if="twitterUrl" :href="twitterUrl" target="_blank">
              <v-btn icon="mdi-twitter" size="large" class="ma-3"></v-btn>
            </a>
            <a v-if="facebookUrl" :href="facebookUrl" target="_blank">
              <v-btn icon="mdi-facebook" size="large" class="ma-3"></v-btn>
            </a>
            <a v-if="instagramUrl" :href="instagramUrl" target="_blank">
              <v-btn icon="mdi-instagram" size="large" class="ma-3"></v-btn>
            </a>
          </v-col>
        </v-row>
        <v-card-text v-linkify class="text-subtitle-1" style="line-height: 30px; white-space: pre-line">
          {{ userDescription }}
        </v-card-text>
        <v-card-actions v-if="isEditable" class="justify-center">
          <v-btn color="primary" class="me-3" size="large" prepend-icon="mdi-pencil" @click="isUserInfoEditDialogVisible = true">
            編集
          </v-btn>
        </v-card-actions>
      </v-card>
      <!-- edit profile dialog data -->
      <user-bio-edit-dialog v-model="isUserInfoEditDialogVisible" :user-data="userData" @submit="updateUserData" />
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
