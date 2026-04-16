<script setup lang="ts">
import { useEventStore, type EventStore } from '@shokujii/base/stores/event.js'
import { mdiTruckOutline, mdiMapMarkerRadius } from '@mdi/js'
import { ordersTotalPrice, getSubtotalsOfOrders, ordersCount } from '@shokujii/base/utils/orders.js'
import { useValidators } from '@shokujii/base/composable/validators.js'
import { getAuth } from 'firebase/auth'
import { usePartnerStore } from '@shokujii/base/stores/partner.js'
import { getOrderPath } from '@/navigation/utils'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useUserStore, type UserStore } from '@shokujii/base/stores/user.js'
import { getNamesPrintPath } from '@/navigation/utils'
import { getNamesPrintPdf } from '@shokujii/base/utils/namesPrint.js'
import { computed, ref } from 'vue'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { getEventUrl, getUserUrl } from '@shokujii/common/utils/urls.js'

const router = useRouter()
const { t: $t } = useI18n()
const eventId = useRoute().params.eventId as string
const eventStore = useEventStore(eventId) as EventStore
const partnerId = getAuth().currentUser!.uid
const partnerStore = usePartnerStore(partnerId)

const notification = useNotification()

const event = await eventStore.getLoadedEvent()

// TODO 環境変数を component 内で直接みるのはいまいちな実装なので直す
const originHost = import.meta.env.VITE_ORIGIN_HOST as string
const eventUrl = getEventUrl(originHost, event.community_account, event.event_id)

if (event.partner_id !== partnerId) {
  window.alert($t('alert.invalid_account'))
  router.push(getOrderPath())
  throw new Error()
}

const { requiredValidator } = useValidators()

const isValid = ref(false)
const isLoading = ref(false)
const reservationAction = ref(0)
const shopComment = ref($t('order_detail.accept_order_sample'))
const isConfirmDialogOpen = ref(false)

const confirmDialogContent = computed(() => {
  if (reservationAction.value === 0) {
    return {
      title: $t('order_detail.confirm_accept_dialog.title'),
      message: $t('order_detail.confirm_accept_dialog.message'),
      okText: $t('order_detail.confirm_accept_dialog.submit'),
      cancelText: $t('order_detail.confirm_accept_dialog.close'),
    }
  }

  return {
    title: $t('order_detail.confirm_decline_dialog.title'),
    message: $t('order_detail.confirm_decline_dialog.message'),
    okText: $t('order_detail.confirm_decline_dialog.submit'),
    cancelText: $t('order_detail.confirm_decline_dialog.close'),
  }
})

watch(reservationAction, (newValue) => {
  shopComment.value = newValue === 0 ? $t('order_detail.accept_order_sample') : $t('order_detail.decline_order_sample')
})

const submit = async () => {
  isLoading.value = true
  event.event_status = {
    value: reservationAction.value === 0 ? 'accepting_order' : 'in_draft',
    shop_comment: shopComment.value,
  }
  await eventStore.updateEvent(event)
  isLoading.value = false
  notification.show($t('order_detail.email_sent'), 'success')
}

const openConfirmDialog = () => {
  if (!isValid.value || isLoading.value) {
    return
  }
  isConfirmDialogOpen.value = true
}

const handleConfirmSubmit = async () => {
  if (isLoading.value) {
    return
  }
  await submit()
  isConfirmDialogOpen.value = false
}

// null=ロード中, true=オーナー, false=非オーナー
const isOwner = computed<boolean | null>(() => {
  if (partnerStore.shops === null) return null
  const shop = partnerStore.shops[0] ?? null
  return shop != null && event.community_account === shop.community_account
})

