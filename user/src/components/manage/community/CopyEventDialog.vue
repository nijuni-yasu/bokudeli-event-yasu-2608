<script setup lang="ts">
import { DateTime } from 'luxon'
import { useI18n } from 'vue-i18n'
import {
  computeEventRepeatCopyPreviewStartTimes,
  convertToDateString,
  convertToDatetimeWeekdayShort,
  getDayOfWeek,
  getEventDateTimeRangeDurationMs,
  getStartOfDay,
  getWeekNumberInMonthFromMillis,
  isInShopTime,
  parseDatetimeStrings,
  DEFAULT_TIME_ZONE,
} from '@shokujii/common/utils/datetime.js'
import { eventCopy } from '@shokujii/base/apis/eventCopy.js'
import { eventCopyRepeat } from '@shokujii/base/apis/eventCopyRepeat.js'
import EventList from '@shokujii/base/components/EventList.vue'
import DateInput from '@shokujii/base/components/DateInput.vue'
import type { BokudeliEvent } from '@shokujii/base/stores/event.js'
import { BokudeliPartnerShop, usePartnerStore } from '@shokujii/base/stores/partner'
import {
  mdiNumeric1CircleOutline,
  mdiNumeric2CircleOutline,
  mdiNumeric3CircleOutline,
  mdiNumeric4CircleOutline,
  mdiNumeric5CircleOutline,
  mdiNumeric6CircleOutline,
  mdiNumeric7CircleOutline,
} from '@mdi/js'

defineProps<{
  communityAccount: string
}>()

const dialog = defineModel<boolean>()

export type CopyEventSuccessPayload =
  | { mode: 'single'; newEventId: string }
  | { mode: 'repeat'; successCount: number; failureCount: number; newEventIds: string[] }

const emit = defineEmits<{
  success: [payload: CopyEventSuccessPayload]
  error: []
}>()

const { t: $t } = useI18n()

const copyType = ref<'single' | 'repeat'>('single')
const selectedEvent = ref<BokudeliEvent | null>(null)
const isCreating = ref(false)

const targetDateTime = ref<number | null>(null)
const repeatStartDateTime = ref<number | null>(null)

const repeatInterval = ref(1)
const repeatUnit = ref<'day' | 'week' | 'month' | 'year'>('week')
const monthlyPattern = ref<'date' | 'weekday'>('date')
const repeatCount = ref(4)

const MAX_REPEAT_COUNT = 12

const numericStepCircleIcons = [
  mdiNumeric1CircleOutline,
  mdiNumeric2CircleOutline,
  mdiNumeric3CircleOutline,
  mdiNumeric4CircleOutline,
  mdiNumeric5CircleOutline,
  mdiNumeric6CircleOutline,
  mdiNumeric7CircleOutline,
] as const

function stepNumericCircleIcon(step: number): (typeof numericStepCircleIcons)[number] {
  if (step < 1 || step > numericStepCircleIcons.length) {
    return mdiNumeric1CircleOutline
  }
  return numericStepCircleIcons[step - 1]!
}

/** 繰り返しコピー回数（1〜MAX_REPEAT_COUNT）のプルダウン用 */
const repeatCountSelectItems = computed(() => {
  const unit = $t('manage.copy_event_modal.repeat_count_unit')
  return Array.from({ length: MAX_REPEAT_COUNT }, (_, i) => {
    const value = i + 1
    return { title: `${value}${unit}`, value }
  })
})

const repeatShowsMonthlyPattern = computed(() => repeatUnit.value === 'month')
const repeatStepCount = computed(() => (repeatShowsMonthlyPattern.value ? 6 : 5))
const repeatStepPreview = computed(() => (repeatShowsMonthlyPattern.value ? 7 : 6))

const eventStartTimeOffset = computed<number>(() => {
  const originalStartDateTime = selectedEvent.value?.event_start_datetime
  if (originalStartDateTime == null) {
    return 0
  }
  return originalStartDateTime - getStartOfDay(originalStartDateTime)
})

const targetDateTimeString = computed<string | null>({
  get: () => {
    if (targetDateTime.value == null) {
      return null
    }
    return convertToDateString(targetDateTime.value)
  },
  set: (value) => {
    if (value == null) {
      targetDateTime.value = null
      return
    }
    targetDateTime.value = parseDatetimeStrings(value, null, null) + eventStartTimeOffset.value
  },
})

