<script setup lang="ts">
import type BokudeliEvent from '@/schemes/bokudeliEvent'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { requiredValidator, phoneValidator, emailValidator } from '@/utils/validators'
import { useStoreStoredUser } from '@/stores/storedUser'

const props = defineProps<{
  modelValue: BokudeliEvent
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: BokudeliEvent): void
  (e: 'submit'): void
  (e: 'sendReserveMail'): void
  (e: 'back'): void
}>()

const storedUserStore = useStoreStoredUser()

const isValid = ref(false)

const event = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

if (event.value.organizer_email === '' && event.value.event_status.value === 'in_draft') {
  event.value.organizer_email = storedUserStore.storedUser?.userEmail ?? ''
}

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
        <v-form v-model="isValid" class="multi-col-validation">
          <v-card-title class="pa-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-email" />
            <span>店舗への連絡事項</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row class="justify-center">
              <v-col cols="12">
                <v-text-field
                  v-model="event.organizer_fullname"
                  outlined
                  dense
                  label="担当者 氏名"
                  :rules="[requiredValidator]"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="event.organizer_company"
                  outlined
                  dense
                  label="会社名/団体名"
                  :rules="[requiredValidator]"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="event.organizer_email"
                  outlined
                  dense
                  label="メールアドレス"
                  :rules="[requiredValidator, emailValidator]"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="event.organizer_phone_personal"
                  outlined
                  dense
                  label="電話番号（担当者）"
                  :rules="[requiredValidator, phoneValidator]"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="event.organizer_phone_company"
                  outlined
                  dense
                  label="電話番号（会社/団体）"
                  :rules="[phoneValidator]"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="event.organizer_memo"
                  outlined
                  rows="3"
                  label="配達受取場所について"
                  :rules="[requiredValidator]"
                  placeholder="XXXXビルに付きましたら、搬入口からOOFまでお上がりください。&#x0a;到着したらお電話ください。よろしくお願いします。"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="text-center mt-10">
            <v-btn color="primary" class="me-3 mt-3" size="large" prepend-icon="mdi-chevron-left" @click="emit('back')"
              >前へ</v-btn
            >
            <v-btn
              v-if="!event.event_id"
              color="primary"
              class="mt-3"
              size="large"
              prepend-icon="mdi-calendar-plus"
              :disabled="!isValid"
              @click="emit('submit')"
              >下書きをプレビューする</v-btn
            >
            <v-btn
              v-else
              color="primary"
              class="mt-3"
              size="large"
              prepend-icon="mdi-calendar-plus"
              :disabled="!isValid"
              @click="emit('submit')"
              >イベントを保存する</v-btn
            >
          </v-card-text>
          <v-card-text class="text-center mx-0 px-0">
            <v-btn
              v-if="event.event_id"
              :disabled="!isValid || event.event_status?.value !== 'in_draft'"
              color="grey-900"
              class="mt-3"
              size="x-large"
              prepend-icon="mdi-email"
              @click="openConfirmDialog"
            >
              店舗に予約申請する
            </v-btn>
          </v-card-text>
          <confirm-dialog
            v-model="isOpenConfirmDialog"
            :is-confirm="true"
            :ok-text="'予約申請メールを送信する'"
            :ok-click="sendReserveMail"
            max-width="650px"
          >
            <v-card-text class="text-center py-10 text-h6">
              {{ event.shop_name }} に予約申請メールを送信しますか？<br />
            </v-card-text>
            <v-card-text class="text-subtitle pb-0" style="line-height: 1.5rem">
              ・店舗から予約が承認されると、注文や告知ができるようになります。<br />
              ・予約が却下された場合は、店舗や日時などを変更して再度予約申請をしてください。<br />
              ・予約申請をすると、「店舗」「開催場所」「開催日時」の変更はできません。<br />
              ・以上を確認の上、予約申請を行ってください。
            </v-card-text>
          </confirm-dialog>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
