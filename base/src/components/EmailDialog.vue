<script setup lang="ts">
import { functions } from '@/firebase'
import { httpsCallable } from 'firebase/functions'
import { useStoreStoredUser } from '@/stores/storedUser'
import { mdiEmail } from '@mdi/js'
import type { FirestoredUser } from '@/schemes/storedUser'

const model = defineModel<boolean>({ required: true })

const props = defineProps<{
  toUser: FirestoredUser
}>()

const emit = defineEmits<{
  (e: 'sent'): void
  (e: 'failed'): void
}>()

const mailSubject = ref('')
const mailText = ref('')
const isSending = ref(false)

const userStore = useStoreStoredUser()

const onFormSubmit = async () => {
  isSending.value = true
  try {
    const userId = userStore.storedUser?.userId
    if (userId != null) {
      const sendMail = httpsCallable(functions, 'send_email')
      try {
        await sendMail({
          toUid: props.toUser.user_id,
          subject: mailSubject.value,
          text: mailText.value,
        })
        emit('sent')
        return
      } catch (error) {
        console.log(error)
        // Fall through
      }
    }
    emit('failed')
  } finally {
    isSending.value = false
    mailSubject.value = ''
    mailText.value = ''
    model.value = false
  }
}
</script>

<template>
  <v-dialog v-model="model" :width="$vuetify.display.smAndDown ? 'auto' : 650">
    <v-card class="pa-sm-9 pa-5 text-center">
      <v-card-title class="text-h5">
        <v-icon start :icon="mdiEmail" />
        {{ $t('email_dialog.title') }}
      </v-card-title>
      <!-- <v-card-text> {{ $t('email_dialog.send_to', [toUser.user_name, toUser.user_email]) }} </v-card-text> -->

      <v-card-text>
        <v-form class="mt-6" @submit.prevent="onFormSubmit">
          <v-row>
            <v-col cols="12" md="12">
              <v-text-field v-model="mailSubject" :label="$t('email_subject')" />
            </v-col>
            <v-col cols="12" md="12">
              <VTextarea v-model="mailText" :label="$t('email_message')" />
            </v-col>
            <!-- 👉 Submit and Cancel -->
            <v-col cols="12" class="d-flex flex-wrap justify-center gap-4">
              <v-btn
                :disabled="isSending || !(mailSubject && mailText)"
                :loading="isSending"
                type="submit"
                rounded="pill"
                @click="onFormSubmit"
              >
                {{ $t('email_dialog.send') }}
              </v-btn>
              <v-btn rounded="pill" color="secondary" variant="tonal" @click="model = false">
                {{ $t('cancel') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
