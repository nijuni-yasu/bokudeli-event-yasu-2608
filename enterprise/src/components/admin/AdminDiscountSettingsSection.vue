<script setup lang="ts">
import type { EnterpriseDiscountType } from '@shokujii/common/schemas/Enterprise.js'
import type { EnterpriseSubsidySettingsEntryType } from '@shokujii/common/schemas/EnterpriseSubsidySettings.js'
import { YEAR_MONTH_PATTERN } from '@shokujii/common/schemas/EnterpriseSubsidySettings.js'
import { formatYearMonth } from '@shokujii/common/utils/datetime.js'
import { useNotification } from '@shokujii/base/composable/notification'
import { updateEnterpriseSubsidySettings } from '@/apis/enterprise'
import { formatYearMonthLabel } from '@/composable/enterpriseMemberMonthlyUsageHistory.js'

const props = defineProps<{
  enterpriseId: string
  subsidySettingsHistory: EnterpriseSubsidySettingsEntryType[]
}>()

const emit = defineEmits<{
  saved: []
}>()

const discountType = defineModel<EnterpriseDiscountType>('discountType', { required: true })
const discountValue = defineModel<number>('discountValue', { required: true })
const monthlyLimitPerUser = defineModel<number>('monthlyLimitPerUser', { required: true })

const { t } = useI18n()
const notification = useNotification()

/** 割引種別を割合に切り替えた際の初期値（%）。固定額の値をそのまま % に流用しないためのリセット値 */
const DEFAULT_PERCENTAGE_DISCOUNT = 50

const saving = ref(false)
const discountValueError = ref<string>()
const monthlyLimitError = ref<string>()
const effectiveFromMonthError = ref<string>()

function getMinimumEffectiveFromMonth(): string {
  const current = formatYearMonth(Date.now())
  const [yearText, monthText] = current.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
}

const effectiveFromMonth = ref(getMinimumEffectiveFromMonth())

const discountValueSuffix = computed(() => (discountType.value === 'fixed' ? '円' : '%'))

const sortedHistory = computed(() =>
  [...props.subsidySettingsHistory].sort((a, b) => a.effective_from_month.localeCompare(b.effective_from_month)),
)

const formatDiscountValue = (entry: EnterpriseSubsidySettingsEntryType): string => {
  if (entry.type === 'fixed') {
    return `${entry.value.toLocaleString()}円`
  }
  return `${entry.value}%`
}

const validateForm = (): boolean => {
  discountValueError.value = undefined
  monthlyLimitError.value = undefined
  effectiveFromMonthError.value = undefined

  const value = discountValue.value
  const limit = monthlyLimitPerUser.value
  const month = effectiveFromMonth.value

  if (!YEAR_MONTH_PATTERN.test(month) || month < getMinimumEffectiveFromMonth()) {
    effectiveFromMonthError.value = t('admin.discount.effective_from_month_invalid')
  }

  if (!Number.isInteger(value)) {
    discountValueError.value =
      discountType.value === 'fixed'
        ? t('admin.discount.value_invalid_fixed')
        : t('admin.discount.value_invalid_percentage')
  } else if (discountType.value === 'fixed' && value < 0) {
    discountValueError.value = t('admin.discount.value_invalid_fixed')
  } else if (discountType.value === 'percentage' && (value < 1 || value > 100)) {
    discountValueError.value = t('admin.discount.value_invalid_percentage')
  }

  if (!Number.isInteger(limit) || limit < 0) {
    monthlyLimitError.value = t('admin.discount.monthly_limit_invalid')
  }

  return discountValueError.value == null && monthlyLimitError.value == null && effectiveFromMonthError.value == null
}

watch(discountType, (newType, oldType) => {
  discountValueError.value = undefined
  if (newType === 'percentage' && oldType != null && oldType !== 'percentage') {
    discountValue.value = DEFAULT_PERCENTAGE_DISCOUNT
  }
})

const saveSettings = async () => {
  if (!validateForm()) return

  saving.value = true
  try {
    await updateEnterpriseSubsidySettings({
      enterprise_id: props.enterpriseId,
      effective_from_month: effectiveFromMonth.value,
      discount_type: discountType.value,
      discount_value: discountValue.value,
      monthly_limit_per_user: monthlyLimitPerUser.value,
    })
    effectiveFromMonth.value = getMinimumEffectiveFromMonth()
    notification.show(t('admin.discount.save_success'), 'success')
    emit('saved')
  } catch {
    notification.show(t('admin.discount.save_failed'), 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-card>
    <v-card-text class="pa-8">
      <h2 class="text-h4 mb-2">{{ $t('admin.discount.title') }}</h2>
      <v-alert type="info" variant="tonal" class="mb-6" density="comfortable">
        <div class="pre-line">{{ $t('admin.discount.note') }}</div>
      </v-alert>

      <div class="d-flex flex-column ga-4">
        <v-text-field
          v-model="effectiveFromMonth"
          type="month"
          :label="$t('admin.discount.effective_from_month')"
          :hint="$t('admin.discount.effective_from_month_hint')"
          persistent-hint
          :error-messages="effectiveFromMonthError"
        />
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
          :min="discountType === 'percentage' ? 1 : 0"
          :max="discountType === 'percentage' ? 100 : undefined"
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

      <div v-if="sortedHistory.length > 0" class="mt-8">
        <div class="text-subtitle-1 mb-3">{{ $t('admin.discount.history_title') }}</div>
        <v-table density="comfortable">
          <thead>
            <tr>
              <th class="text-left">{{ $t('admin.discount.history_effective_from_month') }}</th>
              <th class="text-left">{{ $t('admin.discount.type') }}</th>
              <th class="text-right">{{ $t('admin.discount.history_value') }}</th>
              <th class="text-right">{{ $t('admin.discount.monthly_limit') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in sortedHistory" :key="entry.effective_from_month">
              <td>{{ formatYearMonthLabel(entry.effective_from_month) }}</td>
              <td>
                {{ entry.type === 'fixed' ? $t('admin.discount.type_fixed') : $t('admin.discount.type_percentage') }}
              </td>
              <td class="text-right">{{ formatDiscountValue(entry) }}</td>
              <td class="text-right">{{ entry.monthly_limit_per_user.toLocaleString() }}円</td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card-text>
    <v-card-actions class="justify-end px-8 pb-8 pt-0">
      <v-btn color="primary" variant="flat" :loading="saving" @click="saveSettings">
        {{ $t('admin.settings.save') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
