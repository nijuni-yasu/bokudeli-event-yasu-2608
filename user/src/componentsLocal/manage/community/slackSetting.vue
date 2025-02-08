<script setup lang="ts">
import { slackBotFunctionBaseURL } from '@/firebase'
import { useCommunityStore, type CommunityStore } from '@/stores/community'

const { t: $t } = useI18n()

const communityAccount = useRoute().params.communityAccount as string
const communityStore = useCommunityStore(communityAccount) as CommunityStore
const communityNameForSlack = computed(() => {
  const community = communityStore.community
  return `${community?.community_account}-${community?.community_id}`
})

const communityAddCommand = computed(() => `/shokujiii add ${communityNameForSlack.value}`)
const communityRemoveCommand = computed(() => `/shokujiii remove ${communityNameForSlack.value}`)

const copyString = (command: string) => {
  navigator.clipboard
    .writeText(command)
    .then(() => {
      alert('クリップボードにコピーしました')
    })
    .catch((err) => console.error('コピー失敗: ', err))
}

const slackInstallUrl = `${slackBotFunctionBaseURL}/install`

const copyAddCommand = () => {
  copyString(communityAddCommand.value)
}

const copyRemoveCommand = () => {
  copyString(communityRemoveCommand.value)
}
</script>

<template>
  <v-container>
    <v-card class="pa-12">
      <v-row>
        <v-card-title class="pl-2">
          {{ $t('manage.slack.title') }}
        </v-card-title>
      </v-row>
      <v-row class="description">
        <v-card-text class="pa-0 pl-2"><div v-html="$t('manage.slack.description')" /></v-card-text>
      </v-row>
      <v-row>
        <v-card-title class="pl-2 mt-10">
          {{ $t('manage.slack.setup') }}
        </v-card-title>
      </v-row>
      <v-row>
        <v-card-text class="mt-2">
          <v-row><div v-html="$t('manage.slack.step1')" /></v-row>
          <v-row
            ><a :href="slackInstallUrl" target="_blank" class="text-none">{{ slackInstallUrl }}</a></v-row
          >
        </v-card-text>
      </v-row>
      <v-row>
        <v-card-text class="mt-4">
          <v-row
            ><v-col class="pa-0"><div v-html="$t('manage.slack.step2')" /></v-col
          ></v-row>
          <v-row class="align-center">
            <v-col cols="8" class="pa-0"
              ><v-text-field readonly>{{ communityAddCommand }}</v-text-field></v-col
            >
            <v-col cols="4" class="pa-0 pl-4"
              ><v-btn variant="text" color="on-surface" slim class="text-none" @click="copyAddCommand">{{
                $t('manage.slack.copy')
              }}</v-btn></v-col
            >
          </v-row>
        </v-card-text class="mt-4">
      </v-row>
      <v-row>
        <v-card-text class="pa-0 pl-2 mt-4">
          <div v-html="$t('manage.slack.step3')" />
        </v-card-text>
      </v-row>
      <v-row>
        <v-card-text class="mt-4">
          <v-row
            ><v-col class="pa-0"><div v-html="$t('manage.slack.step4')" /></v-col
          ></v-row>
          <v-row class="align-center">
            <v-col cols="8" class="pa-0"
              ><v-text-field readonly>{{ communityRemoveCommand }}</v-text-field></v-col
            >
            <v-col cols="4" class="pa-0 pl-4"
              ><v-btn variant="text" color="on-surface" slim class="text-none" @click="copyRemoveCommand">{{
                $t('manage.slack.copy')
              }}</v-btn></v-col
            >
          </v-row>
        </v-card-text>
      </v-row>
    </v-card>
  </v-container>
</template>

<style scoped>
.v-card-title {
  font-family: Noto Sans JP;
  font-size: 24px;
  font-weight: 700;
  line-height: 24px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
}

.v-card-text {
  font-family: Noto Sans JP;
  font-size: 14px;
  font-weight: 400;
  line-height: 32px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
}

.description {
  font-family: Noto Sans JP;
  font-size: 16px;
  font-weight: 400;
  line-height: 30px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
}
</style>
