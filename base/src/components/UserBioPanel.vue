<script setup lang="ts">
import { useStoreStoredUser } from '@/stores/storedUser'
import { useUserStore, type UserStore } from '@/stores/user'
import { FirestoredUser } from '@/schemes/storedUser'
import { convertFirestoredUserToStoredUser } from '@/schemes/converter'
import UserBioEditDialog from './UserBioEditDialog.vue'
import { buildFacebookUrl, buildInstagramUrl, buildTwitterUrl } from '@/composable/buildSnsLinks'
import UserAvatar from '@/components/UserAvatar.vue'
import { mdiPencil, mdiTwitter, mdiFacebook, mdiInstagram } from '@mdi/js'

const props = defineProps<{ userData: FirestoredUser; isEditable: boolean | undefined }>()

const storedUserStore = useStoreStoredUser()

const isEditable = computed(() => props.isEditable ?? false)

const userName = computed(() => props.userData.user_name ?? 'ゲスト')
const userDescription = computed(() => {
  return (
    props.userData.user_description ||
    (storedUserStore.storedUser?.userId !== props.userData.user_id ? '' : 'ここに自己紹介文が入ります。')
  )
})
const twitterUrl = computed(() =>
  props.userData.user_sns_twitter ? buildTwitterUrl(props.userData.user_sns_twitter) : undefined,
)

const facebookUrl = computed(() =>
  props.userData?.user_sns_facebook ? buildFacebookUrl(props.userData.user_sns_facebook) : undefined,
)

const instagramUrl = computed(() =>
  props.userData?.user_sns_instagram ? buildInstagramUrl(props.userData.user_sns_instagram) : undefined,
)

const isUserInfoEditDialogVisible = ref(false)
const updateUserData = async (user: FirestoredUser, image?: File) => {
  storedUserStore.update(convertFirestoredUserToStoredUser(user))

  const userStore = useUserStore(props.userData.user_id) as UserStore
  await userStore.updateUser(user)
  if (image != null) {
    try {
      await userStore.uploadUserImage(image)
    } catch (err) {
      console.error(err)
      window.alert('画像のアップロードに失敗しました')
    }
  }
}
</script>

<template>
  <v-row class="user-bio-panel">
    <!-- user profile -->
    <v-col cols="12">
      <v-card class="pt-8">
        <v-card-title class="d-flex align-center flex-column mb-4">
          <UserAvatar :user="userData" :size="200" />
        </v-card-title>
        <v-card-text>
          <div class="text-h5 text-center">{{ userName }}</div>
        </v-card-text>
        <v-row class="justify-center">
          <v-col cols="auto">
            <a v-if="twitterUrl" :href="twitterUrl" target="_blank">
              <v-btn :icon="mdiTwitter" size="large" class="ma-3"></v-btn>
            </a>
            <a v-if="facebookUrl" :href="facebookUrl" target="_blank">
              <v-btn :icon="mdiFacebook" size="large" class="ma-3"></v-btn>
            </a>
            <a v-if="instagramUrl" :href="instagramUrl" target="_blank">
              <v-btn :icon="mdiInstagram" size="large" class="ma-3"></v-btn>
            </a>
          </v-col>
        </v-row>
        <v-card-text v-linkify class="text-subtitle-1" style="line-height: 30px; white-space: pre-line">
          {{ userDescription }}
        </v-card-text>
        <v-card-actions v-if="isEditable" class="justify-center">
          <v-btn
            color="primary"
            class="me-3"
            size="large"
            :prepend-icon="mdiPencil"
            @click="isUserInfoEditDialogVisible = true"
          >
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
