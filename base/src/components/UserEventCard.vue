<script setup lang="ts">
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { type OrderItem } from '@/schemes/orderItem'
import { dateWithDayOfWeekString, priceString } from '@/schemes/converter'
import { getEventPath } from '@/router/utils'

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
  <router-link :to="getEventPath(event.community_account, event.event_id)" @click.native.prevent>
    <v-container class="pa-0">
      <v-card class="pa-0">
        <v-img cover class="ma-0 pa-0" aspect-ratio="1.91" :src="event.event_cover_url"></v-img>
        <v-card-title class="justify-center pb-3 title text-h6">
          {{ event.event_name }}
        </v-card-title>
        <v-card-text class="pa-3"> 【主催者】 {{ event.community_name }} </v-card-text>
        <v-card-text class="pa-3">
          【開催日時】{{ dateWithDayOfWeekString(event.event_start_datetime) }}〜
        </v-card-text>
        <v-card-text class="pa-3"> 【開催場所】{{ event.event_address }} </v-card-text>
        <v-card-text class="pa-3"> 【お店】 {{ event.shop_name }} </v-card-text>
        <v-card-text class="pa-3">
          【注文内容】
          <div v-for="menu in order.menus" :key="menu.menu_id" class="pl-4 pa-0 pb-0 mb-0">
            {{ menu.name }} <span class="text-caption">({{ menu.count }}個)</span>
          </div>
        </v-card-text>
        <v-card-text class="px-3 pb-5"> 【注文金額】¥{{ priceString(eventTotal) }} </v-card-text>
        <v-card-text>
          <v-row v-if="isShowDetail" justify="end">
            <v-spacer></v-spacer>
            <v-col v-if="isShowCancelButton" class="d-flex justify-end">
              <v-btn variant="outlined" color="secondary" size="x-small" @click.prevent="cancelClick"
                >参加注文をキャンセルする</v-btn
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
  </router-link>
</template>

<style lang="scss" scoped></style>
