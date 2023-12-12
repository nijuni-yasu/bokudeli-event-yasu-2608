<script setup lang="ts">
import {
  BasicInfo,
  hourList,
  minutesList,
  dateString,
  hourString,
  minutesString,
  parseDateTimeStrings,
} from '@/schemes/eventCreate'
import AppDateTimePicker from '@core/components/app-form-elements/AppDateTimePicker.vue'
import { Japanese } from 'flatpickr/dist/l10n/ja'
import { fetchLocationByPostalcode } from '@/composable/fetchLocation'

const pickerConfig = {
  locale: Japanese,
}

const props = defineProps<{
  modelValue: BasicInfo
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: BasicInfo): void
  (e: 'submit'): void
}>()

const submit = () => {
  emit('submit')
}

const state = reactive(props.modelValue)
const eventStartDate = ref(dateString(props.modelValue.startDateTime))
const eventStartHour = ref(hourString(props.modelValue.startDateTime))
const eventStartMinute = ref(minutesString(props.modelValue.startDateTime))
const eventEndDate = ref(dateString(props.modelValue.endDateTime))
const eventEndHour = ref(hourString(props.modelValue.endDateTime))
const eventEndMinute = ref(minutesString(props.modelValue.endDateTime))

watch(state, () => emit('update:modelValue', state))

watchEffect(() => {
  state.startDateTime = eventStartDate.value == null || eventStartHour.value == null || eventStartMinute.value == null
    ? null
    : parseDateTimeStrings(eventStartDate.value, eventStartHour.value, eventStartMinute.value)
  state.endDateTime = eventEndDate.value == null || eventEndHour.value == null || eventEndMinute.value == null
    ? null
    : parseDateTimeStrings(eventEndDate.value, eventEndHour.value, eventEndMinute.value)
})

const changePostalcode = async () => {
  const location = await fetchLocationByPostalcode(state.postalcode)
  state.location = location
  state.address = location.address ?? ''
}

const submitValidation = computed(() => {
  if (state.location && state.startDateTime != null && state.endDateTime != null) {
    // Invalid Date を判定するために getTime() の NaN をチェックする
    const startDateTime = state.startDateTime.getTime()
    const endDateTime = state.endDateTime.getTime()
    if (!Number.isNaN(startDateTime) && !Number.isNaN(endDateTime) && startDateTime < endDateTime) {
      return true;
    }
  }
  return false;
})
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
                <v-text-field v-model="state.title" outlined dense label="イベントタイトル" />
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
                  v-model.lazy="state.postalcode"
                  outlined
                  dense
                  label="お届け先 郵便番号"
                  @change="changePostalcode"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="state.address" outlined dense label="会場住所" />
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12" sm="12" md="6">
                <v-text-field v-model="state.placeName" outlined dense label="会場名" />
              </v-col>
              <v-col cols="12" sm="12" md="6">
                <v-text-field v-model="state.placeUrl" outlined dense label="会場URL" />
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
