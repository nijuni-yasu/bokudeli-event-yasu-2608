<script setup lang="ts">
import type BokudeliEvent from '@/schemes/bokudeliEvent'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const props = defineProps<{
  modelValue: Partial<BokudeliEvent>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Partial<BokudeliEvent>): void
  (e: 'submit'): void
  (e: 'sendReserveMail'): void
  (e: 'back'): void
}>()

const event = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isOpenConfirmDialog = ref(false)
const openConfirmDialog = () => {
  isOpenConfirmDialog.value = true
}
const sendReserveMail = () => {
  emit('sendReserveMail')
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
                <v-text-field v-model="event.organizer_fullname" outlined dense label="担当者 氏名"></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field v-model="event.organizer_company" outlined dense label="会社名/団体名"></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field v-model="event.organizer_email" outlined dense label="メールアドレス"></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="event.organizer_phone_personal"
                  outlined
                  dense
                  label="電話番号（担当者）"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="event.organizer_phone_company"
                  outlined
                  dense
                  label="電話番号（会社/団体）"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea v-model="event.organizer_memo" outlined rows="3" label="配達受取場所について"></v-textarea>
              </v-col>

            </v-row>
          </v-card-text>

          <v-card-text class="text-center mt-10">
            <v-btn color="primary" class="me-3 mt-3" size="large" variant="outlined" prepend-icon="mdi-chevron-left" @click="emit('back')">前へ</v-btn>
            <v-btn color="primary" class="mt-3" size="large" prepend-icon="mdi-calendar-plus" @click="emit('submit')">下書きをプレビューする</v-btn>
          </v-card-text>
          <v-card-text class="text-center mx-0">
            <v-btn color="grey-900" class="mt-3" size="large" prepend-icon="mdi-email" @click="openConfirmDialog">店舗に予約申請メールする</v-btn>
          </v-card-text>
          <confirm-dialog v-model="isOpenConfirmDialog" :is-confirm="true" :ok-text="'予約申請する'" :ok-click="sendReserveMail">
            {{ event.shop_name }} に予約申請メールをしますか？
          </confirm-dialog>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
