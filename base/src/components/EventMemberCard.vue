<script setup lang="ts">
import { buildFacebookUrl, buildInstagramUrl, buildTwitterUrl } from '@/composable/buildSnsLinks'
import { type EventMember } from '@/schemes/EventMember'
import { convertTruncateText } from '@/schemes/converter'
import UserAvatar from '@/components/UserAvatar.vue'
import { getUserPath } from '@/router/utils'
import { mdiAccount, mdiTwitter, mdiFacebook, mdiInstagram } from '@mdi/js'

const props = defineProps<{
  member: EventMember
}>()

const userName = computed(() => props.member.user_name ?? 'ゲスト')
const twitterUrl = computed(() =>
  props.member.user_sns_twitter ? buildTwitterUrl(props.member.user_sns_twitter) : null,
)
const facebookUrl = computed(() =>
  props.member.user_sns_facebook ? buildFacebookUrl(props.member.user_sns_facebook) : null,
)
const instagramUrl = computed(() =>
  props.member.user_sns_instagram ? buildInstagramUrl(props.member.user_sns_instagram) : null,
)
const userDescription = computed(() => props.member.user_description ?? '')

const descriptionCharacterLimit = 120
</script>

<template>
  <v-container class="pa-3">
    <v-card class="pt-8">
      <v-card-title class="d-flex align-center flex-column">
        <UserAvatar :user="member" :size="150" />
        <v-row class="justify-center">
          <v-col class="mt-3">
            <span class="text-h5 text-center text-wrap">{{ userName }}</span>
          </v-col>
        </v-row>
      </v-card-title>
      <v-card-text v-linkify class="text-caption description py-1 px-5">
        {{ convertTruncateText(userDescription, descriptionCharacterLimit) }}
      </v-card-text>
      <v-card-subtitle class="sns-buttons">
        <v-row class="justify-center">
          <v-col cols="auto">
            <a v-if="twitterUrl" :href="twitterUrl" target="_blank">
              <v-btn :icon="mdiTwitter" class="ma-3"></v-btn>
            </a>
            <a v-if="facebookUrl" :href="facebookUrl" target="_blank">
              <v-btn :icon="mdiFacebook" class="ma-3"></v-btn>
            </a>
            <a v-if="instagramUrl" :href="instagramUrl" target="_blank">
              <v-btn :icon="mdiInstagram" class="ma-3"></v-btn>
            </a>
          </v-col>
        </v-row>
      </v-card-subtitle>
      <v-card-text class="text-center pt-1">
        <router-link :to="getUserPath(member.user_id)">
          <v-btn class="ma-2" variant="outlined" size="small" rounded :prepend-icon="mdiAccount">
            プロフィール詳細
          </v-btn>
        </router-link>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped lang="scss">
@import 'src/styles/variables/_vuetify.scss';

.sns-buttons {
  height: 60px;
}
.description {
  line-height: 24px;
  white-space: normal;
  text-overflow: ellipsis;
  overflow: hidden;
  height: calc(30px * 2 + $card-text-padding * 2);
  max-height: calc(30px * 2 + $card-text-padding * 2);
}
</style>
