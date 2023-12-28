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

const pickerConfig = {
  locale: Japanese,
}

const props = defineProps<{
  modelValue: Partial<BokudeliEvent>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Partial<BokudeliEvent>): void
  (e: 'submit'): void
}>()

const submit = () => {
  emit('submit')
}

const event = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const _eventStartDate = ref<string | null>(null)
const eventStartDate = computed({
  get: () => _eventStartDate.value == null ? dateString(props.modelValue.event_start_datetime?.toDate() ?? null) : _eventStartDate.value,
  set: (value) => _eventStartDate.value = value
})
const _eventStartHour = ref<string | null>(null)
const eventStartHour = computed({
  get: () => _eventStartHour.value == null ? hourString(props.modelValue.event_start_datetime?.toDate() ?? null) : _eventStartHour.value,
  set: (value) => _eventStartHour.value = value
})
const _eventStartMinute = ref<string | null>(null)
const eventStartMinute = computed({
  get: () => _eventStartMinute.value == null ? minutesString(props.modelValue.event_start_datetime?.toDate() ?? null) : _eventStartMinute.value,
  set: (value) => _eventStartMinute.value = value
})
const _eventEndDate = ref<string | null>(null)
const eventEndDate = computed({
  get: () => _eventEndDate.value == null ? dateString(props.modelValue.event_end_datetime?.toDate() ?? null) : _eventEndDate.value,
  set: (value) => _eventEndDate.value = value
})
const _eventEndHour = ref<string | null>(null)
const eventEndHour = computed({
  get: () => _eventEndHour.value == null ? hourString(props.modelValue.event_end_datetime?.toDate() ?? null) : _eventEndHour.value,
  set: (value) => _eventEndHour.value = value
})
const _eventEndMinute = ref<string | null>(null)
const eventEndMinute = computed({
  get: () => _eventEndMinute.value == null ? minutesString(props.modelValue.event_end_datetime?.toDate() ?? null) : _eventEndMinute.value,
  set: (value) => _eventEndMinute.value = value
})

watchEffect(() => {
  event.value.event_start_datetime = eventStartDate.value == null || eventStartHour.value == null || eventStartMinute.value == null
    ? null
    : Timestamp.fromDate(parseDateTimeStrings(eventStartDate.value, eventStartHour.value, eventStartMinute.value))
  event.value.event_end_datetime = eventEndDate.value == null || eventEndHour.value == null || eventEndMinute.value == null
    ? null
    : Timestamp.fromDate(parseDateTimeStrings(eventEndDate.value, eventEndHour.value, eventEndMinute.value))
})

watchEffect(async () => {
  const postalcode = event.value.event_postalcode
  if (postalcode == null || /^\d{3}-?\d{4}$/.test(postalcode) === false) {
    return
  }
  const location = await fetchLocationByPostalcode(postalcode)
  event.value.event_address = location.address
})

const submitValidation = computed(() => event.value.event_postalcode &&
         event.value.event_start_datetime != null &&
         event.value.event_end_datetime != null &&
         event.value.event_start_datetime < event.value.event_end_datetime
)
</script>
<template>
  <v-row class="justify-center">
    <v-col cols="12" sm="12" md="9" class="px-0">
      <v-card flat class="mt-3">
        <v-form class="multi-col-validation">
          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-list-box-outline" />
            <span>タイトル</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="event.event_name" outlined dense label="イベントタイトル" />
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-map-marker" />
            <span>会場</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12" sm="12" md="3">
                <v-text-field
                  v-model="event.event_postalcode"
                  outlined
                  dense
                  label="お届け先 郵便番号"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="event.event_address" outlined dense label="会場住所" />
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12" sm="12" md="6">
                <v-text-field v-model="event.event_place" outlined dense label="会場名" />
              </v-col>
              <v-col cols="12" sm="12" md="6">
                <v-text-field v-model="event.event_place_url" outlined dense label="会場URL" />
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-calendar" />
            <span>開催日時</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12" sm="12" md="6">
                <app-date-time-picker
                  v-model="eventStartDate"
                  :config="pickerConfig"
                  outlined
                  dense
                  label="開始日"
                ></app-date-time-picker>
              </v-col>
              <v-col cols="6" sm="6" md="3">
                <v-select v-model="eventStartHour" :items="hourList" outlined dense label="時" />
              </v-col>
              <v-col cols="6" sm="6" md="3">
                <v-select v-model="eventStartMinute" :items="minutesList" outlined dense label="分" />
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12" sm="12" md="6">
                <app-date-time-picker
                  v-model="eventEndDate"
                  :config="pickerConfig"
                  outlined
                  dense
                  label="終了日"
                ></app-date-time-picker>
              </v-col>
              <v-col cols="6" sm="6" md="3">
                <v-select v-model="eventEndHour" :items="hourList" outlined dense label="時" />
              </v-col>
              <v-col cols="6" sm="6" md="3">
                <v-select v-model="eventEndMinute" :items="minutesList" outlined dense label="分" />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-text class="text-center mt-10">
            <v-btn color="primary" class="me-3 mt-3" size="large" append-icon="mdi-chevron-right" :disabled="!submitValidation" @click="submit">次へ</v-btn>
          </v-card-text>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