const repeatStartDateTimeString = computed<string | null>({
  get: () => {
    if (repeatStartDateTime.value == null) {
      return null
    }
    return convertToDateString(repeatStartDateTime.value)
  },
  set: (value) => {
    if (value == null) {
      repeatStartDateTime.value = null
      return
    }
    repeatStartDateTime.value = parseDatetimeStrings(value, null, null) + eventStartTimeOffset.value
  },
})

const selectedShop = computed<BokudeliPartnerShop | null | undefined>(() => {
  const partnerId = selectedEvent.value?.partner_id
  if (partnerId == null) {
    return undefined
  }
  const partnerStore = usePartnerStore(partnerId)
  return partnerStore.shops?.find((s) => s.shop_id === selectedEvent.value?.shop_id) ?? null
})

const MIN_DAYS_AHEAD = 14
const MAX_SEARCH_DAYS = 7

watch([selectedEvent, selectedShop], ([event, shop]) => {
  const originalStartDateTime = event?.event_start_datetime
  if (originalStartDateTime == null || shop == null) {
    return
  }

  const offset = eventStartTimeOffset.value
  const searchStart = getStartOfDay(Date.now() + MIN_DAYS_AHEAD * 24 * 60 * 60 * 1000)
  const oneDay = 24 * 60 * 60 * 1000

  for (let i = 0; i < MAX_SEARCH_DAYS; i++) {
    const candidateTime = getStartOfDay(searchStart + i * oneDay) + offset
    if (isInShopTime(candidateTime, shop)) {
      targetDateTime.value = candidateTime
      repeatStartDateTime.value = candidateTime
      return
    }
  }

  targetDateTime.value = null
  repeatStartDateTime.value = null
})

const allowedDates = (date: unknown) => {
  if (!(date instanceof Date)) {
    return true
  }
  if (date.getTime() < Date.now()) {
    return false
  }
  const shop = selectedShop.value
  if (shop === undefined || selectedEvent.value?.event_start_datetime == null) {
    return false
  }
  if (shop === null) {
    return true
  }
  const targetTime = getStartOfDay(date.getTime()) + eventStartTimeOffset.value
  return isInShopTime(targetTime, shop)
}

const clampedRepeatCount = computed(() => {
  const n = Math.floor(Number(repeatCount.value))
  if (!Number.isFinite(n)) {
    return 4
  }
  return Math.min(MAX_REPEAT_COUNT, Math.max(1, n))
})

const previewStartTimes = computed(() => {
  const shop = selectedShop.value
  if (copyType.value !== 'repeat' || shop == null || selectedEvent.value == null || repeatStartDateTime.value == null) {
    return []
  }
  const { startTimes } = computeEventRepeatCopyPreviewStartTimes({
    startMs: repeatStartDateTime.value,
    repeatCount: clampedRepeatCount.value,
    repeatInterval: repeatInterval.value,
    repeatUnit: repeatUnit.value,
    monthlyPattern: monthlyPattern.value,
    zone: DEFAULT_TIME_ZONE,
    isShopOpen: (ms) => isInShopTime(ms, shop),
  })
  return startTimes
})

const previewEventDurationMs = computed(() =>
  getEventDateTimeRangeDurationMs(selectedEvent.value?.event_start_datetime, selectedEvent.value?.event_end_datetime),
)

const monthlyPatternDescription = computed(() => {
  if (repeatUnit.value !== 'month' || repeatStartDateTime.value == null) {
    return ''
  }
  const ms = repeatStartDateTime.value
  if (monthlyPattern.value === 'date') {
    const day = DateTime.fromMillis(ms, { zone: DEFAULT_TIME_ZONE }).day
    return $t('manage.copy_event_modal.preview_monthly_date', { day })
  }
  const weekNumber = getWeekNumberInMonthFromMillis(ms)
  const dow = getDayOfWeek(ms)
  const dayOfWeekLabels = [
    $t('manage.copy_event_modal.day_of_week.0'),
    $t('manage.copy_event_modal.day_of_week.1'),
    $t('manage.copy_event_modal.day_of_week.2'),
    $t('manage.copy_event_modal.day_of_week.3'),
    $t('manage.copy_event_modal.day_of_week.4'),
    $t('manage.copy_event_modal.day_of_week.5'),
    $t('manage.copy_event_modal.day_of_week.6'),
  ]
  const weekNumberLabels = [
    '',
    $t('manage.copy_event_modal.week_number.1'),
    $t('manage.copy_event_modal.week_number.2'),
    $t('manage.copy_event_modal.week_number.3'),
    $t('manage.copy_event_modal.week_number.4'),
    $t('manage.copy_event_modal.week_number.5'),
  ]
  const dayOfWeek = dayOfWeekLabels[dow] ?? ''
  const weekStr = weekNumberLabels[weekNumber] ?? String(weekNumber)
  return $t('manage.copy_event_modal.preview_monthly_weekday', { week: weekStr, dayOfWeek })
})

