<script setup lang="ts">
import {
  hourList,
  minutesList,
  dateString,
  hourString,
  minutesString,
  parseDateTimeStrings,
} from '@/schemes/eventCreate'
import type BokudeliEvent from '@/schemes/bokudeliEvent'
import { fetchLocationByPostalcode } from '@/composable/fetchLocation'
import DateInput from '../DateInput.vue'
import { Timestamp } from 'firebase/firestore'
import { useValidators } from '@/composable/validators'
import { mdiMapMarker, mdiCalendar } from '@mdi/js'

defineProps<{
  readonly?: boolean | null
}>()

const { requiredValidator, postalCodeValidator, urlValidator } = useValidators()

const event = defineModel<BokudeliEvent>({ required: true })

// 新規作成の場合の初期値設定
if (event.value.event_start_datetime == null) {
  event.value.event_start_datetime = Timestamp.fromMillis(new Date().getTime() + 7 * 24 * 60 * 60 * 1000) // +7日
}
if (event.value.event_end_datetime == null) {
  event.value.event_end_datetime = Timestamp.fromMillis(
    event.value.event_start_datetime.toMillis() + 1 * 60 * 60 * 1000,
  ) // + 1時間
}

const eventStartDate = computed({
  get: () => dateString(event.value.event_start_datetime?.toDate() ?? null),
  set: (value) => {
    const newValue = Timestamp.fromDate(parseDateTimeStrings(value, eventStartHour.value, eventStartMinute.value))
    updateStartDatetime(newValue)
  },
})
const eventStartHour = computed({
  get: () => hourString(event.value.event_start_datetime?.toDate() ?? null),
  set: (value) => {
    const newValue = Timestamp.fromDate(parseDateTimeStrings(eventStartDate.value, value, eventStartMinute.value))
    updateStartDatetime(newValue)
  },
})
const eventStartMinute = computed({
  get: () => minutesString(event.value.event_start_datetime?.toDate() ?? null),
  set: (value) => {
    const newValue = Timestamp.fromDate(parseDateTimeStrings(eventStartDate.value, eventStartHour.value, value))
    updateStartDatetime(newValue)
  },
})
const eventEndDate = computed({
  get: () => dateString(event.value.event_end_datetime?.toDate() ?? null),
  set: (value) => {
    const newValue = Timestamp.fromDate(parseDateTimeStrings(value, eventEndHour.value, eventEndMinute.value))
    updateEndDatetime(newValue)
  },
})
const eventEndHour = computed({
  get: () => hourString(event.value.event_end_datetime?.toDate() ?? null),
  set: (value) => {
    const newValue = Timestamp.fromDate(parseDateTimeStrings(eventEndDate.value, value, eventEndMinute.value))
    updateEndDatetime(newValue)
  },
})
const eventEndMinute = computed({
  get: () => minutesString(event.value.event_end_datetime?.toDate() ?? null),
  set: (value) => {
    const newValue = Timestamp.fromDate(parseDateTimeStrings(eventEndDate.value, eventEndHour.value, value))
    updateEndDatetime(newValue)
  },
})

const updateStartDatetime = (newValue: Timestamp) => {
  if (Timestamp.now() < newValue) {
    event.value.event_start_datetime = newValue
  }
  // 終了日時の方が開始日時より前になっていたら終了日時を開始日時+1時間にする
  if (event.value.event_end_datetime == null || newValue >= event.value.event_end_datetime) {
    event.value.event_end_datetime = Timestamp.fromMillis(newValue.toMillis() + 1 * 60 * 60 * 1000)
  }
}

const updateEndDatetime = (newValue: Timestamp) => {
  // 30分のイベントとかがあるかも？
  // 今の所は終了時間が開始時間より後になっていれば良しとする
  if (event.value.event_start_datetime != null && event.value.event_start_datetime < newValue) {
    event.value.event_end_datetime = newValue
  }
}

watchEffect(async () => {
  const postalcode = event.value.event_postalcode
  if (requiredValidator(postalcode) !== true || postalCodeValidator(postalcode) !== true) {
    return
  }
  const location = await fetchLocationByPostalcode(postalcode as string)
  if (location?.address == null || (event.value.event_address?.startsWith(location.address) ?? false)) {
    return
  }
  event.value.event_address = location.address
})

watch(
  () => event.value.event_start_datetime,
  (newValue) => {
    console.log(newValue)
  },
)
</script>

<template>
  <v-card flat class="mt-3">
    <v-card-title class="pt-10 px-5">
      <v-icon size="50" class="text--primary me-3" :icon="mdiMapMarker" />
      {{ $t('event_basic_info.place') }}
    </v-card-title>

    <v-card-text class="pt-5">
      <v-row>
        <v-col cols="12" sm="12" md="3">
          <v-text-field
            v-model="event.event_postalcode"
            outlined
            dense
            :label="$t('postal_code')"
            :rules="[requiredValidator, postalCodeValidator]"
            :readonly="readonly"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="event.event_address"
            outlined
            dense
            :label="$t('address')"
            :rules="[requiredValidator]"
            :readonly="readonly"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-text class="pt-5">
      <v-row>
        <v-col cols="12" sm="12" md="6">
          <v-text-field
            v-model="event.event_place"
            outlined
            dense
            :label="$t('event_basic_info.place_name')"
            :readonly="readonly"
          />
        </v-col>
        <v-col cols="12" sm="12" md="6">
          <v-text-field
            v-model="event.event_place_url"
            outlined
            dense
            :label="$t('event_basic_info.place_url')"
            :rules="[urlValidator]"
            :readonly="readonly"
          />
        </v-col>
      </v-row>
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
            :readonly="readonly"
            :clearable="false"
          />
        </v-col>
        <v-col cols="6" sm="6" md="3">
          <v-select
            v-model="eventStartHour"
            :items="hourList"
            :label="$t('event_basic_info.hour')"
            outlined
            dense
            :readonly="readonly"
          />
        </v-col>
        <v-col cols="6" sm="6" md="3">
          <v-select
            v-model="eventStartMinute"
            :items="minutesList"
            :label="$t('event_basic_info.minute')"
            outlined
            dense
            :readonly="readonly"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-text class="pt-5">
      <v-row>
        <v-col cols="12" sm="12" md="6">
          <DateInput
            v-model="eventEndDate"
            :label="$t('event_basic_info.end_date')"
            :readonly="readonly"
            :clearable="false"
          />
        </v-col>
        <v-col cols="6" sm="6" md="3">
          <v-select
            v-model="eventEndHour"
            :items="hourList"
            :label="$t('event_basic_info.hour')"
            outlined
            dense
            :readonly="readonly"
          />
        </v-col>
        <v-col cols="6" sm="6" md="3">
          <v-select
            v-model="eventEndMinute"
            :items="minutesList"
            :label="$t('event_basic_info.minute')"
            outlined
            dense
            :readonly="readonly"
          />
        </v-col>
      </v-row>
    </v-card-text>
    <slot />
  </v-card>
</template>
