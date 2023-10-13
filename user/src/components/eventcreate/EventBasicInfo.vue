<script setup lang="ts">
import cloneDeep from 'lodash/cloneDeep'
import { BasicInfo, hourList, minutesList } from '@/schemes/eventCreate'
import { format } from 'date-fns'
import { clone } from 'lodash'

const props = defineProps<{
  modelValue: BasicInfo
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: BasicInfo): void
  (e: 'submit', value: BasicInfo): void
}>()

const state = reactive(cloneDeep(props.modelValue))

const dateString = (date: Date | null) => (date ? format(date, 'yyyy-MM-dd') : '')
const hourString = (date: Date | null) => (date ? format(date, 'HH') : null)
const minutesString = (date: Date | null) => (date ? format(date, 'mm') : null)

const title = ref(clone(state.title))
const postcode = ref(clone(state.postcode))
const address = ref(clone(state.address))
const placeName = ref(clone(state.placeName))
const placeUrl = ref(clone(state.placeUrl))
const eventStartDate = ref(dateString(state.startDateTime))
const eventStartHour = ref(hourString(state.startDateTime))
const eventStartMinute = ref(minutesString(state.startDateTime))
const eventEndDate = ref(dateString(state.endDateTime))
const eventEndHour = ref(hourString(state.endDateTime))
const eventEndMinute = ref(minutesString(state.endDateTime))

const submitSearch = () => {
  state.title = title.value
  state.postcode = postcode.value
  state.address = address.value
  state.startDateTime = new Date()
  state.endDateTime = new Date()
  emit('update:modelValue', state)
  emit('submit', state)
}
</script>
<template>
  <v-row class="justify-center">
    <v-col cols="10">
      <v-card flat class="pa-3 mt-2">
        <v-form class="multi-col-validation">
          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-list-box-outline" />
            <span>タイトル</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="title" outlined dense label="イベントタイトル" />
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-map-marker" />
            <span>会場</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="3">
                <v-text-field v-model="postcode" outlined dense label="お届け先 郵便番号" />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="address" outlined dense label="会場住所" />
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="6">
                <v-text-field v-model="placeName" outlined dense label="会場名" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="placeUrl" outlined dense label="会場URL" />
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-calendar" />
            <span>開催日時</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="6">
                <v-text-field v-model="eventStartDate" outlined dense label="開始日" />
              </v-col>
              <v-col cols="3">
                <v-select v-model="eventStartHour" :items="hourList" outlined dense label="時" />
              </v-col>
              <v-col cols="3">
                <v-select v-model="eventStartMinute" :items="minutesList" outlined dense label="分" />
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="6">
                <v-text-field v-model="eventEndDate" outlined dense label="終了日"></v-text-field>
              </v-col>
              <v-col cols="3">
                <v-select v-model="eventEndHour" :items="hourList" outlined dense label="時" />
              </v-col>
              <v-col cols="3">
                <v-select v-model="eventEndMinute" :items="minutesList" outlined dense label="分" />
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text>
            <v-btn color="primary" class="me-3 mt-3" @click="submitSearch"> 検索する </v-btn>
          </v-card-text>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
