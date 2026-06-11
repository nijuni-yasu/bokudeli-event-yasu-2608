<script setup lang="ts">
import { slackBotFunctionBaseURL } from '@shokujii/base/firebase.js'
import { useCommunityStore, type CommunityStore } from '@shokujii/base/stores/community.js'
import { mdiContentCopy } from '@mdi/js'
import slackLogo from '@shokujii/base/assets/images/slack/slack_logo.png'
import slackImage01 from '@shokujii/base/assets/images/slack/slack_image_01.png'
import slackImage02 from '@shokujii/base/assets/images/slack/slack_image_02.png'
import slackImage03 from '@shokujii/base/assets/images/slack/slack_image_03.png'
import slackImage04 from '@shokujii/base/assets/images/slack/slack_image_04.png'

const { t: $t } = useI18n()

const communityAccount = useRoute().params.communityAccount as string
const communityStore = useCommunityStore(communityAccount) as CommunityStore
const communityNameForSlack = computed(() => {
  const community = communityStore.community
  return `${community?.community_account}-${community?.community_id}`
})

const communityAddCommand = computed(() => `/shokujii add ${communityNameForSlack.value}`)
const communityRemoveCommand = computed(() => `/shokujii remove ${communityNameForSlack.value}`)

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
  <v-container class="manage-container">
    <v-card class="pa-10 mb-10">
      <v-row>
        <v-col cols="8" sm="3" md="2">
          <v-img class="my-3" :src="slackLogo" />
        </v-col>
      </v-row>
      <v-row>
        <v-card-text class="pa-0 pl-2"><div v-html="$t('manage.slack.description')" /></v-card-text>
      </v-row>
      <v-row justify="center">
        <v-col cols="12" md="9">
          <v-img class="my-3" :src="slackImage01" />
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="12" md="9">
          <v-img class="my-3" :src="slackImage04" />
        </v-col>
      </v-row>
    </v-card>
    <v-card class="pa-10 my-10">
      <v-row>
        <v-card-title class="pl-2">
          {{ $t('manage.slack.setup') }}
        </v-card-title>
      </v-row>
      <v-row>
        <v-card-text class="mt-6">
          <v-row>
            <v-chip color="primary" class="text-none mr-2 step-chip">
              {{ $t('manage.slack.step1') }}
            </v-chip>
          </v-row>
          <v-row>
            <div v-html="$t('manage.slack.step1_desc')" />
          </v-row>
          <v-row>
            <a :href="slackInstallUrl" target="_blank" style="font-size: 20px; font-weight: bold">
              {{ slackInstallUrl }}
            </a>
          </v-row>
        </v-card-text>
      </v-row>
      <v-row>
        <v-card-text class="mt-6">
          <v-row>
            <v-chip color="primary" class="text-none mr-2 step-chip">
              {{ $t('manage.slack.step2') }}
            </v-chip>
          </v-row>
          <v-row>
            <div v-html="$t('manage.slack.step2_desc')" />
          </v-row>
          <v-row>
            <v-col cols="12" md="8">
              <v-img class="my-3" :src="slackImage02" />
            </v-col>
          </v-row>
        </v-card-text>
      </v-row>
      <v-row>
        <v-card-text class="mt-6">
          <v-row>
            <v-chip color="primary" class="text-none mr-2 step-chip">
              {{ $t('manage.slack.step3') }}
            </v-chip>
          </v-row>
          <v-row>
            <div v-html="$t('manage.slack.step3_desc')" />
          </v-row>
          <v-row class="align-center">
            <v-col cols="12" md="8" class="pa-1"
              ><v-text-field readonly>{{ communityAddCommand }}</v-text-field></v-col
            >
            <v-col cols="4" class="pa-1 pl-3">
              <v-btn variant="outlined" :prepend-icon="mdiContentCopy" @click="copyAddCommand">
                {{ $t('manage.slack.copy') }}
              </v-btn>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="8">
              <v-img class="my-3" :src="slackImage03" />
            </v-col>
          </v-row>
        </v-card-text>
      </v-row>
      <v-row>
        <v-card-text class="mt-6">
          <v-row>
            <v-chip color="primary" class="text-none mr-2 step-chip">
              {{ $t('manage.slack.step4') }}
            </v-chip>
          </v-row>
          <v-row>
            <div v-html="$t('manage.slack.step4_desc')" />
          </v-row>
        </v-card-text>
      </v-row>

      <!-- <v-divider class="mt-10 mb-5" :thickness="5"/> -->

      <v-row>
        <v-card-text class="mt-6">
          <v-row>
            <v-chip color="primary" class="text-none mr-2 step-chip">
              {{ $t('manage.slack.step5') }}
            </v-chip>
          </v-row>
          <v-row
            ><v-col class="pa-0"><div v-html="$t('manage.slack.step5_desc')" /></v-col
          ></v-row>
          <v-row class="align-center">
            <v-col cols="12" md="8" class="pa-1"
              ><v-text-field readonly>{{ communityRemoveCommand }}</v-text-field></v-col
            >
            <v-col cols="4" class="pa-1 pl-3">
              <v-btn variant="outlined" :prepend-icon="mdiContentCopy" @click="copyRemoveCommand">
                {{ $t('manage.slack.copy') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-row>
    </v-card>
  </v-container>
</template>

<style scoped>
.v-card-title {
  font-size: 24px;
  font-weight: 700;
  line-height: 24px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
}

.v-card-text {
  font-size: 14px;
  font-weight: 400;
  line-height: 30px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
}
.step-chip {
  font-size: 20px;
}
</style>
