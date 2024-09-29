<script setup lang="ts">
import { getAuth } from 'firebase/auth'

const props = defineProps<{
  eventId: string
  orderId: string
}>()

const emits = defineEmits<{
  generated: [pdf: Blob]
  error: [err: Error]
}>()

const isLoading = ref(true)
const wasFailed: Ref<Error | null> = ref(null)
const showDialog = computed({
  get: () => wasFailed.value != null,
  set: (value: boolean) => {
    if (!value) {
      wasFailed.value = null
    }
  },
})

new Promise(async () => {
  const token = await getAuth().currentUser!.getIdToken()
  const data = await fetch(
    `https://asia-northeast1-${import.meta.env.VITE_PROJECT_ID}.cloudfunctions.net/invoice/${props.eventId}/${props.orderId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `JWT ${token}`,
      },
    },
  )
  emits('generated', await data.blob())
})
  .catch((err: Error) => {
    wasFailed.value = err as Error
  })
  .finally(() => {
    isLoading.value = false
  })

const close = () => {
  emits('error', wasFailed.value!)
}
</script>

<template>
  <div v-if="isLoading" class="loading"><v-progress-circular indeterminate color="primary" /></div>
  <v-dialog v-model="showDialog" :width="$vuetify.display.smAndDown ? 'auto' : 650" persistent>
    <v-card>
      <v-card-title>{{ $t('invoice_error_card.title') }}</v-card-title>
      <v-card-text>{{ $t('invoice_error_card.description') }}</v-card-text>
      <v-card-actions>
        <v-btn @click="close">{{ $t('close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
