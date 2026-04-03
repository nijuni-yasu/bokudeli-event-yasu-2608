<script setup lang="ts">
import { ref, computed } from 'vue'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { type EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import EventStatusChip from '@shokujii/base/components/EventStatusChip.vue'

const props = defineProps<{
  event: BokudeliEvent
  orders: EventMemberOrder[]
  isOwner: boolean
}>()

defineEmits<{
  downloadInvoice: [eventId: string, stripeId: string]
  cancel: [orders: EventMemberOrder[]]
}>()

const dialog = ref(false)

const groupedMenus = computed(() => {
  const map = new Map<string, { menu_name: string; menu_price: number; count: number }>()
  for (const o of props.orders.filter((o) => o.status !== 'canceled')) {
    const existing = map.get(o.menu_id)
    if (existing) {
      existing.count++
    } else {
      map.set(o.menu_id, { menu_name: o.menu_name, menu_price: o.menu_price, count: 1 })
    }
  }
  return Array.from(map.values())
})

const totalPrice = computed(() =>
  props.orders.filter((o) => o.status !== 'canceled').reduce((sum, o) => sum + o.menu_price, 0),
)

const hasActiveOrders = computed(() => props.orders.some((o) => o.status !== 'canceled'))

const isShowCancelButton = computed(() => hasActiveOrders.value && props.event.event_deadline_datetime > Date.now())

const isAllCanceled = computed(() => props.orders.every((o) => o.status === 'canceled'))

const isShowInvoiceButton = computed(
  () => props.orders.some((o) => o.status === 'ordered') && props.event.event_payment === 'user_advance',
)

const stripeGroups = computed(() => {
  const map = new Map<string, { stripeId: string; amount: number }>()
  for (const o of props.orders.filter((o) => o.status !== 'canceled' && o.stripe_id != null)) {
    if (!map.has(o.stripe_id!)) {
      map.set(o.stripe_id!, { stripeId: o.stripe_id!, amount: 0 })
    }
    map.get(o.stripe_id!)!.amount += o.menu_price
  }
  return Array.from(map.values())
})
</script>

<template>
  <v-card class="pa-0">
    <v-img cover class="ma-0 pa-0" aspect-ratio="1.91" :src="event.event_cover_url"></v-img>
    <EventStatusChip :status="event.calculatedEventStatus" size="small" class="mt-2 ml-3" />
    <v-chip v-if="!event.is_public" class="mt-2 ml-3" color="primary" size="small">
      {{ $t('private_event') }}
    </v-chip>
    <v-card-title class="justify-center pb-1 title text-h5">
      {{ event.event_name }}
    </v-card-title>
    <v-card-text class="py-1 px-2 event-card">
      {{ $t('user_event_card.community_name', [event.community_name]) }}
    </v-card-text>
    <v-card-text class="py-1 px-2 event-card">
      {{ $t('user_event_card.event_start_datetime', [$d(event.event_start_datetime, 'datetime_weekday_short')]) }}
    </v-card-text>
    <v-card-text class="py-1 px-2 event-card">{{
      $t('user_event_card.event_address', [event.fullAddress])
    }}</v-card-text>
    <v-card-text class="py-1 px-2 event-card">{{ $t('user_event_card.shop_name', [event.shop_name]) }}</v-card-text>
    <v-card-text class="py-1 px-2 event-card">{{
      $t('user_event_card.event_payment', [$t(`payment.${event.event_payment}`)])
    }}</v-card-text>
    <v-card-text class="py-1 px-2 event-card">
      {{ $t('user_event_card.menu') }}
      <div class="ml-3">
        <div v-for="menu in groupedMenus" :key="menu.menu_name">
          {{ menu.menu_name }} ×{{ menu.count }}（{{ $n(menu.menu_price * menu.count, 'currency') }}）
        </div>
      </div>
    </v-card-text>
    <v-card-text class="px-2 pt-1 pb-4 event-card">
      {{ $t('user_event_card.total_price', [$n(totalPrice, 'currency')]) }}
    </v-card-text>
    <v-card-text>
      <v-row v-if="isOwner" justify="end">
        <v-spacer></v-spacer>
        <v-col v-if="isShowCancelButton" class="d-flex justify-end pa-1">
          <v-btn variant="outlined" rounded="pill" color="secondary" size="small" @click.prevent="dialog = true">
            {{ $t('user_event_card.cancel_order') }}
          </v-btn>
        </v-col>
        <v-col v-else-if="isAllCanceled" class="d-flex justify-end">{{ $t('user_event_card.canceled') }} </v-col>
      </v-row>
      <v-row v-if="isOwner && isShowInvoiceButton">
        <v-col class="d-flex justify-end pa-1 flex-wrap ga-1">
          <v-btn
            v-for="sg in stripeGroups"
            :key="sg.stripeId"
            variant="outlined"
            rounded="pill"
            color="secondary"
            size="small"
            @click.prevent="$emit('downloadInvoice', event.event_id, sg.stripeId)"
          >
            {{
              stripeGroups.length === 1
                ? $t('user_event_card.download_invoice')
                : `${$t('user_event_card.download_invoice')}（${$n(sg.amount, 'currency')}）`
            }}
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
  <v-dialog v-model="dialog" :persistent="false" max-width="600px">
    <v-card>
      <template #title>{{ $t('user_event_card.cancel_dialog.title') }}</template>
      <v-card-text class="text-h6" style="line-height: 2rem">
        {{ $t('user_event_card.cancel_dialog.event_name', [event.event_name]) }}<br />
        {{ $t('user_event_card.event_payment', [$t(`payment.${event.event_payment}`)]) }}<br />
        {{ $t('user_event_card.total_price', [$n(totalPrice, 'currency')]) }}
      </v-card-text>
      <v-card-text class="py-5 text-body-2" style="line-height: 1.5rem">
        <div v-if="event.event_payment === 'user_advance'">
          <div v-html="$t('user_event_card.cancel_dialog.description_user_advance')" />
        </div>
        <div v-else-if="event.event_payment === 'community_bill'">
          <div v-html="$t('user_event_card.cancel_dialog.description_community_bill')" />
        </div>
      </v-card-text>
      <template #actions>
        <v-spacer />
        <v-btn @click="dialog = false">{{ $t('user_event_card.cancel_dialog.not_cancel') }}</v-btn>
        <v-btn variant="tonal" @click="($emit('cancel', orders), (dialog = false))">
          {{ $t('user_event_card.cancel_dialog.submit') }}
        </v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>
<style lang="scss" scoped>
.event-card {
  font-size: 13px;
}
</style>
