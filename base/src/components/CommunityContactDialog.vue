<script setup lang="ts">
import { functions } from '@/firebase'
import { httpsCallable } from 'firebase/functions'
import { useStoreStoredUser } from '@/stores/storedUser'
import { getUserPath } from '@/router/utils'

interface Props {
  modelValue: boolean
  communityName: string | null
  communityId: string | null
}
interface Emit {
  (e: 'update:modelValue', value: boolean): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const closeDialog = () => {
  dialog.value = false
}

const state = reactive({
  mailTitle: '' as string,
  mailMessage: '' as string,
  isSending: false as boolean,
})

const userStore = useStoreStoredUser()

const onFormSubmit = async () => {
  state.isSending = true
  try {
    const userId = userStore.storedUser?.userId
    if (userId != null) {
      const communityContact = httpsCallable(functions, 'community_contact')
      const host = import.meta.env.VITE_ORIGIN_HOST
      const path = getUserPath(userId)
      try {
        const res = await communityContact({
          community_id: props.communityId,
          community_name: props.communityName,
          mail_title: state.mailTitle,
          mail_message: state.mailMessage,
          user_id: userStore.storedUser?.userId,
          user_name: userStore.storedUser?.userName,
          user_email: userStore.storedUser?.userEmail,
          user_profile_url: `${host}${path}`,
        })
        console.log(res)
        window.alert('送信完了しました')
        return
      } catch (error) {
        console.log(error)
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
        <v-icon start> mdi-email </v-icon>
        お問い合わせ
      </v-card-title>
      <v-card-text> 送信先：{{ props.communityName }} にメールにて問い合わせます。 </v-card-text>

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
            <v-col cols="12" class="d-flex flex-wrap justify-center gap-4">
              <v-btn
                :disabled="state.isSending || !(state.mailTitle && state.mailMessage)"
                :loading="state.isSending"
                type="submit"
                rounded
              >
                メッセージ送信
              </v-btn>
              <v-btn rounded color="secondary" variant="tonal" @click="closeDialog"> キャンセル </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
