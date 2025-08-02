<script setup lang="ts">
import { ref, computed } from 'vue'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { type EventOrder } from '@shokujii/common/schemas/EventOrder.js'

const props = defineProps<{
  event: BokudeliEvent
  order: EventOrder
  isOwner: boolean
}>()

defineEmits<{
  downloadInvoice: [order: EventOrder]
  cancel: [order: EventOrder]
}>()

const dialog = ref(false)

const totalPrice = computed(() => props.order.menus.reduce((acc, menu) => acc + menu.price * menu.count, 0))

const isShowCancelButton = computed(
  () => props.order.status === 'ordered' && props.event.event_deadline_datetime > Date.now(),
)
const isShowCanceled = computed(() => props.order.status === 'canceled')
const isShowInvoiceButton = computed(
  () => props.order.status === 'ordered' && props.order.event_payment !== 'community_bill',
)
</script>

<template>
  <v-card class="pa-0">
    <v-img cover class="ma-0 pa-0" aspect-ratio="1.91" :src="event.event_cover_url"></v-img>
    <v-chip class="mt-2 ml-3" color="primary" size="small">
      {{ $t(`event_status.${event.event_status.value}`) }}
    </v-chip>
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
      $t('user_event_card.event_address', [event.event_address])
    }}</v-card-text>
    <v-card-text class="py-1 px-2 event-card">{{ $t('user_event_card.shop_name', [event.shop_name]) }}</v-card-text>
    <v-card-text class="py-1 px-2 event-card">{{
      $t('user_event_card.event_payment', [$t(`payment.${order.event_payment}`)])
    }}</v-card-text>
    <v-card-text class="py-1 px-2 event-card">
      {{ $t('user_event_card.menu') }}
      <div class="ml-3">
        <template v-for="menu in order.menus" :key="menu.menu_id">
          <div v-html="$t('user_event_card.menu_item', [menu.name, menu.count])" />
        </template>
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
        <v-col v-else-if="isShowCanceled" class="d-flex justify-end">{{ $t('user_event_card.canceled') }} </v-col>
      </v-row>
      <v-row v-if="isOwner && isShowInvoiceButton">
        <v-col class="d-flex justify-end pa-1">
          <v-btn
            variant="outlined"
            rounded="pill"
            color="secondary"
            size="small"
            @click.prevent="$emit('downloadInvoice', order)"
          >
            {{ $t('user_event_card.download_invoice') }}
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
        {{ $t('user_event_card.event_payment', [$t(`payment.${order.event_payment}`)]) }}<br />
        {{ $t('user_event_card.total_price', [$n(totalPrice, 'currency')]) }}
      </v-card-text>
      <v-card-text class="py-5 text-body-2" style="line-height: 1.5rem">
        <div v-if="order.event_payment === 'user_advance'">
          <div v-html="$t('user_event_card.cancel_dialog.description_user_advance')" />
        </div>
        <div v-else-if="order.event_payment === 'community_bill'">
          <div v-html="$t('user_event_card.cancel_dialog.description_community_bill')" />
        </div>
      </v-card-text>
      <template #actions>
        <v-spacer />
        <v-btn @click="dialog = false">{{ $t('user_event_card.cancel_dialog.not_cancel') }}</v-btn>
        <v-btn variant="tonal" @click="($emit('cancel', order), (dialog = false))">
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
