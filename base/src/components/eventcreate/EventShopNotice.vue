<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type BokudeliEvent from '@/schemes/bokudeliEvent'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useValidators } from '@/composable/validators'
import { useStoreStoredUser } from '@/stores/storedUser'
import { mdiChevronLeft, mdiCalendarPlus, mdiStorefrontOutline, mdiEmail, mdiCalendar } from '@mdi/js'
import { dateString, hourString, minutesString } from '@/schemes/eventCreate'
import type { Shop } from '@/schemes/shop'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'sendReserveMail'): void
  (e: 'back'): void
}>()

const event = defineModel<BokudeliEvent>({ required: true })
const shop = defineModel<Shop | null>('shop', { required: true })

const { t: $t } = useI18n()

const { requiredValidator, phoneValidator, emailValidator } = useValidators()

const storedUserStore = useStoreStoredUser()

const isValid = ref(false)

const eventStartDatetime = computed(() => event.value.event_start_datetime?.toDate() ?? new Date())

const pickUpStartDatetime = computed(() => {
  const pickUpStartDate = new Date(eventStartDatetime.value)
  pickUpStartDate.setMinutes(pickUpStartDate.getMinutes() - 30)
  return pickUpStartDate
})

const pickUpStartDateTime = computed(
  () =>
    `${dateString(pickUpStartDatetime.value)} ${hourString(pickUpStartDatetime.value)}:${minutesString(pickUpStartDatetime.value)} 〜 ${hourString(eventStartDatetime.value)}:${minutesString(eventStartDatetime.value)}`,
)

const shop_phone = computed(() => (shop.value !== null ? shop.value.shop_phone : ''))
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

const isSubmitting = ref(false)
const submit = () => {
  isSubmitting.value = true
  emit('submit')
}
</script>

<template>
  <v-row class="justify-center">
    <v-col cols="12" sm="12" md="9" class="px-0">
      <v-card-title class="pa-5">
        <v-icon size="50" class="text--primary me-3" :icon="mdiStorefrontOutline" />
        <span>{{ $t('shop_notice.info_title') }}</span>
      </v-card-title>
      <v-card-text class="pt-5">
        <v-row class="justify-center">
          <v-col cols="12">
            <v-text-field outlined dense readonly :label="$t('shop_notice.shop_name')" v-model="event.shop_name" />
          </v-col>
        </v-row>
        <v-row class="justify-center">
          <v-col cols="12">
            <v-text-field outlined dense readonly :label="$t('shop_notice.shop_phone')" :model-value="shop_phone" />
          </v-col>
        </v-row>
        <v-row class="justify-center">
          <v-col cols="12">
            <v-text-field
              :model-value="pickUpStartDateTime"
              :label="$t('shop_notice.pick_up_time')"
              :prepend-inner-icon="mdiCalendar"
              :readonly="true"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-col>
  </v-row>
  <v-row class="justify-center">
    <v-col cols="12" sm="12" md="9" class="px-0">
      <v-card flat class="mt-2">
        <v-form v-model="isValid" class="multi-col-validation">
          <v-card-title class="pa-5">
            <v-icon size="50" class="text--primary me-3" :icon="mdiEmail" />
            <span>{{ $t('shop_notice.notice_title') }}</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row class="justify-center">
              <v-col cols="12">
                <v-text-field
                  v-model="event.organizer_fullname"
                  outlined
                  dense
                  :label="$t('shop_notice.organizer_name')"
                  :rules="[requiredValidator]"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>
            </v-row>

            <v-row class="justify-center">
              <v-col cols="12">
                <v-text-field
                  v-model="event.organizer_company"
                  outlined
                  dense
                  :label="$t('shop_notice.organizer_company')"
                  :rules="[requiredValidator]"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>
            </v-row>

            <v-row class="justify-center">
              <v-col cols="12">
                <v-text-field
                  v-model="event.organizer_email"
                  outlined
                  dense
                  :label="$t('shop_notice.organizer_email')"
                  :rules="[requiredValidator, emailValidator]"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>
            </v-row>

            <v-row class="justify-center">
              <v-col cols="12">
                <v-text-field
                  v-model="event.organizer_phone_personal"
                  outlined
                  dense
                  :label="$t('shop_notice.organizer_phone_personal')"
                  :rules="[requiredValidator, phoneValidator]"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>
            </v-row>

            <v-row class="justify-center">
              <v-col cols="12">
                <v-text-field
                  v-model="event.organizer_phone_company"
                  outlined
                  dense
                  :label="$t('shop_notice.organizer_phone_company')"
                  :rules="[phoneValidator]"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>
            </v-row>

            <v-row class="justify-center">
              <v-col cols="12">
                <v-textarea
                  v-model="event.organizer_memo"
                  outlined
                  rows="3"
                  :label="$t('shop_notice.organizer_memo')"
                  :rules="[requiredValidator]"
                  :placeholder="$t('shop_notice.organizer_memo_placeholder')"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="text-center mt-10">
            <v-btn color="primary" class="me-3 mt-3" size="large" :prepend-icon="mdiChevronLeft" @click="emit('back')"
              >前へ</v-btn
            >
            <v-btn
              v-if="!event.event_id"
              color="primary"
              class="mt-3"
              size="large"
              :prepend-icon="mdiCalendarPlus"
              :disabled="!isValid"
              :loading="isSubmitting"
              @click="submit"
              >{{ $t('shop_notice.preview_draft') }}</v-btn
            >
            <v-btn
              v-else
              color="primary"
              class="mt-3"
              size="large"
              :prepend-icon="mdiCalendarPlus"
              :disabled="!isValid"
              :loading="isSubmitting"
              @click="submit"
              >{{ $t('shop_notice.save_event') }}</v-btn
            >
          </v-card-text>
          <v-card-text class="text-center mx-0 px-0">
            <v-btn
              v-if="event.event_id"
              :disabled="!isValid || event.event_status?.value !== 'in_draft'"
              color="grey-900"
              class="mt-3"
              size="x-large"
              :prepend-icon="mdiEmail"
              @click="openConfirmDialog"
            >
              {{ $t('shop_notice.send_reserve_mail') }}
            </v-btn>
          </v-card-text>
          <confirm-dialog
            v-model="isOpenConfirmDialog"
            :is-confirm="true"
            :ok-text="$t('shop_notice.send_reserve_mail_ok')"
            :ok-click="sendReserveMail"
            max-width="650px"
          >
            <v-card-text class="text-center py-10 text-h6">
              <div v-html="$t('shop_notice.confirm_send_reserve_mail', [event.shop_name])" />
            </v-card-text>
            <v-card-text class="text-subtitle pb-0" style="line-height: 1.5rem">
              <div v-html="$t('shop_notice.confirm_send_reserve_mail_desc')" />
            </v-card-text>
          </confirm-dialog>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
