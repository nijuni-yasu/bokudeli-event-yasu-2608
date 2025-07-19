<script setup lang="ts">
import { useNotification } from '@shokujii/base/composable/notification.js'
import { getEventBillInvoicePdf } from '@shokujii/base/utils/pdf.js'

const route = useRoute()
const { t: $t } = useI18n()
const notification = useNotification()

const eventId = route.params.eventId as string
const invoiceId = route.query.id as string | undefined

const url = ref<string | null>(null)

;(async () => {
  try {
    const response = await getEventBillInvoicePdf(eventId, invoiceId)
    if (response.status !== 200) {
      notification.show($t('manage.invoice.error'), 'error')
    }
    url.value = window.URL.createObjectURL(await response.blob())
  } catch (e) {
    console.error(e)
    notification.show($t('manage.invoice.error'), 'error')
  }
})()
</script>

<template>
  <div v-if="url == null" class="loading">
    <v-progress-circular indeterminate color="primary" />
  </div>
  <iframe v-else class="fit-page" :src="url" />
</template>

<style lang="scss" scoped>
.fit-page {
  display: block;
  width: 100dvw;
  height: 100dvh;
  border-width: 0;
}
</style>

<route lang="yaml">
meta:
  layout: blank
</route>
