<script setup lang="ts">
import { reactive, computed } from 'vue'
import { functions } from '@shokujii/base/firebase'
import { httpsCallable } from 'firebase/functions'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { getUserPath, getUrlFromPath } from '@/router/utils'
import { mdiEmail } from '@mdi/js'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: boolean
  communityName: string | null
  /** Firestore ドキュメント ID（community_id）。CommunityMembershipButton の communityAccount とは異なる */
  communityId: string | null
}>()

const dialog = defineModel<boolean>()

const closeDialog = () => {
  dialog.value = false
}

const state = reactive({
  mailTitle: '' as string,
  mailMessage: '' as string,
  isSending: false as boolean,
})

const { t: $t } = useI18n()
const { user: currentUser, personalInformation: currentUserPersonalInformation } = storeToRefs(useCurrentUserStore())

const replyTo = computed(() => currentUserPersonalInformation.value?.user_email ?? '')

const onFormSubmit = async () => {
  state.isSending = true
  try {
    if (currentUser.value != null && currentUserPersonalInformation.value != null) {
      const communityContact = httpsCallable(functions, 'communityContact')
      const user_profile_url = getUrlFromPath(getUserPath(currentUser.value.id))
      try {
        await communityContact({
          community_id: props.communityId,
          community_name: props.communityName,
          mail_title: state.mailTitle,
          mail_message: state.mailMessage,
          user_id: currentUser.value.id,
          user_name: currentUser.value.user_name,
          user_email: currentUserPersonalInformation.value.user_email,
          user_profile_url,
        })
        window.alert('送信完了しました')
        return
      } catch {
        // Fall through
      }
    }
    window.alert('送信失敗しました')
  } finally {
    state.isSending = false
    state.mailTitle = ''
    state.mailMessage = ''
    closeDialog()
  }
}
</script>

<template>
  <v-dialog v-model="dialog" :width="$vuetify.display.smAndDown ? 'auto' : 650" persistent>
    <v-card class="pa-sm-9 pa-5 text-center">
      <v-card-title class="text-h5">
        <v-icon start :icon="mdiEmail" />
        お問い合わせ
      </v-card-title>
      <v-card-text class="text-body-2 text-medium-emphasis pb-0" style="white-space: pre-line">
        {{ $t('community_contact_dialog.send_to', { communityName: props.communityName })
        }}{{ replyTo ? '\n' + $t('community_contact_dialog.reply_to', { replyTo }) : '' }}
      </v-card-text>

      <v-card-text>
        <v-form class="mt-6" @submit.prevent="onFormSubmit">
          <v-row>
            <v-col cols="12" md="12">
              <v-text-field v-model="state.mailTitle" label="件名" />
            </v-col>
            <v-col cols="12" md="12">
              <VTextarea v-model="state.mailMessage" label="メッセージ" />
            </v-col>
            <!-- 👉 Submit and Cancel -->
            <v-col cols="12" class="d-flex flex-wrap justify-center ga-4">
              <v-btn
                :disabled="state.isSending || !(state.mailTitle && state.mailMessage)"
                :loading="state.isSending"
                type="submit"
                rounded="pill"
              >
                メッセージ送信
              </v-btn>
              <v-btn rounded="pill" color="secondary" variant="tonal" @click="closeDialog"> キャンセル </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
