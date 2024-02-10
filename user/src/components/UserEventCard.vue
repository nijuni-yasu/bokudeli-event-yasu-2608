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
  showDetail: boolean
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
}>()

const order = computed(() => props.order.order)
const event = computed(() => props.order.event)
const eventTotal = computed(() => props.order.total)

const isShowDetail = computed(() => props.showDetail)
const isShowCancelButton = computed(
  () =>
    order.value.status === 'ordered' &&
    event.value.event_deadline_datetime &&
    event.value.event_deadline_datetime?.seconds > Date.now() / 1000,
)
const isShowCanceled = computed(() => order.value.status === 'canceled')

const cancelClick = () => {
  emit('cancel')
}
</script>
<template>
  <v-container class="pa-3">
    <v-card class="pt-8">
      <v-card-title class="justify-center pb-3 title text-h6">
        <v-img cover class="mx-auto" aspect-ratio="1.91" :src="event.event_cover_url"></v-img>
        {{ event.event_name }}
      </v-card-title>
      <v-card-text class="text-left">
        <v-row
          ><v-col>【主催者】 {{ event.community_name }}</v-col></v-row
        >
        <v-row
          ><v-col
            >【開催日時】{{ dateWithDayOfWeekString(event.event_start_datetime) }}〜{{
              dateOnlyTimeString(event.event_end_datetime)
            }}</v-col
          ></v-row
        >
        <v-row
          ><v-col>【注文期限】{{ dateWithDayOfWeekString(event.event_deadline_datetime) }} </v-col></v-row
        >
        <v-row
          ><v-col>【開催場所】{{ event.event_address }} </v-col></v-row
        >
        <v-row
          ><v-col>【お店】 {{ event.shop_name }} </v-col></v-row
        >
        <v-row class="mb-0"><v-col>【注文内容】</v-col></v-row>
        <v-row v-for="menu in order.menus" :key="menu.menu_id" class="pl-4 pa-0 pb-0 mb-0">
          <v-col>
            {{ menu.name }} <span class="text-caption">({{ menu.count }}個)</span>
          </v-col>
        </v-row>
        <v-row class="mt-4"
          ><v-col>【金額】{{ priceString(eventTotal) }}</v-col></v-row
        >
        <v-row v-if="isShowDetail" justify="end">
          <v-spacer></v-spacer>
          <v-col v-if="isShowCancelButton" class="d-flex justify-end">
            <v-btn variant="text" color="secondary" size="middle" density="compact" @click="cancelClick"
              >キャンセル</v-btn
            >
          </v-col>
          <v-col v-else-if="isShowCanceled" class="d-flex justify-end">
            <div>キャンセル済み</div>
          </v-col>
        </v-row>
        <v-row v-else-if="isShowCanceled"></v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style lang="scss" scoped></style>
