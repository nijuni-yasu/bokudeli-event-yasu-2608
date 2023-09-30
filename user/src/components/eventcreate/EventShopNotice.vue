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
          <v-card-title class="pa-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-phone-classic" />
            <span>店舗への連絡事項</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row class="justify-center">
              <v-col cols="12">
                <v-text-field v-model="draftEventData.eventCoverUrl" outlined dense label="担当者 氏名"></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field v-model="draftEventData.eventName" outlined dense label="会社名/団体名"></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field v-model="draftEventData.eventName" outlined dense label="メールアドレス"></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="draftEventData.eventName"
                  outlined
                  dense
                  label="電話番号（担当者）"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="draftEventData.eventName"
                  outlined
                  dense
                  label="電話番号（会社/団体）"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="draftEventData.eventDescription"
                  outlined
                  rows="3"
                  label="配達受取場所について"
                ></v-textarea>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="draftEventData.eventDescription"
                  outlined
                  rows="3"
                  label="イベントやフードの相談事項・連絡事項"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text>
            <v-btn color="primary" class="me-3 mt-3" @click="submit">上記内容で店舗に予約申請する</v-btn>
            <v-btn color="primary" class="me-3 mt-3" type="save">下書き保存</v-btn>
            <v-btn outlined class="mt-3" color="secondary" type="reset" @click="resetForm">リセット</v-btn>
          </v-card-text>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
