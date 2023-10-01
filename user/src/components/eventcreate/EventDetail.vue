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
          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-list-box-outline" />
            <span>イベント詳細</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="draftEventData.eventCoverUrl" outlined dense label="イベント画像"></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="draftEventData.eventDescription"
                  outlined
                  rows="10"
                  label="イベント詳細"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="6">
                <v-text-field outlined dense label="注文締切日時"></v-text-field>
              </v-col>
              <v-col cols="3">
                <v-text-field outlined dense label="時間"></v-text-field>
              </v-col>
              <v-col cols="3">
                <v-text-field outlined dense label="分"></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-text-field outlined dense label="定員数"></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <!-- Activity -->
          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-lightbulb-on-outline" />
            <span>公開設定</span>
          </v-card-title>
          <v-card-text>
            <v-switch hide-details class="mt-0">
              <template #label> 公開イベント </template>
            </v-switch>
          </v-card-text>
          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-account-credit-card-outline" />
            <span>支払い設定</span>
          </v-card-title>
          <v-card-text>
            <v-col cols="6">
              <v-select
                :items="['user_advance', 'user_on_day', 'community_bill']"
                hide-details class="mt-0"
              >
                <template #label> 支払い設定 </template>
              </v-select>
            </v-col>
          </v-card-text>
          <v-card-text>
            <v-btn color="primary" class="me-3 mt-3" @click="submit">次へ</v-btn>
            <v-btn outlined class="mt-3" color="secondary" type="reset" @click="resetForm">リセット</v-btn>
          </v-card-text>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
