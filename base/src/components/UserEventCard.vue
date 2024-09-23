<script setup lang="ts">
import type BokudeliEvent from '@/schemes/bokudeliEvent'
import { type OrderItem } from '@/schemes/orderItem'

const props = defineProps<{
  event: BokudeliEvent
  order: OrderItem
  isOwner: boolean
}>()

defineEmits<{
  cancel: [order: OrderItem]
}>()

const dialog = ref(false)

const totalPrice = computed(() => props.order.menus.reduce((acc, menu) => acc + menu.price * menu.count, 0))

const isShowCancelButton = computed(
  () =>
    props.order.status === 'ordered' &&
    props.event.event_deadline_datetime &&
    props.event.event_deadline_datetime?.seconds > Date.now() / 1000,
)
const isShowCanceled = computed(() => props.order.status === 'canceled')
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
    <v-card-title class="justify-center pb-3 title text-h6">
      {{ event.event_name }}
    </v-card-title>
    <v-card-text class="pa-3">{{ $t('user_event_card.community_name', [event.community_name]) }}</v-card-text>
    <v-card-text class="pa-3">
      {{
        $t('user_event_card.event_start_datetime', [
          $d(event.event_start_datetime?.toDate() ?? 0, 'datetime_weekday_short'),
        ])
      }}
    </v-card-text>
    <v-card-text class="pa-3">{{ $t('user_event_card.event_address', [event.event_address]) }}</v-card-text>
    <v-card-text class="pa-3">{{ $t('user_event_card.shop_name', [event.shop_name]) }}</v-card-text>
    <v-card-text class="pa-3">
      {{ $t('user_event_card.menu') }}
      <template v-for="menu in order.menus" :key="menu.menu_id" class="pl-4 pa-0 pb-0 mb-0">
        <div v-html="$t('user_event_card.menu_item', [menu.name, menu.count])" />
      </template>
    </v-card-text>
    <v-card-text class="px-3 pb-5">{{ $t('user_event_card.total_price', [$n(totalPrice, 'currency')]) }}</v-card-text>
    <v-card-text>
      <v-row v-if="isOwner" justify="end">
        <v-spacer></v-spacer>
        <v-col v-if="isShowCancelButton" class="d-flex justify-end">
          <v-btn variant="outlined" color="secondary" size="x-small" @click.prevent="dialog = true">
            {{ $t('user_event_card.cancel_order') }}
          </v-btn>
        </v-col>
        <v-col v-else-if="isShowCanceled" class="d-flex justify-end">{{ $t('user_event_card.canceled') }} </v-col>
      </v-row>
    </v-card-text>
  </v-card>
  <v-dialog v-model="dialog" :persistent="false" max-width="800px">
    <v-card>
      <template #title>{{ $t('user_event_card.cancel_dialog.title') }}</template>
      <v-card-text class="text-h6" style="line-height: 2rem">
        {{ $t('user_event_card.cancel_dialog.event_name', [event.event_name]) }}<br />
        {{ $t('user_event_card.cancel_dialog.refund', [$n(totalPrice, 'currency')]) }}
      </v-card-text>
      <v-card-text class="py-5" style="line-height: 2rem">
        <div v-html="$t('user_event_card.cancel_dialog.description')" />
      </v-card-text>
      <template #actions>
        <v-spacer />
        <v-btn @click="dialog = false">{{ $t('user_event_card.cancel_dialog.not_cancel') }}</v-btn>
        <v-btn variant="tonal" @click="$emit('cancel', order), (dialog = false)">
          {{ $t('user_event_card.cancel_dialog.submit') }}
        </v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>
