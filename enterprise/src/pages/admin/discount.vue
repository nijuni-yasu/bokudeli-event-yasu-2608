<script setup lang="ts">
import type { EnterpriseDiscountType } from '@shokujii/common/schemas/Enterprise.js'
import { useNotification } from '@shokujii/base/composable/notification'
import { updateEnterpriseSubsidySettings } from '@/apis/enterprise'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import { getEnterpriseIdFromToken, loadEnterpriseDocument } from '@/composable/useEnterpriseAdmin'

const { t } = useI18n()
const notification = useNotification()

const loading = ref(true)
const saving = ref(false)
const enterpriseId = ref<string>()
const discountType = ref<EnterpriseDiscountType>('fixed')
const discountValue = ref(0)
const monthlyLimitPerUser = ref(0)
const discountValueError = ref<string>()
const monthlyLimitError = ref<string>()

const discountValueSuffix = computed(() => (discountType.value === 'fixed' ? '円' : '%'))

const validateForm = (): boolean => {
  discountValueError.value = undefined
  monthlyLimitError.value = undefined

  const value = discountValue.value
  const limit = monthlyLimitPerUser.value

  if (!Number.isInteger(value)) {
    discountValueError.value =
      discountType.value === 'fixed'
        ? t('admin.discount.value_invalid_fixed')
        : t('admin.discount.value_invalid_percentage')
  } else if (discountType.value === 'fixed' && value < 0) {
    discountValueError.value = t('admin.discount.value_invalid_fixed')
  } else if (discountType.value === 'percentage' && (value < 0 || value > 100)) {
    discountValueError.value = t('admin.discount.value_invalid_percentage')
  }

  if (!Number.isInteger(limit) || limit < 0) {
    monthlyLimitError.value = t('admin.discount.monthly_limit_invalid')
  }

  return discountValueError.value == null && monthlyLimitError.value == null
}

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

watch(discountType, () => {
  discountValueError.value = undefined
})

const saveSettings = async () => {
  if (enterpriseId.value == null) return
  if (!validateForm()) return

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
    <AdminPageHeader :title="$t('admin.discount.title')" />

    <v-alert type="info" variant="tonal" class="mb-6" density="comfortable">
      {{ $t('admin.discount.note') }}
    </v-alert>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-card v-else max-width="640">
      <v-card-text>
        <div class="d-flex flex-column ga-4">
          <div>
            <div class="text-body-2 mb-2">{{ $t('admin.discount.type') }}</div>
            <v-radio-group v-model="discountType" hide-details inline>
              <v-radio :label="$t('admin.discount.type_fixed')" value="fixed" />
              <v-radio :label="$t('admin.discount.type_percentage')" value="percentage" />
            </v-radio-group>
          </div>
          <v-text-field
            v-model.number="discountValue"
            type="number"
            :suffix="discountValueSuffix"
            :label="discountType === 'fixed' ? $t('admin.discount.value_fixed') : $t('admin.discount.value_percentage')"
            :error-messages="discountValueError"
          />
          <v-text-field
            v-model.number="monthlyLimitPerUser"
            type="number"
            suffix="円"
            :label="$t('admin.discount.monthly_limit')"
            :error-messages="monthlyLimitError"
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
