<script setup lang="ts">
/**
 * Deprecated
 * Use ./UserEventCard2.vue directly
 */
import { db } from '@/firebase'
import { collectionGroup, getDocs, orderBy, query, where } from 'firebase/firestore'
import { functions } from '@/firebase'
import { httpsCallable } from 'firebase/functions'
import { priceString, convertDocumentDataToEvent } from '@/schemes/converter'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { type OrderItem, createEmptyOrderItem } from '@/schemes/orderItem'
import { fixCancelOrder } from '@/composable/fixOrder'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import UserSuccessJoinEventDialog from '@/components/UserSuccessJoinEventDialog.vue'
import { useRoute } from 'vue-router'
import UserEventCard from './UserEventCard.vue'

const route = useRoute()

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

const orderList = computed(() => {
  if (props.showDetail) {
    return state.orderList
  } else {
    return state.orderList.filter((order) => order.order.status !== 'canceled' && order.event.is_public)
  }
})

const loadOrderList = async () => {
  // オーダー情報の取得
  const inOrderQuery = query(
    collectionGroup(db, 'orders'),
    where('user_id', '==', props.userId),
    orderBy('updated_at', 'desc'),
  )

  const orderSnapshot = await getDocs(inOrderQuery)
  const orderItems = orderSnapshot.docs.map((doc) => {
    return { ...createEmptyOrderItem(), ...doc.data() }
  })
  const filteredOrderItems = orderItems.filter((item) => item.status == 'ordered' || item.status == 'canceled')

  // イベント情報を引きオーダー情報とくっつける
  const convertedList = await Promise.all(
    filteredOrderItems.map(async (item) => {
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

// 注文のキャンセル処理
const isOpenCancelConfirmDialog = ref(false)
const isOpenCancelProsessDialog = ref(false)
const isOpenCancelCompleteDialog = ref(false)
const cancelEvent = ref('')
const cancelPrice = ref('')
const cancelOrder = ref({} as OrderItem)

const cancelConfirmDialog = async (item: any) => {
  isOpenCancelConfirmDialog.value = true
  cancelEvent.value = item.event.event_name
  cancelPrice.value = priceString(item.total)
  cancelOrder.value = item.order
}

const stripeRefunds = httpsCallable(functions, 'stripe_refunds')
const startCancelProcess = async () => {
  isOpenCancelProsessDialog.value = true
  const order = cancelOrder.value
  // user_advance はstripeの支払いの場合
  if (order.event_payment == 'user_advance' && order.payment_intent) {
    stripeRefunds({ paymentIntent: order.payment_intent, orderId: order.order_id })
      .then(() => {
        fetchData()
        isOpenCancelProsessDialog.value = false
        isOpenCancelCompleteDialog.value = true
      })
      .catch((error) => {
        console.error('Error:', error)
        window.alert('キャンセルに失敗しました')
      })
    // それ以外は事前決済してないのでStripeの返金処理はなし
  } else if (order.event_payment == 'user_on_day' || order.event_payment == 'community_bill') {
    fixCancelOrder(order)
    fetchData()
    isOpenCancelProsessDialog.value = false
    isOpenCancelCompleteDialog.value = true
  }
}

// Stripeからのリダイレクトでイベントに参加した場合の処理
const joinEventId = ref('')
const communityAccount = ref('')
const isUserSuccessJoinEventDialogVisible = ref(false)
if (route.query.eventId && route.query.communityAccount) {
  joinEventId.value = route.query.eventId as string
  communityAccount.value = route.query.communityAccount as string
  isUserSuccessJoinEventDialogVisible.value = true
}
</script>

<template>
  <user-success-join-event-dialog
    v-model="isUserSuccessJoinEventDialogVisible"
    :event-id="joinEventId"
    :community-account="communityAccount"
    @click="fetchData"
  ></user-success-join-event-dialog>
  <v-row v-if="!state.isLoading" class="justify-center">
    <v-col v-if="orderList.length" cols="12">
      <v-row>
        <v-col v-for="item in orderList" :key="item.event.event_id" sm="12" md="6" lg="4" cols="12">
          <user-event-card :order="item" :show-detail="props.showDetail" @cancel="cancelConfirmDialog(item)" />
        </v-col>
      </v-row>
    </v-col>
    <!-- no result found -->
    <v-col v-else-if="!orderList.length" cols="12" class="text-center">
      <h4 class="mt-4">Search result not found!!</h4>
    </v-col>
  </v-row>
  <v-row v-else class="justify-center">
    <v-col cols="auto">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-col>
  </v-row>
  <confirm-dialog
    v-model="isOpenCancelConfirmDialog"
    :is-confirm="true"
    :ok-text="'キャンセルを実行する'"
    :cancel-text="'キャンセルしない'"
    :ok-click="startCancelProcess"
  >
    <v-card-text class="text-center py-10 text-h6"> キャンセル </v-card-text>
    <v-card-text class="py-5 text-h6" style="line-height: 2rem">
      【イベント名】 {{ cancelEvent }}<br />
      【返金額】 ¥{{ cancelPrice }}<br />
    </v-card-text>
    <v-card-text class="py-5" style="line-height: 2rem">
      注文及びイベント参加をキャンセルしますか？<br />
      キャンセルは、イベントの注文期限まで実行可能です。<br />
      キャンセル実行後、返金が明細書に表示されるまで5～10日かかります。<br />
      キャンセルは、取り消しできませんのでご注意ください。
    </v-card-text>
  </confirm-dialog>
  <confirm-dialog v-model="isOpenCancelProsessDialog">
    <v-card-text class="text-center py-10 text-h6"> キャンセル処理中... </v-card-text>
  </confirm-dialog>
  <confirm-dialog v-model="isOpenCancelCompleteDialog">
    <v-card-text class="text-center py-10 text-h6"> キャンセルが完了しました </v-card-text>
  </confirm-dialog>
</template>

<style lang="scss" scoped></style>
