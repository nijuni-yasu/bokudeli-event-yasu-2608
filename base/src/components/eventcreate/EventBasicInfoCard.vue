<script setup lang="ts">
import { computed, watch } from 'vue'
import { DateTime } from 'luxon'
import {
  hourList,
  minutesList,
  convertToDateString,
  convertToHourString,
  convertToMinuteString,
  parseDatetimeStrings,
} from '@shokujii/common/utils/datetime.js'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { fetchLocationByPostalcode } from '@shokujii/base/utils/fetchLocation'
import DateInput from '../DateInput.vue'
import { useValidators } from '@shokujii/base/composable/validators'
import { mdiMapMarker, mdiCalendar } from '@mdi/js'

const { requiredValidator, postalCodeValidator, urlValidator } = useValidators()

const event = defineModel<BokudeliEvent>({ required: true })

const props = withDefaults(
  defineProps<{
    /** 開催開始日時の選択下限（yyyy-MM-dd 形式、JST）。未指定なら下限なし */
    minStartDate?: string
  }>(),
  {
    minStartDate: undefined,
  },
)

/** v-date-picker の allowedDates に渡す関数（minStartDate 以降のみ選択可） */
// eslint-disable-next-line no-unused-vars
const allowedStartDates = computed<((value: unknown) => boolean) | undefined>(() => {
  const min = props.minStartDate
  if (min == null) {
    return undefined
  }
  return (value: unknown) => {
    if (!(value instanceof Date)) {
      return true
    }
    return DateTime.fromJSDate(value).toFormat('yyyy-MM-dd') >= min
  }
})

// 新規作成の場合の初期値設定
if (event.value.event_start_datetime == null) {
  const today = new Date()
  const defaultStartDate = new Date(today)
  defaultStartDate.setDate(today.getDate() + 14) // +14日
  defaultStartDate.setHours(12)
  defaultStartDate.setMinutes(0)
  event.value.event_start_datetime = defaultStartDate.getTime()
}
if (event.value.event_end_datetime == null) {
  event.value.event_end_datetime = event.value.event_start_datetime + 1 * 60 * 60 * 1000 // + 1時間
}

const eventStartDate = computed({
  get: () => convertToDateString(event.value.event_start_datetime),
  set: (value) => {
    const newValue = parseDatetimeStrings(value, eventStartHour.value, eventStartMinute.value)
    updateStartDatetime(newValue)
  },
})
const eventStartHour = computed({
  get: () => convertToHourString(event.value.event_start_datetime ?? null),
  set: (value) => {
    const newValue = parseDatetimeStrings(eventStartDate.value, value, eventStartMinute.value)
    updateStartDatetime(newValue)
  },
})
const eventStartMinute = computed({
  get: () => convertToMinuteString(event.value.event_start_datetime ?? null),
  set: (value) => {
    const newValue = parseDatetimeStrings(eventStartDate.value, eventStartHour.value, value)
    updateStartDatetime(newValue)
  },
})
// 終了日は開始日と必ず同一日にする
// TODO: 将来的に日付をまたぐイベントを許容する場合、
// イベントページやメールなどの表示側で終了日を表示するよう修正する
const eventEndDate = computed(() => convertToDateString(event.value.event_start_datetime))
const eventEndHour = computed({
  get: () => convertToHourString(event.value.event_end_datetime ?? null),
  set: (value) => {
    const newValue = parseDatetimeStrings(eventEndDate.value, value, eventEndMinute.value)
    updateEndDatetime(newValue)
  },
})
const eventEndMinute = computed({
  get: () => convertToMinuteString(event.value.event_end_datetime ?? null),
  set: (value) => {
    const newValue = parseDatetimeStrings(eventEndDate.value, eventEndHour.value, value)
    updateEndDatetime(newValue)
  },
})

const updateStartDatetime = (newValue: number) => {
  if (Date.now() < newValue) {
    event.value.event_start_datetime = newValue
    // 開始日時を変更したら、終了日時も同じ日付に設定
    event.value.event_end_datetime = newValue + 1 * 60 * 60 * 1000
  }
}

const updateEndDatetime = (newValue: number) => {
  // 30分のイベントとかがあるかも？
  // 今の所は終了時間が開始時間より後になっていれば良しとする
  if (event.value.event_start_datetime < newValue) {
    event.value.event_end_datetime = newValue
  }
}

