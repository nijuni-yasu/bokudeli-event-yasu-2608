<script setup lang="ts">
import { useStoreStoredUser } from '@/stores/storedUser'
import { FirestoredUser } from '@/schemes/storedUser'
import { buildFacebookUrl, buildInstagramUrl, buildTwitterUrl } from '@/utils/buildSnsLinks'
import UserAvatar from '@/components/UserAvatar.vue'
import { mdiTwitter, mdiFacebook, mdiInstagram, mdiCog, mdiWeb } from '@mdi/js'
import { getProfile } from '@/router/utils'

const props = defineProps<{
  userData: FirestoredUser
  userEmailPending: string | null
  isEditable: boolean | undefined
}>()

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

const websiteUrl = computed(() => (props.userData?.user_sns_website ? props.userData.user_sns_website : undefined))
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
              <v-btn :icon="mdiTwitter" class="ma-2"></v-btn>
            </a>
            <a v-if="facebookUrl" :href="facebookUrl" target="_blank">
              <v-btn :icon="mdiFacebook" class="ma-2"></v-btn>
            </a>
            <a v-if="instagramUrl" :href="instagramUrl" target="_blank">
              <v-btn :icon="mdiInstagram" class="ma-2"></v-btn>
            </a>
            <a v-if="websiteUrl" :href="websiteUrl" target="_blank">
              <v-btn :icon="mdiWeb" class="ma-2"></v-btn>
            </a>
          </v-col>
        </v-row>
        <v-card-text v-linkify class="text-subtitle-1" style="line-height: 30px; white-space: pre-line">
          {{ userDescription }}
        </v-card-text>
        <v-card-actions v-if="isEditable" class="justify-center">
          <v-btn color="primary" class="mb-3" size="x-large" :prepend-icon="mdiCog" :to="getProfile()"> 設定 </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
