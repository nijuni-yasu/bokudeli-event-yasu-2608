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
import AppDateTimePicker from '@core/components/app-form-elements/AppDateTimePicker.vue'
import { Japanese } from 'flatpickr/dist/l10n/ja'
import { fetchLocationByPostalcode } from '@/composable/fetchLocation'
import { Timestamp } from 'firebase/firestore'
import { useValidators } from '@/composable/validators'
import { mdiMapMarker, mdiCalendar, mdiChevronRight } from '@mdi/js'

const pickerConfig = {
  locale: Japanese,
}

const props = defineProps<{
  modelValue: BokudeliEvent
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: BokudeliEvent): void
  (e: 'submit'): void
}>()

const { requiredValidator, postalCodeValidator, urlValidator } = useValidators()

const submit = () => {
  emit('submit')
}

const event = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isValid = ref(false)

// 新規作成の場合の初期値設定
if (event.value.event_start_datetime == null) {
  event.value.event_start_datetime = Timestamp.fromMillis(new Date().getTime() + 7 * 24 * 60 * 60 * 1000) // +7日
}
if (event.value.event_end_datetime == null) {
  event.value.event_end_datetime = Timestamp.fromMillis(
    event.value.event_start_datetime.toMillis() + 1 * 60 * 60 * 1000,
  ) // + 1時間
}

// app-date-time-picker の v-model がリアクティブではないので強制更新用のキーを用意（おそらく app-date-time-picker のバグ）
const eventStartDateKey = ref('eventStartDateKey')
const eventStartDate = computed({
  get: () => dateString(event.value.event_start_datetime?.toDate() ?? null),
  set: (value) => {
    const newValue = Timestamp.fromDate(parseDateTimeStrings(value, eventStartHour.value, eventStartMinute.value))
    updateStartDatetime(newValue)
  },
})
const eventStartHour = computed({
  get: () => hourString(props.modelValue.event_start_datetime?.toDate() ?? null),
  set: (value) => {
    const newValue = Timestamp.fromDate(parseDateTimeStrings(eventStartDate.value, value, eventStartMinute.value))
    updateStartDatetime(newValue)
  },
})
const eventStartMinute = computed({
  get: () => minutesString(props.modelValue.event_start_datetime?.toDate() ?? null),
  set: (value) => {
    const newValue = Timestamp.fromDate(parseDateTimeStrings(eventStartDate.value, eventStartHour.value, value))
    updateStartDatetime(newValue)
  },
})
// app-date-time-picker の v-model がリアクティブではないので強制更新用のキーを用意（おそらく app-date-time-picker のバグ）
const eventEndDateKey = ref('eventEndDateKey')
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
  } else {
    eventStartDateKey.value = `eventStartDateKey${Timestamp.now().toMillis()}}`
  }
  // 終了日時の方が開始日時より前になっていたら終了日時を開始日時+1時間にする
  if (event.value.event_end_datetime == null || newValue >= event.value.event_end_datetime) {
    event.value.event_end_datetime = Timestamp.fromMillis(newValue.toMillis() + 1 * 60 * 60 * 1000)
    eventEndDateKey.value = `eventEndDateKey${Timestamp.now().toMillis()}}`
  }
}

const updateEndDatetime = (newValue: Timestamp) => {
  // 30分のイベントとかがあるかも？
  // 今の所は終了時間が開始時間より後になっていれば良しとする
  if (event.value.event_start_datetime != null && event.value.event_start_datetime < newValue) {
    event.value.event_end_datetime = newValue
  } else {
    eventEndDateKey.value = `eventEndDateKey${Timestamp.now().toMillis()}}`
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
</script>

<template>
  <v-row class="justify-center">
    <v-col cols="12" sm="12" md="9" class="px-0">
      <v-card flat class="mt-3">
        <v-form v-model="isValid" class="multi-col-validation">
          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" :icon="mdiMapMarker" />
            <span>開催場所</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12" sm="12" md="3">
                <v-text-field
                  v-model="event.event_postalcode"
                  outlined
                  dense
                  label="郵便番号"
                  :rules="[requiredValidator, postalCodeValidator]"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="event.event_address"
                  outlined
                  dense
                  label="住所"
                  :rules="[requiredValidator]"
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
                  outlined
                  dense
                  label="会場名"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>
              <v-col cols="12" sm="12" md="6">
                <v-text-field
                  v-model="event.event_place_url"
                  outlined
                  dense
                  label="会場URL"
                  :rules="[urlValidator]"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" :icon="mdiCalendar" />
            <span>開催日時</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12" sm="12" md="6">
                <app-date-time-picker
                  :key="eventStartDateKey"
                  v-model="eventStartDate"
                  :config="pickerConfig"
                  outlined
                  dense
                  label="開始日"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>
              <v-col cols="6" sm="6" md="3">
                <v-select
                  v-model="eventStartHour"
                  :items="hourList"
                  outlined
                  dense
                  label="時"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>
              <v-col cols="6" sm="6" md="3">
                <v-select
                  v-model="eventStartMinute"
                  :items="minutesList"
                  outlined
                  dense
                  label="分"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12" sm="12" md="6">
                <app-date-time-picker
                  :key="eventEndDateKey"
                  v-model="eventEndDate"
                  :config="pickerConfig"
                  outlined
                  dense
                  label="終了日"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>
              <v-col cols="6" sm="6" md="3">
                <v-select
                  v-model="eventEndHour"
                  :items="hourList"
                  outlined
                  dense
                  label="時"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>
              <v-col cols="6" sm="6" md="3">
                <v-select
                  v-model="eventEndMinute"
                  :items="minutesList"
                  outlined
                  dense
                  label="分"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-text class="text-center mt-10">
            <v-btn
              color="primary"
              class="me-3 mt-3"
              size="large"
              :append-icon="mdiChevronRight"
              :disabled="!isValid"
              @click="submit"
              >次へ</v-btn
            >
          </v-card-text>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
