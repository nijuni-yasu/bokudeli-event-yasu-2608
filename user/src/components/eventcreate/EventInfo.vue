<script setup lang="ts">
import BokudeliEvent from '@/schemes/bokudeliEvent'

const props = defineProps<{
  event: Partial<BokudeliEvent>
}>()

const emit = defineEmits<{
  (e: 'submit', value: Partial<BokudeliEvent>): void
}>()

const draftEventData = reactive(JSON.parse(JSON.stringify(props.event)) as Partial<BokudeliEvent>)

const submit = () => {
  emit('submit', draftEventData)
}

const resetForm = () => {
  const { eventName, eventDescription, eventAddress, eventStartDatetime, eventDeadline, eventMaxPeople } = props.event

  console.log(eventAddress)
  draftEventData.eventName = eventName
  draftEventData.eventDescription = eventDescription
  draftEventData.eventAddress = eventAddress
  draftEventData.eventStartDatetime = eventStartDatetime
  draftEventData.eventDeadline = eventDeadline
  draftEventData.eventMaxPeople = eventMaxPeople
}
</script>

<template>
  <v-row class="justify-center">
    <v-col cols="10">
      <v-card flat class="pa-3 mt-2">
        <v-form class="multi-col-validation">
          <v-card-title>
            <v-icon size="50" class="text--primary me-3" icon="mdi-chart-timeline-variant" />
            <span>イベント概要</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row class="justify-center">
              <v-col cols="12">
                <v-text-field v-model="draftEventData.eventName" outlined dense label="イベントタイトル"></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="draftEventData.eventDescription"
                  outlined
                  rows="3"
                  label="イベント詳細"
                ></v-textarea>
              </v-col>

              <v-col cols="12">
                <v-text-field outlined dense label="お届け先 郵便番号"></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field v-model="draftEventData.eventAddress" outlined dense label="お届け先 住所"></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="draftEventData.eventStartDatetime"
                  outlined
                  dense
                  label="開催日時"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="draftEventData.eventDeadline" outlined dense label="注文締め切り"></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field outlined dense label="最小人数"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="draftEventData.eventMaxPeople" outlined dense label="最大人数"></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <!-- Activity -->
          <v-card-text>
            <v-switch hide-details class="mt-0">
              <template #label>
                <span class="text-sm ms-2">Email me when someone comments on my article</span>
              </template>
            </v-switch>

            <v-switch hide-details class="mt-5">
              <template #label>
                <span class="text-sm ms-2">Email me when someone answers on my forum thread</span>
              </template>
            </v-switch>

            <v-switch hide-details class="mt-5">
              <template #label>
                <span class="text-sm ms-2">Email me when someone follows me</span>
              </template>
            </v-switch>
            <v-switch hide-details class="mt-5">
              <template #label>
                <span class="text-sm ms-2">Email me when someone comments on my article</span>
              </template>
            </v-switch>

            <v-switch hide-details class="mt-5">
              <template #label>
                <span class="text-sm ms-2">Email me when someone answers on my forum thread</span>
              </template>
            </v-switch>

            <v-switch hide-details class="my-5">
              <template #label>
                <span class="text-sm ms-2">Email me when someone follows me</span>
              </template>
            </v-switch>
          </v-card-text>
          <v-card-text>
            <v-btn color="primary" class="me-3 mt-3" @click="submit">イベント作成</v-btn>
            <v-btn outlined class="mt-3" color="secondary" type="reset" @click="resetForm">リセット</v-btn>
          </v-card-text>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