const validationErrors = computed(() => {
  const errors: string[] = []
  if (selectedEvent.value == null) {
    errors.push($t('manage.copy_event_modal.validation.select_event'))
    return errors
  }
  if (copyType.value !== 'repeat') {
    return errors
  }
  const n = Math.floor(Number(repeatCount.value))
  if (!Number.isFinite(n) || n < 1 || n > MAX_REPEAT_COUNT) {
    errors.push($t('manage.copy_event_modal.validation.max_count'))
    return errors
  }
  if (previewStartTimes.value.length === 0 && selectedShop.value != null) {
    errors.push($t('manage.copy_event_modal.validation.no_dates'))
  }
  return errors
})

const canCreate = computed(() => {
  if (selectedEvent.value == null) {
    return false
  }
  if (validationErrors.value.length > 0) {
    return false
  }
  if (copyType.value === 'single') {
    return targetDateTimeString.value != null
  }
  return previewStartTimes.value.length > 0
})

const showShortNotice = computed(
  () =>
    copyType.value === 'repeat' &&
    previewStartTimes.value.length > 0 &&
    previewStartTimes.value.length < clampedRepeatCount.value,
)

const handleEventClick = (event: BokudeliEvent) => {
  selectedEvent.value = event
}

const createEvents = async () => {
  if (!canCreate.value || selectedEvent.value == null) {
    return
  }
  isCreating.value = true
  try {
    if (copyType.value === 'single') {
      if (targetDateTime.value == null) {
        return
      }
      const result = await eventCopy({
        srcEventId: selectedEvent.value.event_id,
        startTime: targetDateTime.value,
      })
      emit('success', { mode: 'single', newEventId: result.data.newEventId })
    } else {
      const startTimes = previewStartTimes.value
      if (startTimes.length === 0) {
        return
      }
      const result = await eventCopyRepeat({
        srcEventId: selectedEvent.value.event_id,
        startTimes,
      })
      const { successCount, failureCount, results } = result.data
      const newEventIds = results.filter((r) => r.ok).map((r) => r.newEventId)
      if (successCount === 0) {
        emit('error')
      } else {
        emit('success', { mode: 'repeat', successCount, failureCount, newEventIds })
      }
    }
  } catch (error: unknown) {
    console.error('Error creating events:', error)
    emit('error')
  } finally {
    dialog.value = false
    isCreating.value = false
  }
}

