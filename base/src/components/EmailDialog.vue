<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { functions } from '@shokujii/base/firebase'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { httpsCallable } from 'firebase/functions'
import { useCreateAppLetterListStore } from '@shokujii/base/composable/useAppLetterStore.js'
import { mdiEmailOutline } from '@mdi/js'
import type { User } from '@shokujii/common/schemas/User.js'
import type { SendIndividualLetterRequest } from '@shokujii/common/apis/letter.js'

const model = defineModel<boolean>({ required: true })

const props = defineProps<{
  toUser: User
  communityAccount: string
  communityId: string
  eventId?: string
  replyTo?: string
}>()

const emit = defineEmits<{
  sent: []
  failed: []
}>()

const notification = useNotification()
const { t: $t } = useI18n()
const createLetterListStore = useCreateAppLetterListStore()
const mailSubject = ref('')
const mailText = ref('')
const isSending = ref(false)

const onFormSubmit = async () => {
  isSending.value = true
  try {
    const letterListStore = createLetterListStore(props.communityAccount)

    const letter = await letterListStore.newLetter('individual', props.eventId)
    letter.user_id = props.toUser.user_id
    letter.letter_title = mailSubject.value
    letter.letter_content = mailText.value
    letter.status = 'draft'
    await letterListStore.updateLetter(letter)

    const sendIndividualLetter = httpsCallable<SendIndividualLetterRequest>(functions, 'sendIndividualLetter')
    await sendIndividualLetter({
      communityId: props.communityId,
      letterId: letter.letter_id,
    })
    emit('sent')
  } catch {
    notification.show($t('email_dialog.failed'), 'error')
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
        <v-icon start :icon="mdiEmailOutline" />
        {{ $t('email_dialog.title') }}
      </v-card-title>
      <v-card-text v-if="props.replyTo" class="text-body-2 text-medium-emphasis pb-0" style="white-space: pre-line">
        {{ $t('email_dialog.description', { replyTo: props.replyTo }) }}
      </v-card-text>
      <v-card-text>
        <v-form class="mt-6" @submit.prevent="onFormSubmit">
          <v-row>
            <v-col cols="12" md="12">
              <v-text-field :model-value="props.toUser.user_name" :label="$t('email_dialog.send_to')" readonly />
            </v-col>
            <v-col cols="12" md="12">
              <v-text-field v-model="mailSubject" :label="$t('email_subject')" />
            </v-col>
            <v-col cols="12" md="12">
              <VTextarea v-model="mailText" :label="$t('email_message')" />
            </v-col>
            <!-- 👉 Submit and Cancel -->
            <v-col cols="12" class="d-flex flex-wrap justify-center ga-4">
              <v-btn
                :disabled="isSending || mailSubject.trim() === '' || mailText.trim() === ''"
                :loading="isSending"
                type="submit"
                color="primary"
                variant="flat"
              >
                {{ $t('email_dialog.send_letter') }}
              </v-btn>
              <v-btn color="secondary" variant="tonal" @click="model = false">
                {{ $t('cancel') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
