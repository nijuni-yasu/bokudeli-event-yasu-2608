<script setup lang="ts">
import BokudeliEvent, { eventPaymentItems } from '@/schemes/bokudeliEvent'
import {
  dateString,
  hourString,
  minutesString,
  hourList,
  minutesList,
} from '@/schemes/eventCreate'
import AppDateTimePicker from '@core/components/app-form-elements/AppDateTimePicker.vue'
import { Japanese } from 'flatpickr/dist/l10n/ja'

const pickerConfig = {
  locale: Japanese,
}

const props = defineProps<{
  modelValue: Partial<BokudeliEvent>
  coverImage: File | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Partial<BokudeliEvent>): void
  (e: 'update:coverImage', value: File | null): void
  (e: 'submit'): void
  (e: 'back'): void
}>()

const event = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const fileInputRef = ref<HTMLInputElement | null>(null)
const coverUrl = computed(() => {
  if (props.coverImage) {
    return URL.createObjectURL(props.coverImage)
  }
  return event.value.event_cover_url
})

const eventDeadlineDate = computed(() => dateString(props.modelValue.event_deadline_datetime?.toDate() ?? null))
const eventDeadlineHour = computed(() => hourString(props.modelValue.event_deadline_datetime?.toDate() ?? null))
const eventDeadlineMinute = computed(() => minutesString(props.modelValue.event_deadline_datetime?.toDate() ?? null))

const onTriggerUpload = () => {
  fileInputRef.value?.click()
}

const onFileChange = (e: Event) => {
  const eventTarget = e.target as HTMLInputElement
  if (!eventTarget?.files || eventTarget?.files.length === 0) {
    return
  }
  const file = eventTarget.files[0]
  if (file) {
    emit('update:coverImage', file)
  }
}
</script>

<template>
  <v-row class="justify-center">
    <v-col cols="12" sm="12" md="9" class="px-0">
      <v-card flat class="mt-2">
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
                  <v-img v-if="coverUrl" :src="coverUrl"></v-img>
                  <div v-else class="placeholder">イベント画像をアップロード<br />1200px X 630px</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-textarea v-model="event.event_desc" outlined rows="10" label="イベント詳細"></v-textarea>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12" sm="12" md="6">
                <app-date-time-picker
                  :model-value="eventDeadlineDate"
                  :config="pickerConfig"
                  outlined
                  dense
                  label="注文締切日時"
                  :readonly="true"
                ></app-date-time-picker>
              </v-col>
              <v-col cols="6" sm="6" md="3">
                <v-select :model-value="eventDeadlineHour" :items="hourList" outlined dense label="時間" :readonly="true"></v-select>
              </v-col>
              <v-col cols="6" sm="6" md="3">
                <v-select :model-value="eventDeadlineMinute" :items="minutesList" outlined dense label="分" :readonly="true"></v-select>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-text-field v-model.number="event.event_max_people" type="number" outlined dense label="定員数"></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <!-- Activity -->
          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-lightbulb-on-outline" />
            <span>公開設定</span>
          </v-card-title>
          <v-card-text>
            <v-switch v-model="event.is_public" hide-details class="mt-0">
              <template #label> 公開イベント </template>
            </v-switch>
          </v-card-text>
          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-account-credit-card-outline" />
            <span>支払い設定</span>
          </v-card-title>
          <v-card-text>
            <v-col cols="12" sm="12" md="6">
              <v-select v-model="event.event_payment" :items="eventPaymentItems" hide-details class="mt-0">
                <template #label> 支払い設定 </template>
              </v-select>
            </v-col>
          </v-card-text>
          <v-card-text class="text-center mt-10">
            <v-btn color="primary" class="me-3 mt-3" size="large" prepend-icon="mdi-chevron-left" @click="emit('back')">前へ</v-btn>
            <v-btn color="primary" class="me-3 mt-3" size="large" append-icon="mdi-chevron-right" @click="emit('submit')">次へ</v-btn>
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