watch(
  () => event.value.event_postalcode,
  async (postalcode) => {
    if (requiredValidator(postalcode) !== true || postalCodeValidator(postalcode) !== true) {
      event.value.event_address_base = ''
      return
    }
    const requestedPostalcode = postalcode as string
    const location = await fetchLocationByPostalcode(requestedPostalcode)
    // レース対策: 古いリクエストの結果で上書きしない
    if (event.value.event_postalcode !== requestedPostalcode) {
      return
    }
    if (location?.address == null) return

    event.value.event_address_base = location.address
  },
  { immediate: true },
)
const textFieldVariant = computed(() => {
  return event.value.event_status.value === 'in_draft' ? 'outlined' : 'solo-filled'
})
</script>

<template>
  <v-card flat class="mt-3">
    <v-card-title class="pt-10 px-5">
      <v-icon size="50" class="text--primary me-3" :icon="mdiMapMarker" />
      {{ $t('event_basic_info.place') }}
    </v-card-title>

    <v-card-text class="pt-5">
      <v-row>
        <v-col cols="12" sm="12" md="4">
          <v-text-field
            v-model="event.event_postalcode"
            :variant="textFieldVariant"
            dense
            :label="$t('postal_code')"
            :rules="[requiredValidator, postalCodeValidator]"
            :readonly="event.event_status.value !== 'in_draft'"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="event.event_address_base"
            :variant="textFieldVariant"
            dense
            :label="$t('address')"
            :hint="$t('address_hint')"
            persistent-hint
            readonly
            :rules="[requiredValidator]"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="event.event_address_detail"
            :variant="textFieldVariant"
            dense
            :label="$t('detail_address')"
            :placeholder="$t('detail_address_hint')"
            :hint="$t('detail_address_hint')"
            :rules="[requiredValidator]"
            persistent-hint
            :readonly="event.event_status.value !== 'in_draft'"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-text class="pt-5">
      <v-row>
        <v-col cols="12" sm="12" md="6">
          <v-text-field
            v-model="event.event_place"
            variant="outlined"
            dense
            :label="$t('event_basic_info.place_name')"
            :hint="$t('event_basic_info.place_name_hint')"
            persistent-hint
          />
        </v-col>
        <v-col cols="12" sm="12" md="6">
          <v-text-field
            v-model="event.event_place_url"
            variant="outlined"
            dense
            :label="$t('event_basic_info.place_url')"
            :rules="[urlValidator]"
            :hint="$t('event_basic_info.place_url_hint')"
            persistent-hint
          />
        </v-col>
      </v-row>
      <div class="ma-4 text-subtitle-2">
        <span>{{ $t('event_basic_info.address_hint') }}</span>
      </div>
    </v-card-text>

    <v-card-title class="pt-10 px-5">
      <v-icon size="50" class="text--primary me-3" :icon="mdiCalendar" />
      {{ $t('event_basic_info.date') }}
    </v-card-title>

    <v-card-text class="pt-5">
      <v-row>
        <v-col cols="12" sm="12" md="6">
          <DateInput
            v-model="eventStartDate"
            :label="$t('event_basic_info.start_date')"
            :variant="textFieldVariant"
            dense
            :readonly="event.event_status.value !== 'in_draft'"
            :clearable="false"
            :allowed-dates="allowedStartDates"
          />
        </v-col>
        <v-col cols="6" sm="6" md="3">
          <v-select
            v-model="eventStartHour"
            :items="hourList"
            :label="$t('event_basic_info.hour')"
            :variant="textFieldVariant"
            dense
            :readonly="event.event_status.value !== 'in_draft'"
          />
        </v-col>
        <v-col cols="6" sm="6" md="3">
          <v-select
            v-model="eventStartMinute"
            :items="minutesList"
            :label="$t('event_basic_info.minute')"
            :variant="textFieldVariant"
            dense
            :readonly="event.event_status.value !== 'in_draft'"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-text class="pt-5">
      <v-row>
        <v-col cols="12" sm="12" md="6">
          <!-- 終了日は開始日と同一日のため、操作不可の表示のみ -->
          <v-text-field
            :model-value="$d(event.event_start_datetime, 'date')"
            :label="$t('event_basic_info.end_date')"
            :variant="textFieldVariant"
            :prepend-inner-icon="mdiCalendar"
            dense
            readonly
          />
        </v-col>
        <v-col cols="6" sm="6" md="3">
          <v-select
            v-model="eventEndHour"
            :items="hourList"
            :variant="textFieldVariant"
            :label="$t('event_basic_info.hour')"
            dense
            :readonly="event.event_status.value !== 'in_draft'"
          />
        </v-col>
        <v-col cols="6" sm="6" md="3">
          <v-select
            v-model="eventEndMinute"
            :items="minutesList"
            :label="$t('event_basic_info.minute')"
            :variant="textFieldVariant"
            dense
            :readonly="event.event_status.value !== 'in_draft'"
          />
        </v-col>
      </v-row>
    </v-card-text>
    <slot />
  </v-card>
</template>
