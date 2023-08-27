<script setup lang="ts">
import { loadEventMembers } from '@/composable/loadEventMembers'
import { db } from '@/firebase'
import { getCommunityPath, getEventPath } from '@/router/utils'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { dateString, priceString, convertDocumentDataToEvent } from '@/schemes/converter'
import OrderItem from '@/schemes/orderItem'
import OrderMenu from '@/schemes/orderMenu'
import { useStoreStoredUser } from '@/stores/storedUser'
import Stripe from 'stripe'
import {
  Timestamp,
  collectionGroup,
  deleteDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const { storedUser } = storeToRefs(useStoreStoredUser())
const userId = computed(() => storedUser.value?.userId ?? '')
const stripeApiKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string
const stripe = new Stripe(stripeApiKey, {apiVersion: "2022-11-15", maxNetworkRetries: 3})
const origin = process.env.NODE_ENV === 'development' ? `http://localhost:5173` : `${import.meta.env.VITE_ORIGIN_HOST}`

type Cart = {
  order: OrderItem
  subtotals: { [key: string]: number }
  total: number
  event: BokudeliEvent
}

const state = reactive({
  cartList: [] as Cart[],
  isLoading: true,
})

const checkCart = async (cart: Cart): Promise<true | 'deadline' | 'limitPeople'> => {
  const { event } = cart

  if (event.eventDeadline && event.eventDeadline < new Date()) {
    return 'deadline'
  }

  const memebers = await loadEventMembers(event.communityAccount, event.eventId)
  if (memebers.length >= event.eventMaxPeople) {
    return 'limitPeople'
  }
  return true
}

const isOpenAlert = ref(false)
const alertMessage = ref('')

const alertBody = computed({
  get() {
    return alertMessage.value
  },
  set(val) {
    alertMessage.value = val
    isOpenAlert.value = true
  },
})

const showDisableAlert = (reason: 'deadline' | 'limitPeople') => {
  switch (reason) {
    case 'deadline':
      alertBody.value = '注文期限をすぎました。注文確定できません'
      break
    case 'limitPeople':
      alertBody.value = '定員に達しました。注文確定できません'
      break
  }
}

const openConfirmOrder = ref(false)
const selectedOrder = ref({} as OrderItem)
const selectedMenu = ref({} as OrderMenu)

const startOrderProcess = async () => {
  const order = selectedOrder.value
  const orderId = order.order_id
  const lineItems = order.menus.map(menu => {
  return {
    price_data: {
      currency: 'jpy',
      tax_behavior: 'inclusive',
      product_data: {
        name: menu.name,
        images: [menu.imageUrl],
        metadata: {
          'partner_id': menu.partner_id
        },
      },
      unit_amount: menu.price,
    },
    quantity: menu.count
  };
});

  try {
      const session = await stripe.checkout.sessions.create({
        success_url: `${origin}/users/${userId.value}?eventId=${order.event_id}&communityAccount=${order.community_account}`,
        cancel_url: `${origin}/`,
        customer_creation: 'if_required',
        line_items: lineItems,
        mode: 'payment',
        payment_method_types: ["card"],
        metadata: {
          'eventId': order.event_id,
          'communityId': order.community_id,
          'communityAccount':order.community_account,
          'orderId': orderId,
          'userId': userId.value
        }
      });
      window.location.href = session.url || getEventPath(order.community_account, order.event_id)


    } catch (err) {
      alertBody.value = '決算処理に失敗しました。管理者にお問い合わせください。'
    }
}

const showConfirm = async (cart: Cart) => {
  const checkResult = await checkCart(cart)
  if (checkResult !== true) {
    showDisableAlert(checkResult)
    return
  }

  selectedOrder.value = cart.order
  openConfirmOrder.value = true
}

const openDeleteConfirm = ref(false)
const startDeleteProcess = async () => {
  const orderId = selectedOrder.value.order_id
  const menu = selectedMenu.value

  const orderRef = query(collectionGroup(db, 'orders'), where('order_id', '==', orderId))
  const orderSnapshot = await getDocs(orderRef)
  const orderDocument = orderSnapshot.docs[0]
  const currentMenus = orderDocument.data().menus as OrderMenu[]
  const menus = currentMenus.filter((m) => m.menu_id !== menu.menu_id)

  const updated_at = Timestamp.now()
  if (menus.length === 0) {
    deleteDoc(orderDocument.ref)
  } else {
    await setDoc(orderDocument.ref, { menus, updated_at }, { merge: true })
  }
  alertBody.value = 'カートから削除しました'
  state.cartList = await loadCartList()
}

const deleteMenuInCart = async (order: OrderItem, menu: OrderMenu) => {
  selectedOrder.value = order
  selectedMenu.value = menu
  openDeleteConfirm.value = true
}

const loadCartList = async () => {
  // カート情報の取得
  const inCartQuery = query(
    collectionGroup(db, 'orders'),
    where('user_id', '==', userId.value),
    where('status', '==', 'in_cart'),
    orderBy('updated_at', 'desc')
  )

  const cartSnapshot = await getDocs(inCartQuery)
  const orderItems = cartSnapshot.docs.map((doc) => {
    return doc.data() as OrderItem
  })

  // イベント情報を引きオーダー情報とくっつける
  const convertedList = await Promise.all(
    orderItems.map(async (item) => {
      const eventQuery = query(
        collectionGroup(db, 'events'),
        where('community_account', '==', item.community_account),
        where('event_id', '==', item.event_id)
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
    })
  )

  return convertedList.flat()
}

onMounted(async () => {
  state.cartList = await loadCartList()
  state.isLoading = false
})
</script>

<template>
  <div>
    <v-row v-if="!state.isLoading && state.cartList.length !== 0" justify="center">
      <v-col v-for="cart in state.cartList" :key="cart.event.eventId" cols="12" md="8" sm="8">
        <v-card class="pa-sm-5 pa-xs-1 ma-sm-10 ma-xs-1">
          <v-row>
            <v-col class="d-flex align-center">
              <v-img class="ma-10" cover aspect-ratio="1.91" :src="cart.event.eventCoverUrl" />
            </v-col>
          </v-row>
          <v-card-text class="text-left pb-sm-5 text-sm-subtitle-1">
            【主催者】
            <router-link :to="getCommunityPath(cart.event.communityAccount)">
              {{ cart.event.communityName }}
            </router-link>
          </v-card-text>
          <v-card-text class="text-left pb-sm-5 text-sm-subtitle-1">
            【イベント】
            <router-link :to="getEventPath(cart.event.communityAccount, cart.event.eventId)">
              {{ cart.event.eventName }}
            </router-link>
          </v-card-text>
          <v-card-text class="text-left pb-sm-5 text-sm-subtitle-1">
            【開催場所】{{ cart.event.eventAddress }}
          </v-card-text>
          <v-card-text class="text-left pb-sm-5 text-sm-subtitle-1">
            【開催日時】{{ dateString(cart.event.eventStartDatetime) }}
          </v-card-text>
          <v-card-text class="text-left pb-sm-5 text-sm-subtitle-1">
            【注文期限】{{ dateString(cart.event.eventDeadline) }}
          </v-card-text>
          <v-card-text class="text-left pb-sm-5 text-sm-subtitle-1"> 【お店】{{ cart.event.shopName }} </v-card-text>

          <v-row class="text-center align-center text-md-body-1 text-caption">
            <v-col cols="12">
              <v-table>
                <thead>
                  <tr>
                    <th class="text-center" style="padding: 1px">メニュー</th>
                    <th class="text-center" style="padding: 1px">個数</th>
                    <th class="text-center" style="padding: 1px">価格</th>
                    <th class="text-center" style="padding: 1px">小計</th>
                    <th class="text-center" style="padding: 1px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="menu in cart.order.menus" :key="menu.menu_id">
                    <td style="padding: 1px">{{ menu.name }}</td>
                    <td style="padding: 1px">{{ menu.count }}</td>
                    <td style="padding: 1px">{{ priceString(menu.price) }}</td>
                    <td style="padding: 1px">{{ priceString(cart.subtotals[menu.menu_id]) }}</td>
                    <td style="padding: 1px">
                      <v-btn variant="text" @click="deleteMenuInCart(cart.order, menu)">削除</v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-col>
          </v-row>
          <v-card-text class="text-right">
            <span class="text-right ma-2 text-h6">合計</span>
            <span class="text-right ma-2 text-h4">{{ priceString(cart.total) }}</span>
          </v-card-text>
          <v-row class="justify-center">
            <v-col class="text-center">
              <v-btn
                class="ma-10 text-h6"
                color="grey-900"
                size="x-large"
                rounded
                width="70%"
                @click="showConfirm(cart)"
              >
                注文してイベントに参加する
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-else-if="!state.isLoading">
      <v-col cols="auto"> まだカートに入っていません </v-col>
    </v-row>
    <v-row v-else justify="center">
      <v-col cols="auto">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>
    <confirm-dialog v-model="openConfirmOrder" :is-confirm="true" :ok-click="startOrderProcess">
      注文を確定しますか？
    </confirm-dialog>
    <confirm-dialog v-model="openDeleteConfirm" :is-confirm="true" :ok-click="startDeleteProcess">
      カートから削除しますか？
    </confirm-dialog>
    <confirm-dialog v-model="isOpenAlert" :is-confirm="false">{{ alertMessage }}</confirm-dialog>
  </div>
</template>
<style lang="scss" scoped></style>