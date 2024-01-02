<script setup lang="ts">
import { db } from '@/firebase'
import { collectionGroup, getDocs, orderBy, query, where } from 'firebase/firestore'

import { getEventPath } from '@/router/utils'
import { dateWithDayOfWeekString, priceString, convertDocumentDataToEvent } from '@/schemes/converter'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import OrderItem, { createEmptyOrderItem } from '@/schemes/orderItem'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

type Order = {
  order: OrderItem
  event: BokudeliEvent
  subtotals: { [key: string]: number }
  total: number
}

const props = defineProps<{
  userId: string
  showDetail: boolean
}>()

const state = reactive({
  orderList: [] as Order[],
  isLoading: true,
})

const loadOrderList = async () => {
  // オーダー情報の取得
  const inOrderQuery = query(
    collectionGroup(db, 'orders'),
    where('user_id', '==', props.userId),
    where('status', '==', 'ordered'),
    orderBy('updated_at', 'desc'),
  )

  const orderSnapshot = await getDocs(inOrderQuery)
  const orderItems = orderSnapshot.docs.map((doc) => {
    return { ...createEmptyOrderItem(), ...doc.data() }
  })

  // イベント情報を引きオーダー情報とくっつける
  const convertedList = await Promise.all(
    orderItems.map(async (item) => {
      const eventQuery = query(
        collectionGroup(db, 'events'),
        where('community_account', '==', item.community_account),
        where('event_id', '==', item.event_id),
      )
      const eventSnapshot = await getDocs(eventQuery)
      if (eventSnapshot.docs.length === 0) {
        console.error('イベントが見つかりませんでした', { item })
        return []
      }
      const event = convertDocumentDataToEvent(eventSnapshot.docs[0].data())

      const subtotals = {} as { [key: string]: number }
      item.menus.forEach((menu) => {
        subtotals[menu.menu_id] = menu.price * menu.count
      })
      const total = Object.values(subtotals).reduce((total, current) => total + current)
      return [{ order: item, event, subtotals, total }]
    }),
  )
  return convertedList.flat()
}

const fetchData = async () => {
  state.orderList = await loadOrderList()
  state.isLoading = false
}

onBeforeRouteUpdate(async (to, from, next) => {
  await fetchData()
  next()
})

onMounted(async () => {
  await fetchData()
})

const isOpenConfirmDialog = ref(false)
const cancelEvent = ref('')
const cancelPrice = ref('')
const cancelConfirmDialog  = async (item: any) => {
  isOpenConfirmDialog.value = true
  cancelEvent.value = item.event.event_name
  cancelPrice.value = priceString(item.total)
}
const startCancelProcess = () => {
  window.alert('キャンセルを開始します')
}
</script>

<template>
  <v-row v-if="!state.isLoading" class="justify-center">
    <v-col v-if="state.orderList.length" cols="12">
      <v-card class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-table class="ma-5">
              <thead>
                <tr>
                  <th style="padding: 10px; width: 350px">イベント名</th>
                  <th style="padding: 10px; width: 150px">開催日時</th>
                  <th style="padding: 10px; width: 250px">注文内容</th>
                  <th v-if="props.showDetail" style="padding: 10px; width: 100px" class="text-center">合計金額</th>
                  <th v-if="props.showDetail" style="padding: 0px; width: 30px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in state.orderList" :key="item.event.event_id">
                  <td style="padding: 10px">
                    <router-link :to="getEventPath(item.event.community_account, item.event.event_id)">
                      {{ item.event.event_name }}
                    </router-link>
                  </td>
                  <td style="padding: 10px">{{ dateWithDayOfWeekString(item.event.event_start_datetime) }}~</td>
                  <td style="padding: 10px">
                    <div v-for="menu in item.order.menus" :key="menu.menu_id">
                      {{ menu.name }} <small>({{ menu.count }}個)</small>
                    </div>
                  </td>
                  <td v-if="props.showDetail" style="padding: 10px" class="text-center">{{ priceString(item.total) }}</td>
                  <td style="padding: 3px" class="text-center">
                    <v-btn
                      v-if="props.showDetail && (item.event.event_deadline_datetime && item.event.event_deadline_datetime.seconds > Date.now() / 1000)"
                      color="white"
                      size="small"
                      rounded
                      elevation="5"
                      @click="cancelConfirmDialog(item)"
                    >
                      <v-icon>
                        mdi-credit-card-refund
                      </v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-col>
        </v-row>
      </v-card>
      <v-card-title class="my-5" style="font-size: 14px; white-space: pre-line">
        キャンセルされる場合はサポートまで<a href="https://forms.gle/z9L88Dq7vDKwbvxMA" target="_blank">お問い合わせ</a>ください。<br />
        注文締切後のキャンセルはできませんのでご了承ください。<br />
      </v-card-title>
      <confirm-dialog v-model="isOpenConfirmDialog" :is-confirm="true" :ok-text="'キャンセルする'" :cancel-text="'閉じる'" :ok-click="startCancelProcess">
        <v-card-text class="text-center py-10 text-h6">
          キャンセル
        </v-card-text>
        <v-card-text class="py-5 text-h7" style="line-height: 2rem">
          【イベント名】 {{ cancelEvent }}<br>
          【返金額】 {{ cancelPrice }}<br>
        </v-card-text>
        <v-card-text class="py-5" style="line-height: 2rem">
        注文及びイベント参加をキャンセルしますか？<br>
        キャンセルは、イベントの注文期限まで実行可能です。<br>
        キャンセル実行後、返金が明細書に表示されるまで5～10日かかります。<br>
        </v-card-text>
      </confirm-dialog>
    </v-col>
    <!-- no result found -->
    <v-col v-else-if="!state.orderList.length" cols="12" class="text-center">
      <h4 class="mt-4">Search result not found!!</h4>
    </v-col>
  </v-row>
  <v-row v-else class="justify-center">
    <v-col cols="auto">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
