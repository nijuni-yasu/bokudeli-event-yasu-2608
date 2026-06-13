<script setup lang="ts">
import type { EnterpriseDiscountType } from '@shokujii/common/schemas/Enterprise.js'
import { useNotification } from '@shokujii/base/composable/notification'
import { updateEnterpriseSubsidySettings } from '@/apis/enterprise'
import { getEnterpriseIdFromToken, loadEnterpriseDocument } from '@/composable/useEnterpriseAdmin'

const { t } = useI18n()
const notification = useNotification()

const loading = ref(true)
const saving = ref(false)
const enterpriseId = ref<string>()
const discountType = ref<EnterpriseDiscountType>('fixed')
const discountValue = ref(0)
const monthlyLimitPerUser = ref(0)

const loadSettings = async () => {
  loading.value = true
  try {
    enterpriseId.value = await getEnterpriseIdFromToken()
    if (enterpriseId.value == null) return
    const doc = await loadEnterpriseDocument(enterpriseId.value)
    if (doc == null) return
    discountType.value = doc.discount_type
    discountValue.value = doc.discount_value
    monthlyLimitPerUser.value = doc.monthly_limit_per_user
  } finally {
    loading.value = false
  }
}

onMounted(loadSettings)

const saveSettings = async () => {
  if (enterpriseId.value == null) return
  saving.value = true
  try {
    await updateEnterpriseSubsidySettings({
      enterprise_id: enterpriseId.value,
      discount_type: discountType.value,
      discount_value: discountValue.value,
      monthly_limit_per_user: monthlyLimitPerUser.value,
    })
    notification.show(t('admin.discount.save_success'), 'success')
  } catch {
    notification.show(t('admin.discount.save_failed'), 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-container>
    <h1 class="text-h4 mb-2">{{ $t('admin.discount.title') }}</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">{{ $t('admin.discount.note') }}</p>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-card v-else max-width="640">
      <v-card-text>
        <div class="d-flex flex-column ga-4">
          <v-select
            v-model="discountType"
            :items="[
              { title: $t('admin.discount.type_fixed'), value: 'fixed' },
              { title: $t('admin.discount.type_percentage'), value: 'percentage' },
            ]"
            item-title="title"
            item-value="value"
            :label="$t('admin.discount.type')"
          />
          <v-text-field
            v-model.number="discountValue"
            type="number"
            :label="discountType === 'fixed' ? $t('admin.discount.value_fixed') : $t('admin.discount.value_percentage')"
          />
          <v-text-field
            v-model.number="monthlyLimitPerUser"
            type="number"
            :label="$t('admin.discount.monthly_limit')"
          />
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" :loading="saving" @click="saveSettings">{{ $t('admin.settings.save') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<route lang="yaml">
meta:
  layout: admin
</route>
