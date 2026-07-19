<script setup lang="ts">
import { useNotification } from '@shokujii/base/composable/notification.js'
import { reportClientError } from '@shokujii/base/utils/reportClientError.js'
import { getEnterpriseBillInvoicePdf } from '@/utils/enterpriseBillInvoicePdf'
import { getEnterpriseIdFromToken } from '@/composable/useEnterpriseAdmin'

const route = useRoute()
const { t: $t } = useI18n()
const notification = useNotification()

const yearMonth = route.params.yearMonth as string
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
    const enterpriseId = await getEnterpriseIdFromToken()
    if (enterpriseId == null) {
      loadState.value = 'error'
      return
    }
    const response = await getEnterpriseBillInvoicePdf(enterpriseId, yearMonth, invoiceId)
    if (response.status !== 200) {
      notification.show($t('admin.invoices.error'), 'error')
      loadState.value = 'error'
      return
    }
    releaseUrl()
    url.value = window.URL.createObjectURL(await response.blob())
    loadState.value = 'ready'
  } catch (e) {
    reportClientError(e, { componentInfo: 'admin/invoices/[yearMonth]' })
    notification.show($t('admin.invoices.error'), 'error')
    loadState.value = 'error'
  }
})
</script>

<template>
  <div v-if="loadState === 'loading'" class="loading">
    <v-progress-circular indeterminate color="primary" />
  </div>
  <div v-else-if="loadState === 'error'" class="loading text-center">
    <p>{{ $t('admin.invoices.error') }}</p>
  </div>
  <iframe v-else class="fit-page" :src="url!" />
</template>

<style lang="scss" scoped>
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100dvw;
  height: 100dvh;
}

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
