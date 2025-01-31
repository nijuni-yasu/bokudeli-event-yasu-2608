<script setup lang="ts">
import { useEventStore, type EventStore } from '@/stores/event'
import { mdiTruckOutline, mdiMapMarkerRadius } from '@mdi/js'
import { ordersTotalPrice, getSubtotalsOfOrders, ordersCount } from '@/utils/orders'
import { useValidators } from '@/composable/validators'
import { getAuth } from 'firebase/auth'
import { usePartnerStore } from '@/stores/partner'
import type { Shop } from '@/schemes/shop'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { getOrderPath } from '@/navigation/utils'
import { getNamesSheetPath } from '@/router/utils'
import { getNamesSheetPdf } from '@/utils/namesSheet'

const router = useRouter()
const { t: $t } = useI18n()
const eventId = useRoute().params.eventId as string
const eventStore = useEventStore(eventId) as EventStore
const partnerId = getAuth().currentUser!.uid
const partnerStore = usePartnerStore(partnerId)

const notification = inject('notification') as Notification

const [event, shop] = await Promise.all([
  new Promise<BokudeliEvent>((resolve) => {
    watch(
      () => eventStore.event,
      (event) => {
        if (event != null) {
          resolve(event)
          stop()
        }
      },
      { immediate: true },
    )
  }),
  new Promise<Shop>((resolve) => {
    watch(
      () => partnerStore.shops,
      (shops) => {
        if (shops != null && shops.length !== 0) {
          resolve(shops[0])
          stop()
        }
      },
      { immediate: true },
    )
  }),
])

if (event.partner_id !== partnerId) {
  window.alert($t('alert.invalid_account'))
  router.push(getOrderPath())
  throw new Error()
}

const { requiredValidator } = useValidators()

const isValid = ref(false)
const isLoading = ref(false)
const radio01 = ref(0)
const text01 = ref($t('order_detail.accept_order_sample'))

watch(radio01, (newValue) => {
  text01.value = newValue === 0 ? $t('order_detail.accept_order_sample') : $t('order_detail.decline_order_sample')
})

const submit = async () => {
  isLoading.value = true
  event.event_status = {
    value: radio01.value === 0 ? 'accepting_order' : 'in_draft',
    shop_comment: text01.value,
  }
  await eventStore.updateEvent(event)
  isLoading.value = false
  Object.assign(notification, { message: $t('order_detail.email_sent'), color: 'success' })
}

const isOwner = computed(() => {
  return event.community_account === shop.community_account
})

// [お名前]を印刷 ボタンの実装 
const downloadNamesSheet = async () => {
  const w = window.open(getNamesSheetPath(), '_blank')
  const pdf = await getNamesSheetPdf(eventId)
  w!.location.href = window.URL.createObjectURL(pdf)
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
            <p v-linkify>{{ $t('order_detail.event_url', [eventStore.event.url]) }}</p>
            <p>
              {{
                $t(
                  'order_detail.event_date',
                  eventStore.event.event_start_datetime != null
                    ? [
                        $d(eventStore.event.event_start_datetime.toMillis() - 30 * 60 * 1000, 'datetime_weekday_short'),
                        $d(eventStore.event.event_start_datetime.toMillis(), 'time'),
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
                    ? [$d(eventStore.event.event_deadline_datetime.toDate(), 'datetime_weekday_short')]
                    : [],
                )
              }}
            </p>
            <p>
              {{ $t('order_detail.event_address', [eventStore.event.event_address]) }}
              <a
                :href="`https://www.google.co.jp/maps/search/${eventStore.event.event_address} ${eventStore.event.event_place}`"
                target="_blank"
              >
                <v-icon :icon="mdiMapMarkerRadius" />
              </a>
            </p>
            <p>{{ $t('order_detail.event_max_people', [eventStore.event.event_max_people]) }}</p>
            <p>{{ $t('order_detail.community_name', [eventStore.event.community_name]) }}</p>
            <v-btn @click="downloadNamesSheet">{{ $t('order_detail.names_sheet_print_button') }}</v-btn>
            <template v-if="!isOwner">
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
          <v-form v-model="isValid" @submit.prevent="submit">
            <v-card-text>
              <p>
                {{ $t('order_detail.accept_or_decline') }}
              </p>
              <v-radio-group v-model="radio01" column class="ml-5">
                <v-radio :label="$t('order_detail.accept_order')" :value="0" />
                <v-radio :label="$t('order_detail.decline_order')" :value="1" />
              </v-radio-group>
              <p class="mt-8">
                {{ $t('order_detail.send_email_message') }}
              </p>
              <v-textarea
                v-model="text01"
                rows="2"
                class="ml-5"
                :placeholder="
                  radio01 === 0 ? $t('order_detail.accept_order_sample') : $t('order_detail.decline_order_sample')
                "
                :rules="[requiredValidator]"
              />
            </v-card-text>
            <v-card-actions>
              <v-col class="text-center">
                <v-btn
                  class="px-3"
                  size="large"
                  type="submit"
                  elevation="3"
                  variant="outlined"
                  color="primary"
                  rounded="pill"
                  :disabled="!isValid"
                  :loading="isLoading"
                >
                  {{ $t('order_detail.send_email') }}
                </v-btn>
              </v-col>
            </v-card-actions>
          </v-form>
        </template>
        <v-card-text v-else-if="eventStore.confirmedOrders != null && eventStore.confirmedOrders.length !== 0">
          <h2 class="mt-10 mb-1">{{ $t('order_detail.order_detail') }}</h2>
          <v-table>
            <thead>
              <tr>
                <th>#</th>
                <th>{{ $t('order_detail.menu_name') }}</th>
                <th>{{ $t('order_detail.menu_price') }}</th>
                <th>{{ $t('order_detail.user_name') }}</th>
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
                      ? a.order.created_at.toMillis() - b.order.created_at.toMillis()
                      : a.menu.name > b.menu.name
                        ? 1
                        : -1,
                  )"
                :key="`order-${key}`"
              >
                <td>{{ key + 1 }}</td>
                <td>{{ menu.name }}</td>
                <td>{{ $n(menu.price, 'currency') }}</td>
                <td>{{ eventStore.members?.find((m) => m.user_id === order.user_id)?.user_name }}</td>
                <td>{{ $d(order.created_at.toDate(), 'datetime') }}</td>
              </tr>
            </tbody>
          </v-table>
          <h2 class="mt-10 mb-1">{{ $t('order_detail.subtotal') }}</h2>
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
          <h2 class="mt-10 mb-1">{{ $t('order_detail.total') }}</h2>
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
