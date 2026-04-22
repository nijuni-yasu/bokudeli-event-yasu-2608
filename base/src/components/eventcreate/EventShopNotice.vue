<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useValidators } from '@shokujii/base/composable/validators.js'
import {
  mdiChevronLeft,
  mdiCalendarPlus,
  mdiStorefrontOutline,
  mdiEmailOutline,
  mdiCalendar,
  mdiHandExtendedOutline,
  mdiTimerSand,
} from '@mdi/js'
import { convertToDuration, convertToDatetimeWeekdayShort } from '@shokujii/common/utils/datetime.js'
import { type BokudeliPartnerShop } from '@shokujii/base/stores/partner.js'
import EventEditStepNav from '@shokujii/base/components/eventcreate/EventEditStepNav.vue'

const emit = defineEmits<{
  submit: []
  sendReserveMail: []
  back: []
}>()

const event = defineModel<BokudeliEvent>({ required: true })
const shop = defineModel<BokudeliPartnerShop | null>('shop', { required: true })

const props = defineProps<{
  loadingSubmit?: boolean
  loadingReserve?: boolean
  loadingMenu?: boolean
  /**
   * EventEdit のステッパー連携用。親から必ず渡す。
   * アクティブなステップのとき true にし、Teleport した固定ナビを body に出す。
   */
  stepNavVisible: boolean
}>()

const { t: $t } = useI18n()

const { requiredValidator, phoneValidator, emailValidator } = useValidators()

const isValid = ref(false)

const eventDateTime = computed(() =>
  convertToDuration(event.value.event_start_datetime, event.value.event_end_datetime),
)
const pickUpStartDateTime = computed(
  () => `${convertToDuration(event.value.event_start_datetime - 30 * 60 * 1000, event.value.event_start_datetime)}`,
)
const eventDeadlineDateTime = computed(() => `${convertToDatetimeWeekdayShort(event.value.event_deadline_datetime)}`)

const shop_phone = computed(() => (shop.value !== null ? shop.value.shop_phone : ''))
const shop_address = computed(() => (shop.value !== null ? shop.value.fullAddress : ''))

const textFieldVariant = computed(() => {
  return event.value.event_status.value === 'in_draft' ? 'outlined' : 'solo-filled'
})

const isOpenConfirmDialog = ref(false)
const openConfirmDialog = () => {
  isOpenConfirmDialog.value = true
}
const sendReserveMail = () => {
  emit('sendReserveMail')
}

const submit = () => {
  emit('submit')
}
</script>

