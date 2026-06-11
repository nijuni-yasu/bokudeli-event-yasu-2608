<script setup lang="ts">
import { useNotification } from '@shokujii/base/composable/notification.js'
import { getEventBillInvoicePdf } from '@shokujii/base/utils/pdf.js'

const route = useRoute()
const { t: $t } = useI18n()
const notification = useNotification()

const eventId = route.params.eventId as string
const invoiceId = route.query.id as string | undefined

const url = ref<string | null>(null)
const loadState = ref<'loading' | 'ready' | 'error'>('loading')

const releaseUrl = () => {
  if (url.value != null) {
    URL.revokeObjectURL(url.value)
    url.value = null
  }
}

onBeforeUnmount(releaseUrl)

onMounted(async () => {
  try {
    const response = await getEventBillInvoicePdf(eventId, invoiceId)
    if (response.status !== 200) {
      notification.show($t('manage.invoice.error'), 'error')
      loadState.value = 'error'
      return
    }
    releaseUrl()
    url.value = window.URL.createObjectURL(await response.blob())
    loadState.value = 'ready'
  } catch (e) {
    console.error(e)
    notification.show($t('manage.invoice.error'), 'error')
    loadState.value = 'error'
  }
})
</script>

<template>
  <div v-if="loadState === 'loading'" class="loading">
    <v-progress-circular indeterminate color="primary" />
  </div>
  <div v-else-if="loadState === 'error'" class="loading text-center">
    <p>{{ $t('manage.invoice.error') }}</p>
  </div>
  <iframe v-else class="fit-page" :src="url!" />
</template>

<style lang="scss" scoped>
.fit-page {
  display: block;
  width: 100dvw;
  height: 100dvh;
  border-width: 0;
}
</style>
