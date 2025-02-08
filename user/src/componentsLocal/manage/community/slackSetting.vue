<script setup lang="ts">
import { useCommunityStore, type CommunityStore } from '@/stores/community'
import CommunityEdit from '@/components/CommunityEdit.vue'

const notification = inject('notification') as Notification
const { t: $t } = useI18n()

const communityAccount = useRoute().params.communityAccount as string
const communityStore = useCommunityStore(communityAccount) as CommunityStore
const community = computed({
  get: () => communityStore.community,
  set: (value) => {
    communityStore.community = value
  },
})
const coverImageFile = ref<File | null>(null)
const iconImageFile = ref<File | null>(null)
const isLoading = ref(false)
const submit = async () => {
  isLoading.value = true
  try {
    await communityStore.updateComunity(community.value!)
    if (coverImageFile.value != null) {
      await communityStore.updateCoverImage(coverImageFile.value)
    }
    if (iconImageFile.value != null) {
      await communityStore.updateIconImage(iconImageFile.value)
    }
    Object.assign(notification, { message: $t('manage.settings.saved'), color: 'success' })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <v-container>
    <v-card class="pa-12">
      <v-row>
        <v-card-title class="pl-2">Slack通知設定</v-card-title>
      </v-row>
      <v-row class="description">
          <v-card-text>
            <v-row><v-col class="pa-0">shokujii の SlackAppを追加して、コミュニティをさらに盛り上げよう✨</v-col></v-row>
            <v-row><v-col class="pa-0">SlackAppについて詳しくは こちら をご参照ください。</v-col></v-row>
          </v-card-text>
      </v-row>
      <v-row>
        <v-card-text>
          <v-row><v-col class="pa-0">ステップ① shokujii のSlackAppをワークスペース及びチャンネルにインストール</v-col></v-row>
          <v-row><v-col class="pa-0">https://slackbot-joizgx24xa-an.a.run.app/slack/install</v-col></v-row>
        </v-card-text>
      </v-row>
      <v-row>
        <v-card-text>
          <v-row><v-col class="pa-0">ステップ②  SlackAppを追加したチャンネルで、以下コマンドを送信！</v-col></v-row>
          <v-row>
            <v-col cols="8" class="pa-0"><v-text-field>/shokujiii add community-XXXXXXXXXXXXXXXX</v-text-field></v-col>
            <v-col cols="4" class="pa-0 pl-4"><v-btn variant="text">📝コピー</v-btn></v-col>
          </v-row>
        </v-card-text>
      </v-row>
      <v-row>
        <v-card-text>
          <v-row><v-col class="pa-0">ステップ③ 設定完了🎉</v-col></v-row>
          <v-row><v-col cols="10" class="pa-0">「参加者の注文通知」「注文期限のリマインド」「イベント開始のリマインド」などがSlackのチャンネルで通知されるようになります。</v-col></v-row>
        </v-card-text>
      </v-row>
      <v-row>
        <v-card-text>
          <v-row><v-col class="pa-0">ステップ④ 設定解除する場合は、以下コマンドを送信してください</v-col></v-row>
          <v-row>
            <v-col cols="8" class="pa-0"><v-text-field>/shokujiii remove community-XXXXXXXXXXXXXXXX</v-text-field></v-col>
            <v-col cols="4" class="pa-0 pl-4"><v-btn  variant="text">📝コピー</v-btn></v-col>
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