const closeDialog = () => {
  selectedEvent.value = null
  targetDateTime.value = null
  repeatStartDateTime.value = null
  copyType.value = 'single'
  repeatInterval.value = 1
  repeatUnit.value = 'week'
  monthlyPattern.value = 'date'
  repeatCount.value = 4
  dialog.value = false
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    :max-width="$vuetify.display.smAndDown ? '95vw' : '800px'"
    :fullscreen="$vuetify.display.xs"
    scrollable
    persistent
  >
    <v-card>
      <v-card-title class="text-h4 pa-6">
        {{ $t('manage.copy_event_modal.title') }}
      </v-card-title>

      <v-divider />

      <v-card-text class="px-5 px-sm-8 py-6 py-sm-8" style="max-height: 70vh">
        <v-sheet border rounded="lg" class="pa-5 mb-5">
          <div class="text-h6 font-weight-medium d-flex align-center">
            <v-icon :icon="stepNumericCircleIcon(1)" size="28" class="me-2 text-medium-emphasis" aria-hidden="true" />
            {{ $t('manage.copy_event_modal.select_original') }}
          </div>
          <p class="text-body-2 text-medium-emphasis mt-2 mb-4">
            {{ $t('manage.copy_event_modal.hint_select_original') }}
          </p>
          <div class="event-list-border rounded overflow-y-auto" style="max-height: 300px">
            <div class="pa-2 pa-sm-3">
              <EventList
                :community-account="communityAccount"
                :selected-event-id="selectedEvent?.event_id"
                @click="handleEventClick"
              />
            </div>
          </div>
        </v-sheet>

        <v-sheet border rounded="lg" class="pa-5 mb-5">
          <div class="text-h6 font-weight-medium d-flex align-center">
            <v-icon :icon="stepNumericCircleIcon(2)" size="28" class="me-2 text-medium-emphasis" aria-hidden="true" />
            {{ $t('manage.copy_event_modal.copy_type') }}
          </div>
          <p class="text-body-2 text-medium-emphasis mt-2 mb-4">
            {{ $t('manage.copy_event_modal.hint_copy_type') }}
          </p>
          <v-radio-group v-model="copyType" class="mt-0" hide-details>
            <v-radio :label="$t('manage.copy_event_modal.single_copy')" value="single" class="mb-1" />
            <v-radio :label="$t('manage.copy_event_modal.repeat_copy')" value="repeat" />
          </v-radio-group>
        </v-sheet>

        <template v-if="copyType === 'single'">
          <v-sheet border rounded="lg" class="pa-5 mb-5">
            <div class="text-h6 font-weight-medium d-flex align-center">
              <v-icon :icon="stepNumericCircleIcon(3)" size="28" class="me-2 text-medium-emphasis" aria-hidden="true" />
              {{ $t('manage.copy_event_modal.select_target_date') }}
            </div>
            <p class="text-body-2 text-medium-emphasis mt-2 mb-4">
              {{ $t('manage.copy_event_modal.hint_single_target_date') }}
            </p>
            <v-row dense justify="start">
              <v-col cols="12" sm="5" md="5">
                <DateInput
                  v-model="targetDateTimeString"
                  :label="$t('manage.copy_event_modal.field_open_date')"
                  :allowed-dates="allowedDates"
                  :disabled="selectedEvent === null"
                />
              </v-col>
            </v-row>
          </v-sheet>
        </template>

        <template v-else>
          <v-sheet border rounded="lg" class="pa-5 mb-5">
            <div class="text-h6 font-weight-medium d-flex align-center">
              <v-icon :icon="stepNumericCircleIcon(3)" size="28" class="me-2 text-medium-emphasis" aria-hidden="true" />
              {{ $t('manage.copy_event_modal.start_date') }}
            </div>
            <p class="text-body-2 text-medium-emphasis mt-2 mb-4">
              {{ $t('manage.copy_event_modal.hint_repeat_start_date') }}
            </p>
            <v-row dense justify="start">
              <v-col cols="12" sm="5" md="5">
                <DateInput
                  v-model="repeatStartDateTimeString"
                  :label="$t('manage.copy_event_modal.field_open_date')"
                  :allowed-dates="allowedDates"
                  :disabled="selectedEvent === null"
                />
              </v-col>
            </v-row>
          </v-sheet>

          <v-sheet border rounded="lg" class="pa-5 mb-5">
            <div class="text-h6 font-weight-medium d-flex align-center">
              <v-icon :icon="stepNumericCircleIcon(4)" size="28" class="me-2 text-medium-emphasis" aria-hidden="true" />
              {{ $t('manage.copy_event_modal.repeat_interval') }}
            </div>
            <p class="text-body-2 text-medium-emphasis mt-2 mb-4">
              {{ $t('manage.copy_event_modal.hint_repeat_interval') }}
            </p>
            <v-row dense justify="start">
              <v-col cols="12" sm="2" md="2">
                <v-text-field
                  v-model.number="repeatInterval"
                  type="number"
                  :min="1"
                  :max="365"
                  :label="$t('manage.copy_event_modal.repeat_interval_number')"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="3" md="3">
                <v-select
                  v-model="repeatUnit"
                  :label="$t('manage.copy_event_modal.repeat_interval_unit')"
                  :items="[
                    { title: $t('manage.copy_event_modal.interval_unit.day'), value: 'day' },
                    { title: $t('manage.copy_event_modal.interval_unit.week'), value: 'week' },
                    { title: $t('manage.copy_event_modal.interval_unit.month'), value: 'month' },
                    { title: $t('manage.copy_event_modal.interval_unit.year'), value: 'year' },
                  ]"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-sheet>

          <v-sheet v-if="repeatUnit === 'month'" border rounded="lg" class="pa-5 mb-5">
            <div class="text-h6 font-weight-medium d-flex align-center">
              <v-icon :icon="stepNumericCircleIcon(5)" size="28" class="me-2 text-medium-emphasis" aria-hidden="true" />
              {{ $t('manage.copy_event_modal.monthly_pattern') }}
            </div>
            <p class="text-body-2 text-medium-emphasis mt-2 mb-4">
              {{ $t('manage.copy_event_modal.hint_monthly_pattern') }}
            </p>
            <v-radio-group v-model="monthlyPattern" class="mt-0" hide-details>
              <v-radio :label="$t('manage.copy_event_modal.monthly_pattern_date')" value="date" class="mb-1" />
              <v-radio :label="$t('manage.copy_event_modal.monthly_pattern_weekday')" value="weekday" />
            </v-radio-group>
          </v-sheet>

          <v-sheet border rounded="lg" class="pa-5 mb-5">
            <div class="text-h6 font-weight-medium d-flex align-center">
              <v-icon
                :icon="stepNumericCircleIcon(repeatStepCount)"
                size="28"
                class="me-2 text-medium-emphasis"
                aria-hidden="true"
              />
              {{ $t('manage.copy_event_modal.repeat_count') }}
            </div>
            <p class="text-body-2 text-medium-emphasis mt-2 mb-4">
              {{ $t('manage.copy_event_modal.hint_repeat_count') }}
            </p>
            <v-row dense justify="start">
              <v-col cols="12" sm="5" md="5">
                <v-select
                  v-model="repeatCount"
                  :items="repeatCountSelectItems"
                  :label="$t('manage.copy_event_modal.repeat_count_field')"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-sheet>

          <v-sheet v-if="selectedEvent != null && previewStartTimes.length > 0" border rounded="lg" class="pa-5 mb-5">
            <div class="text-h6 font-weight-medium d-flex align-center">
              <v-icon
                :icon="stepNumericCircleIcon(repeatStepPreview)"
                size="28"
                class="me-2 text-medium-emphasis"
                aria-hidden="true"
              />
              {{ $t('manage.copy_event_modal.preview_title') }}
            </div>
            <p class="text-body-2 text-medium-emphasis mt-2 mb-3">
              {{ $t('manage.copy_event_modal.preview_intro') }}
            </p>
            <v-alert type="info" variant="tonal" class="mb-0">
              <div class="text-body-1 mb-2">
                {{ $t('manage.copy_event_modal.preview_count', { count: previewStartTimes.length }) }}
              </div>
              <div v-if="repeatUnit === 'month'" class="text-body-2 mb-2">
                {{ monthlyPatternDescription }}
              </div>
              <div v-if="showShortNotice" class="text-body-2 mb-2">
                {{
                  $t('manage.copy_event_modal.preview_short_notice', {
                    requested: clampedRepeatCount,
                    actual: previewStartTimes.length,
                  })
                }}
              </div>
              <div class="text-body-2">
                <div v-for="(ts, index) in previewStartTimes" :key="`${ts}-${index}`">
                  <template v-if="previewEventDurationMs != null">
                    {{
                      $t('event_card.date', [$d(ts, 'datetime_weekday_short'), $d(ts + previewEventDurationMs, 'time')])
                    }}
                  </template>
                  <template v-else>
                    {{ convertToDatetimeWeekdayShort(ts) }}
                  </template>
                </div>
              </div>
            </v-alert>
          </v-sheet>
        </template>

        <v-alert v-if="validationErrors.length > 0" type="error" variant="tonal" class="mb-2 rounded-lg">
          <div v-for="(err, index) in validationErrors" :key="index">{{ err }}</div>
        </v-alert>

        <div v-if="isCreating" class="mb-2">
          <v-progress-linear indeterminate color="primary" />
          <div class="text-center text-body-2 mt-2">{{ $t('manage.copy_event_modal.creating') }}</div>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="px-5 px-sm-8 py-5">
        <v-spacer />
        <v-btn variant="text" :loading="isCreating" @click="closeDialog">
          {{ $t('cancel') }}
        </v-btn>
        <v-btn color="primary" variant="flat" @click="createEvents" :disabled="!canCreate" :loading="isCreating">
          {{
            copyType === 'single'
              ? $t('manage.copy_event_modal.create_button')
              : $t('manage.copy_event_modal.create_multiple_button', { count: previewStartTimes.length })
          }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.event-list-border {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
