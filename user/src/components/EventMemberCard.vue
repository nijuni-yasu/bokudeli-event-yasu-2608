<script setup lang="ts">
import { buildFacebookUrl, buildInstagramUrl, buildTwitterUrl } from '@/composable/buildSnsLinks'
import { EventMember } from '@/schemes/EventMember'

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
</script>

<template>
  <v-container>
    <v-card class="pt-10">
      <v-card-title class="d-flex align-center flex-column">
        <v-avatar
            :color="avatar ? '' : 'primary'"
            :class="avatar ? '' : 'v-avatar-light-bg primary--text'"
            size="100%"
            round
            class="mb-4"
          >
          <v-img v-if="avatar" :src="avatar" cover/>
          <span v-else class="font-weight-semibold text-5xl">{{ userName }}</span>
        </v-avatar>
        <v-row class="justify-center">
          <v-col>
            <span class="mb-2 text-h6 text-center text-wrap">{{ userName }}</span>
          </v-col>
        </v-row>
      </v-card-title>
      <v-card-subtitle>
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
      </v-card-subtitle>
      <v-card-text v-linkify class="text-subtitle-1" style="line-height: 30px; white-space: pre-line">
        {{ userDescription }}
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped lang="scss">
</style>