<template>
  <v-row class="justify-center">
    <v-col cols="12" sm="12" md="8" class="px-0">
      <v-card-title class="px-5 mt-5">
        <v-icon size="50" class="text--primary me-3" :icon="mdiStorefrontOutline" />
        <span>{{ $t('shop_notice.info_title') }}</span>
      </v-card-title>
      <v-card-text class="pt-2">
        <v-row class="justify-center">
          <v-col cols="12">
            <v-text-field
              v-model="event.shop_name"
              :label="$t('shop_notice.shop_name')"
              dense
              readonly
              variant="solo-filled"
            />
          </v-col>
        </v-row>
        <v-row class="justify-center">
          <v-col cols="12">
            <v-text-field
              :model-value="shop_address"
              :label="$t('shop_notice.shop_address')"
              dense
              readonly
              variant="solo-filled"
            />
          </v-col>
        </v-row>
        <v-row class="justify-center">
          <v-col cols="12">
            <v-text-field
              :model-value="shop_phone"
              :label="$t('shop_notice.shop_phone')"
              dense
              readonly
              variant="solo-filled"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-col>
  </v-row>

  <v-row class="justify-center">
    <v-col cols="12" sm="12" md="8" class="px-0">
      <v-card-title class="px-5">
        <v-icon size="50" class="text--primary me-3" :icon="mdiCalendar" />
        <span>{{ $t('shop_notice.date_title') }}</span>
      </v-card-title>
      <v-card-text class="pt-2">
        <v-row class="justify-center">
          <v-col cols="12">
            <v-text-field
              :model-value="eventDateTime"
              :label="$t('shop_notice.event_date')"
              :prepend-inner-icon="mdiCalendar"
              :readonly="true"
              variant="solo-filled"
              :hint="$t('shop_notice.event_date_hint')"
            />
          </v-col>
        </v-row>
        <v-row class="justify-center">
          <v-col cols="12">
            <v-text-field
              :model-value="pickUpStartDateTime"
              :label="$t('shop_notice.pick_up_time')"
              :prepend-inner-icon="mdiHandExtendedOutline"
              :readonly="true"
              variant="solo-filled"
              :hint="$t('shop_notice.pick_up_time_hint')"
            />
          </v-col>
        </v-row>
        <v-row class="justify-center">
          <v-col cols="12">
            <v-text-field
              :model-value="eventDeadlineDateTime"
              :label="$t('event_detail.deadline_date')"
              :prepend-inner-icon="mdiTimerSand"
              :readonly="true"
              variant="solo-filled"
              :hint="$t('shop_notice.deadline_date_hint')"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-col>
  </v-row>

  <v-row class="justify-center">
    <v-col cols="12" sm="12" md="8" class="px-0">
      <v-card flat class="mt-2">
        <v-form v-model="isValid" class="multi-col-validation">
          <v-card-title class="px-5">
            <v-icon size="50" class="text--primary me-3" :icon="mdiEmailOutline" />
            <span>{{ $t('shop_notice.notice_title') }}</span>
          </v-card-title>

          <v-card-text class="pt-2">
            <v-row class="justify-center">
              <v-col cols="12">
                <v-text-field
                  v-model="event.organizer_fullname"
                  :variant="textFieldVariant"
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
                  :variant="textFieldVariant"
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
                  :variant="textFieldVariant"
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
                  :variant="textFieldVariant"
                  dense
                  :label="$t('shop_notice.organizer_phone_personal')"
                  :rules="[requiredValidator, phoneValidator]"
                  :readonly="event.event_status.value !== 'in_draft'"
                  :hint="$t('shop_notice.organizer_phone_hint')"
                />
              </v-col>
            </v-row>

            <v-row class="justify-center">
              <v-col cols="12">
                <v-text-field
                  v-model="event.organizer_phone_company"
                  :variant="textFieldVariant"
                  dense
                  :label="$t('shop_notice.organizer_phone_company')"
                  :rules="[phoneValidator]"
                  :readonly="event.event_status.value !== 'in_draft'"
                  :hint="$t('shop_notice.organizer_phone_hint')"
                />
              </v-col>
            </v-row>
            <v-row class="justify-center">
              <v-col cols="12">
                <v-textarea
                  v-model="event.organizer_memo"
                  :variant="textFieldVariant"
                  rows="4"
                  :label="$t('shop_notice.organizer_memo')"
                  :rules="[requiredValidator]"
                  :placeholder="$t('shop_notice.organizer_memo_placeholder')"
                  :readonly="event.event_status.value !== 'in_draft'"
                />
              </v-col>
            </v-row>
          </v-card-text>

          <confirm-dialog
            v-model="isOpenConfirmDialog"
            :is-confirm="true"
            :ok-text="$t('shop_notice.send_reserve_mail_ok')"
            :ok-click="sendReserveMail"
            max-width="700px"
          >
            <v-card-text class="text-center py-10 text-h5">
              <div v-html="$t('shop_notice.confirm_send_reserve_mail', [event.shop_name])" />
            </v-card-text>
            <v-card-text class="pb-0" style="line-height: 2rem">
              <div v-html="$t('shop_notice.confirm_send_reserve_mail_desc')" />
            </v-card-text>
          </confirm-dialog>
        </v-form>
      </v-card>
      <event-edit-step-nav :visible="stepNavVisible">
        <div class="event-shop-notice-footer__stack">
          <div class="event-shop-notice-footer__top">
            <v-btn
              color="primary"
              size="x-large"
              rounded="xl"
              min-width="168"
              :prepend-icon="mdiChevronLeft"
              @click="emit('back')"
            >
              {{ $t('event_edit.back') }}
            </v-btn>
            <v-btn
              v-if="!event.event_id"
              color="primary"
              size="x-large"
              rounded="xl"
              min-width="168"
              :prepend-icon="mdiCalendarPlus"
              :disabled="!isValid || props.loadingReserve || props.loadingMenu"
              :loading="props.loadingSubmit"
              @click="submit"
            >
              {{ $t('shop_notice.preview_draft') }}
            </v-btn>
            <v-btn
              v-else
              color="primary"
              size="x-large"
              rounded="xl"
              min-width="168"
              :prepend-icon="mdiCalendarPlus"
              :disabled="!isValid || props.loadingReserve || props.loadingMenu"
              :loading="props.loadingSubmit"
              @click="submit"
            >
              {{ $t('shop_notice.save_event') }}
            </v-btn>
          </div>
          <v-btn
            v-if="event.event_id"
            class="event-shop-notice-footer__reserve"
            :disabled="!isValid || event.event_status?.value !== 'in_draft' || props.loadingSubmit || props.loadingMenu"
            :loading="props.loadingReserve"
            color="grey-900"
            size="x-large"
            rounded="xl"
            :prepend-icon="mdiEmailOutline"
            @click="openConfirmDialog"
          >
            {{ $t('shop_notice.send_reserve_mail') }}
          </v-btn>
        </div>
      </event-edit-step-nav>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped>
/* 上段（戻る＋保存）の幅に合わせて下段の予約申請ボタン幅を揃える */
.event-shop-notice-footer__stack {
  display: inline-grid;
  grid-template-columns: max-content;
  justify-items: stretch;
  gap: 10px;
  max-width: 100%;
  margin-inline: auto;
}

.event-shop-notice-footer__top {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 10px 12px;
}

.event-shop-notice-footer__reserve {
  min-width: 0;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.02em;

  :deep(.v-btn__content) {
    font-size: inherit;
    font-weight: inherit;
    letter-spacing: inherit;
  }
}
</style>