// [お名前]を印刷 ボタンの実装
const downloadNamesPrint = async () => {
  isLoading.value = true
  try {
    const w = window.open(getNamesPrintPath(), '_blank')
    const pdf = await getNamesPrintPdf(eventId) //todo 並び順
    w!.location.href = window.URL.createObjectURL(pdf)
  } catch (error) {
    console.error('Error downloading names sheet:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <v-row class="justify-center">
    <v-col cols="12" sm="12" md="9" class="px-0">
      <v-card flat class="mt-2" v-if="eventStore.event != null">
        <template v-slot:title>
          <v-icon size="40" class="text--primary me-3" :icon="mdiTruckOutline" />
          <span>{{ $t(`event_status.${eventStore.event.event_status.value}`) }}</span>
        </template>
        <v-card-text>
          <div class="mt-5">
            <p>{{ $t('order_detail.event_name', [eventStore.event.event_name]) }}</p>
            <p v-linkify>{{ $t('order_detail.event_url', [eventUrl]) }}</p>
            <p>
              {{
                $t(
                  'order_detail.event_date',
                  eventStore.event.event_start_datetime != null
                    ? [
                        $d(eventStore.event.event_start_datetime - 30 * 60 * 1000, 'datetime_weekday_short'),
                        $d(eventStore.event.event_start_datetime, 'time'),
                      ]
                    : [],
                )
              }}
            </p>
            <p>
              {{
                $t(
                  'order_detail.order_limit',
                  eventStore.event.event_deadline_datetime != null
                    ? [$d(eventStore.event.event_deadline_datetime, 'datetime_weekday_short')]
                    : [],
                )
              }}
            </p>
            <p>
              {{ $t('order_detail.event_address', [eventStore.event.fullAddress]) }}
              <a
                :href="`https://www.google.co.jp/maps/search/${eventStore.event.fullAddress} ${eventStore.event.event_place}`"
                target="_blank"
              >
                <v-icon :icon="mdiMapMarkerRadius" />
              </a>
            </p>
            <p>{{ $t('order_detail.event_max_people', [eventStore.event.event_max_people]) }}</p>
            <p>{{ $t('order_detail.community_name', [eventStore.event.community_name]) }}</p>
            <template v-if="isOwner == null">
              <v-progress-circular indeterminate color="primary" size="24" />
            </template>
            <template v-else-if="!isOwner">
              <p>{{ $t('order_detail.organizer_fullname', [eventStore.event.organizer_fullname]) }}</p>
              <p>{{ $t('order_detail.organizer_company', [eventStore.event.organizer_company]) }}</p>
              <p>{{ $t('order_detail.organizer_phone_personal', [eventStore.event.organizer_phone_personal]) }}</p>
              <p>{{ $t('order_detail.organizer_phone_company', [eventStore.event.organizer_phone_company]) }}</p>
              <p>{{ $t('order_detail.organizer_email', [eventStore.event.organizer_email]) }}</p>
              <p>{{ $t('order_detail.organizer_memo', [eventStore.event.organizer_memo]) }}</p>
            </template>
          </div>
        </v-card-text>
        <template v-if="eventStore.event.event_status.value == 'applying_reservation'">
          <v-form v-model="isValid" @submit.prevent="openConfirmDialog">
            <v-card-text>
              <p>
                {{ $t('order_detail.accept_or_decline') }}
              </p>
              <v-radio-group v-model="reservationAction" column class="ml-5">
                <v-radio :value="0">
                  <template #label>
                    <span :class="['radio-label', { 'radio-label--active': reservationAction === 0 }]">
                      {{ $t('order_detail.accept_order') }}
                    </span>
                  </template>
                </v-radio>
                <v-radio :value="1">
                  <template #label>
                    <span :class="['radio-label', { 'radio-label--active': reservationAction === 1 }]">
                      {{ $t('order_detail.decline_order') }}
                    </span>
                  </template>
                </v-radio>
              </v-radio-group>
              <p class="mt-8">
                {{ $t('order_detail.send_email_message') }}
              </p>
              <v-textarea
                v-model="shopComment"
                rows="2"
                class="ml-5"
                :placeholder="
                  reservationAction === 0
                    ? $t('order_detail.accept_order_sample')
                    : $t('order_detail.decline_order_sample')
                "
                :rules="[requiredValidator]"
              />
            </v-card-text>
            <v-card-actions>
              <v-col class="text-center">
                <v-btn
                  class="px-3"
                  size="large"
                  type="button"
                  elevation="3"
                  variant="outlined"
                  color="primary"
                  rounded="pill"
                  :disabled="!isValid"
                  :loading="isLoading"
                  @click="openConfirmDialog"
                >
                  {{ $t('order_detail.send_email') }}
                </v-btn>
              </v-col>
            </v-card-actions>
            <ConfirmDialog
              v-model="isConfirmDialogOpen"
              :is-confirm="true"
              :title="confirmDialogContent.title"
              :ok-text="confirmDialogContent.okText"
              :cancel-text="confirmDialogContent.cancelText"
              :ok-loading-state="isLoading"
              :cancel-loading-state="isLoading"
              :ok-click="handleConfirmSubmit"
              max-width="600px"
            >
              <div class="confirm-dialog__message" v-html="confirmDialogContent.message" />
            </ConfirmDialog>
          </v-form>
        </template>
        <v-card-text v-else-if="eventStore.confirmedOrders != null && eventStore.confirmedOrders.length !== 0">
          <v-btn @click="downloadNamesPrint" :loading="isLoading">{{
            $t('order_detail.names_sheet_print_button')
          }}</v-btn>
          <div class="text-subtitle-2 ma-2" v-html="$t('order_detail.names_sheet_print_button_desc')" />
          <h2 class="mt-10 mb-3">{{ $t('order_detail.order_detail') }}</h2>
          <v-table>
            <thead>
              <tr>
                <th>#</th>
                <th>{{ $t('order_detail.user_name') }}</th>
                <th>{{ $t('order_detail.menu_name') }}</th>
                <th>{{ $t('order_detail.menu_price') }}</th>
                <th>{{ $t('order_detail.order_date') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="({ order, menu }, key) in eventStore.confirmedOrders
                  .flatMap((order) =>
                    order.menus.flatMap((menu) => [...Array(menu.count)].map(() => ({ order, menu }))),
                  )
                  .sort((a, b) =>
                    a.menu.name === b.menu.name
                      ? a.order.created_at - b.order.created_at
                      : a.menu.name > b.menu.name
                        ? 1
                        : -1,
                  )"
                :key="`order-${key}`"
              >
                <td>{{ key + 1 }}</td>
                <td>
                  <a :href="getUserUrl(originHost, order.user_id)" class="name-link" target="_blank">
                    <div class="d-flex align-center">
                      <UserAvatar :user="(useUserStore(order.user_id) as UserStore).user" :size="40" class="me-2" />
                      {{ eventStore.members?.find((m) => m.user_id === order.user_id)?.user_name }}
                    </div>
                  </a>
                </td>
                <td>{{ menu.name }}</td>
                <td>{{ $n(menu.price, 'currency') }}</td>
                <td>{{ $d(order.created_at, 'datetime') }}</td>
              </tr>
            </tbody>
          </v-table>
          <h2 class="mt-10 mb-3">{{ $t('order_detail.subtotal') }}</h2>
          <v-table>
            <thead>
              <tr>
                <th>#</th>
                <th>{{ $t('order_detail.menu_name') }}</th>
                <th>{{ $t('order_detail.order_count') }}</th>
                <th>{{ $t('order_detail.unit_price') }}</th>
                <th>{{ $t('order_detail.subtotal_price') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(subtotalOrder, key) in getSubtotalsOfOrders(eventStore.confirmedOrders)"
                :key="`total-${key}`"
              >
                <td>{{ key + 1 }}</td>
                <td>{{ subtotalOrder.name }}</td>
                <td>{{ subtotalOrder.count }}</td>
                <td>{{ $n(subtotalOrder.price, 'currency') }}</td>
                <td>{{ $n(subtotalOrder.price * subtotalOrder.count, 'currency') }}</td>
              </tr>
            </tbody>
          </v-table>
          <h2 class="mt-10 mb-3">{{ $t('order_detail.total') }}</h2>
          <v-table>
            <thead>
              <tr>
                <th>{{ $t('order_detail.total_count') }}</th>
                <th>{{ $t('order_detail.total_price') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <h1>{{ ordersCount(eventStore.confirmedOrders) }}</h1>
                </td>
                <td>
                  <h1>{{ $n(ordersTotalPrice(eventStore.confirmedOrders), 'currency') }}</h1>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped lang="scss">
tbody {
  tr {
    height: 70px;
  }
}

.name-link {
  color: inherit;
  text-decoration: none;
}

.radio-label {
  font-weight: 400;
}

.radio-label--active {
  font-weight: 700;
}
</style>
