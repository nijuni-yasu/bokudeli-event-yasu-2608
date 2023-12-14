<script setup lang="ts">
import { ShopNotice } from '@/schemes/eventCreate'
import { cloneDeep } from 'lodash'

const props = defineProps<{
  modelValue: ShopNotice
}>()

const emit = defineEmits<{
  (e: 'submit', value: ShopNotice): void
  (e: 'back'): void
}>()

const state = reactive(cloneDeep(props.modelValue))

const pickUpPlace = ref('')
const message = ref('')

const submit = () => {
  state.organizerMemo = [pickUpPlace.value, message.value].join('\n')
  emit('submit', state)
}
const back = () => {
  emit('back')
}

</script>

<template>
  <v-row class="justify-center">
    <v-col cols="12" sm="12" md="9" class="px-0">
      <v-card flat class="mt-2">
        <v-form class="multi-col-validation">
          <v-card-title class="pa-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-phone-classic" />
            <span>店舗への連絡事項</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row class="justify-center">
              <v-col cols="12">
                <v-text-field v-model="state.organizerFullName" outlined dense label="担当者 氏名"></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field v-model="state.organizerCompany" outlined dense label="会社名/団体名"></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field v-model="state.organizerEmail" outlined dense label="メールアドレス"></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="state.organizerPhonePersonal"
                  outlined
                  dense
                  label="電話番号（担当者）"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="state.organizerPhoneCompany"
                  outlined
                  dense
                  label="電話番号（会社/団体）"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea v-model="pickUpPlace" outlined rows="3" label="配達受取場所について"></v-textarea>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="message"
                  outlined
                  rows="3"
                  label="イベントやフードの相談事項・連絡事項"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="text-center mt-10">
            <v-btn color="primary" class="me-3 mt-3" size="large" variant="outlined" prepend-icon="mdi-chevron-left" @click="back">前へ</v-btn>
            <v-btn color="primary" class="mt-3" size="large" prepend-icon="mdi-calendar-plus" @click="submit">下書きをプレビューする</v-btn>
          </v-card-text>
          <v-card-text class="text-center mx-0">
            <v-btn color="grey-900" class="mt-3" size="large" prepend-icon="mdi-email">店舗に予約申請メールする</v-btn>
          </v-card-text>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
