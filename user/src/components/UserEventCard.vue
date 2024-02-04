<script setup lang="ts">
import BokudeliEvent from '@/schemes/bokudeliEvent'
import OrderItem from '@/schemes/orderItem'
import { dateWithDayOfWeekString, dateOnlyTimeString, priceString } from '@/schemes/converter'

type Order = {
  order: OrderItem
  event: BokudeliEvent
  subtotals: { [key: string]: number }
  total: number
}
const props = defineProps<{
  order: Order
}>()

const order = computed(() => props.order.order)
const event = computed(() => props.order.event)
const eventTotal = computed(() => props.order.total)

</script>
<template>
  <v-container class="pa-3">
    <v-card class="pt-8">
      <v-card-title class="justify-center pb-3 title text-h6">
        <v-img cover class="mx-auto" aspect-ratio="1.91" :src="event.event_cover_url"></v-img>
        {{  event.event_name }}
      </v-card-title>
      <v-card-text class="text-left"> 
        <p>【主催者】 {{ event.community_name }}</p>
        <p>【開催日時】{{ dateWithDayOfWeekString(event.event_start_datetime) }}〜{{ dateOnlyTimeString(event.event_end_datetime) }}</p>
        <p>【注文期限】{{ dateWithDayOfWeekString(event.event_deadline_datetime) }} </p>
        <p>【開催場所】{{ event.event_address }} </p>
        <p>【お店】 {{ event.shop_name }} </p>
        <p class="mb-0">【注文内容】</p>
        <p v-for="menu in order.menus" :key="menu.menu_id" class="pl-4 pa-0 pb-0 mb-0">
          {{ menu.name }} <span class="text-caption">({{ menu.count }}個)</span>
        </p>
        <p class="mt-4">【金額】{{ priceString(eventTotal) }}</p>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style lang="scss" scoped>
</style>
