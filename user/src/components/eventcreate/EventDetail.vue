<script setup lang="ts">
import { eventPaymentItems } from '@/schemes/bokudeliEvent'
import {
  EventDetailData,
  dateString,
  hourString,
  minutesString,
  parseDateTimeStrings,
  hourList,
  minutesList,
} from '@/schemes/eventCreate'
import { clone, cloneDeep } from 'lodash'
import AppDateTimePicker from '@core/components/app-form-elements/AppDateTimePicker.vue'
import { Japanese } from 'flatpickr/dist/l10n/ja'

const pickerConfig = {
  locale: Japanese,
}

const props = defineProps<{
  modelValue: EventDetailData
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: EventDetailData): void
  (e: 'submit', value: EventDetailData): void
  (e: 'back'): void
}>()

const state = reactive(cloneDeep(props.modelValue))

const fileInputRef = ref<HTMLInputElement | null>(null)

const eventCoverUrl = ref(clone(state.eventCoverUrl))
const eventDesc = ref(clone(state.eventDesc))
const eventDeadlineDate = ref(dateString(state.eventDeadlineDateTime))
const eventDeadlineHour = ref(hourString(state.eventDeadlineDateTime))
const eventDeadlineMinute = ref(minutesString(state.eventDeadlineDateTime))
const eventMaxPeople = ref(clone(state.eventMaxPeople))
const isPublic = ref(clone(state.isPublic))
const eventPayment = ref(clone(state.eventPayment))
const coverImage = ref<File | null>(null)

const onTriggerUpload = () => {
  fileInputRef.value?.click()
}

const onFileChange = (event: Event) => {
  const eventTarget = event.target as HTMLInputElement
  if (!eventTarget?.files || eventTarget?.files.length === 0) {
    return
  }
  const file = eventTarget.files[0]
  coverImage.value = file
}

const coverImageUrl = computed(() => {
  if (coverImage.value) {
    return URL.createObjectURL(coverImage.value)
  }
  return ''
})

const submit = () => {
  state.eventCoverUrl = eventCoverUrl.value
  state.eventDesc = eventDesc.value
  state.eventDeadlineDateTime = parseDateTimeStrings(
    eventDeadlineDate.value,
    eventDeadlineHour.value,
    eventDeadlineMinute.value,
  )
  state.eventMaxPeople = eventMaxPeople.value
  state.isPublic = isPublic.value
  state.eventPayment = eventPayment.value
  state.eventCoverImage = coverImageUrl.value !== '' ? coverImage.value : null

  emit('update:modelValue', state)
  emit('submit', state)
}

const back = () => {
  emit('back')
}

const resetForm = () => {
  eventCoverUrl.value = clone(state.eventCoverUrl)
  eventDesc.value = clone(state.eventDesc)
  eventDeadlineDate.value = dateString(state.eventDeadlineDateTime)
  eventDeadlineHour.value = hourString(state.eventDeadlineDateTime)
  eventDeadlineMinute.value = minutesString(state.eventDeadlineDateTime)
  eventMaxPeople.value = clone(state.eventMaxPeople)
  isPublic.value = clone(state.isPublic)
  eventPayment.value = clone(state.eventPayment)
}
</script>

<template>
  <v-row class="justify-center">
    <v-col cols="10">
      <v-card flat class="pa-3 mt-2">
        <v-form class="multi-col-validation">
          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-list-box-outline" />
            <span>イベント詳細</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <div class="v-field image-upload-container" @click="onTriggerUpload">
                  <input ref="fileInputRef" class="file-input" type="file" @change="onFileChange" />
                  <v-img v-if="coverImageUrl" :src="coverImageUrl"></v-img>
                  <div v-else class="placeholder">イベント画像をアップロード<br />1200px X 630px</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-textarea v-model="eventDesc" outlined rows="10" label="イベント詳細"></v-textarea>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="6">
                <app-date-time-picker
                  v-model="eventDeadlineDate"
                  :config="pickerConfig"
                  outlined
                  dense
                  label="注文締切日時"
                ></app-date-time-picker>
              </v-col>
              <v-col cols="3">
                <v-select v-model="eventDeadlineHour" :items="hourList" outlined dense label="時間"></v-select>
              </v-col>
              <v-col cols="3">
                <v-select v-model="eventDeadlineMinute" :items="minutesList" outlined dense label="分"></v-select>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="eventMaxPeople" outlined dense label="定員数"></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <!-- Activity -->
          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-lightbulb-on-outline" />
            <span>公開設定</span>
          </v-card-title>
          <v-card-text>
            <v-switch v-model="isPublic" hide-details class="mt-0">
              <template #label> 公開イベント </template>
            </v-switch>
          </v-card-text>
          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-account-credit-card-outline" />
            <span>支払い設定</span>
          </v-card-title>
          <v-card-text>
            <v-col cols="6">
              <v-select v-model="eventPayment" :items="eventPaymentItems" hide-details class="mt-0">
                <template #label> 支払い設定 </template>
              </v-select>
            </v-col>
          </v-card-text>
          <v-card-text class="text-center mt-10">
            <v-btn color="primary" class="me-3 mt-3" size="large" variant="outlined" prepend-icon="mdi-chevron-left" @click="back">前へ</v-btn>
            <v-btn color="primary" class="me-3 mt-3" size="large" append-icon="mdi-chevron-right" @click="submit">次へ</v-btn>
            <v-btn outlined class="mt-3" color="secondary" type="reset" @click="resetForm">リセット</v-btn>
          </v-card-text>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped>
.image-upload-container {
  .file-input {
    display: none;
  }

  position: relative;
  width: 100%;
  aspect-ratio: 1.91;
  max-width: 1200px;
  max-height: 630px;
  border: 1px solid rgba(118, 118, 118, 0.38);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.placeholder {
  text-align: center;
}
</style>
