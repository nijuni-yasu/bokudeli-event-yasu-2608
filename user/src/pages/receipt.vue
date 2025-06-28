<script setup lang="ts">
// ネストされたディレクトリだと layout: blank 指定が効かないので、ルートディレクトリに配置。
// See: https://github.com/nijuniinc/bokudeli-event-new/issues/1222

import { useNotification } from '@shokujii/base/composable/notification.js'
import { eventReceipt } from '@shokujii/base/apis/eventReceipt.js'

const route = useRoute()
const { t: $t } = useI18n()
const notification = useNotification()

const eventId = route.query.eventId as string
const orderId = route.query.orderId as string

const url = ref<string | null>(null)

;(async () => {
  try {
    const response = await eventReceipt({ eventId, orderId })
    url.value = response.data.url
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
