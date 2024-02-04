<script setup lang="ts">
import { buildFacebookUrl, buildInstagramUrl, buildTwitterUrl } from '@/composable/buildSnsLinks'
import { EventMember } from '@/schemes/EventMember'
import { convertTruncateText} from '@/schemes/converter'

const props = defineProps<{
  member: EventMember
}>()

const avatar = computed(() => props.member.user_image_url)
const userName = computed(() => props.member.user_name ?? 'ゲスト')
const twitterUrl = computed(
  () => props.member.user_sns_twitter ? buildTwitterUrl(props.member.user_sns_twitter) : null
)
const facebookUrl = computed(
  () => props.member.user_sns_facebook ? buildFacebookUrl(props.member.user_sns_facebook) : null
) 
const instagramUrl = computed(
  () => props.member.user_sns_instagram ? buildInstagramUrl(props.member.user_sns_instagram) : null
)
const userDescription = computed(() => props.member.user_description ?? '')

const descriptionCharacterLimit = 38
</script>

<template>
  <v-container class="pa-3">
    <v-card class="pt-8">
      <v-card-title class="d-flex align-center flex-column">
        <v-avatar
            :color="avatar ? '' : 'primary'"
            :class="avatar ? '' : 'v-avatar-light-bg primary--text'"
            size="50%"
            round
            class="mb-4"
          >
          <v-img v-if="avatar" aspect-ratio="1" :src="avatar" cover/>
          <span v-else class="font-weight-semibold text-5xl">{{ userName }}</span>
        </v-avatar>
        <v-row class="justify-center">
          <v-col>
            <span class="mb-2 text-h5 text-center text-wrap">{{ userName }}</span>
          </v-col>
        </v-row>
      </v-card-title>
      <v-card-subtitle class="sns-buttons">
        <v-row class="justify-center">
          <v-col cols="auto">
            <a v-if="twitterUrl" :href="twitterUrl" target="_blank">
              <v-btn icon="mdi-twitter" class="ma-3"></v-btn>
            </a>
            <a v-if="facebookUrl" :href="facebookUrl" target="_blank">
              <v-btn icon="mdi-facebook" class="ma-3"></v-btn>
            </a>
            <a v-if="instagramUrl" :href="instagramUrl" target="_blank">
              <v-btn icon="mdi-instagram" class="ma-3"></v-btn>
            </a>
          </v-col>
        </v-row>
      </v-card-subtitle>
      <v-card-text v-linkify class="text-subtitle-2 description">
        {{ convertTruncateText(userDescription, descriptionCharacterLimit) }}
      </v-card-text>
      <v-card-text class="text-center">
        <router-link :to="`/users/${member.user_id}`">
          <v-btn
            class="ma-1"
            variant="outlined"
            size="x-small"
            rounded
            prepend-icon="mdi-account"
          >
            プロフィール
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