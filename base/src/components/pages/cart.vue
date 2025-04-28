<script setup lang="ts">
import { loadEventMembers } from '@/composable/loadEventMembers'
import { db, stripeBaseURL } from '@/firebase'
import { getCommunityPath, getEventPath, getUserPath } from '@/router/utils'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import {
  dateWithDayOfWeekString,
  dateOnlyTimeString,
  priceString,
  convertDocumentDataToEvent,
} from '@/schemes/converter'
import { type OrderItem, createEmptyOrderItem } from '@/schemes/orderItem'
import { type OrderMenu } from '@/schemes/orderMenu'
import { useStoreStoredUser } from '@/stores/storedUser'
import { useEventStore, type EventStore } from '@/stores/event'
import Stripe from 'stripe'
import { Timestamp, collectionGroup, deleteDoc, getDocs, orderBy, query, setDoc, where } from 'firebase/firestore'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import CancelPolicyDialog from '@/components/CancelPolicyDialog.vue'
import { mdiTrashCan, mdiHelpCircleOutline } from '@mdi/js'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()
const router = useRouter()
const { storedUser } = storeToRefs(useStoreStoredUser())
const userId = computed(() => storedUser.value?.userId ?? '')
const stripeApiKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string
const stripe = new Stripe(stripeApiKey, { apiVersion: '2022-11-15', maxNetworkRetries: 3 })

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

  if (event.event_deadline_datetime && event.event_deadline_datetime.toDate() < new Date()) {
    return 'deadline'
  }

  const memebers = await loadEventMembers(event.community_account, event.event_id)
  if (memebers.length >= event.event_max_people) {
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
      alertBody.value = $t('cart.cannot_order_deadline')
      break
    case 'limitPeople':
      alertBody.value = $t('cart.cannot_order_limit_people')
      break
  }
}

const openConfirmOrder = ref(false)
const confirmDialogMessage = ref('')
const selectedOrder = ref({} as OrderItem)
const selectedCartEvent = ref({} as BokudeliEvent)
const selectedMenu = ref({} as OrderMenu)

const startOrderProcess = async () => {
  const order = selectedOrder.value
  const event = selectedCartEvent.value

  if (event.event_payment == 'user_advance') {
    await createCheckoutSession(order)
  } else {
    const eventStore = useEventStore(event.event_id) as EventStore
    eventStore.updateOrderStatus(order, 'ordered')
    alertBody.value = $t('cart.order_completed')
    router.push(getEventPath(order.community_account, order.event_id))
  }
}

const createCheckoutSession = async (order: OrderItem) => {
  const lineItems = order.menus.map((menu) => {
    return {
      price_data: {
        currency: 'jpy',
        tax_behavior: 'inclusive',
        product_data: {
          name: menu.name,
          images: [menu.imageUrl],
          metadata: {
            partner_id: menu.partner_id,
          },
        },
        unit_amount: menu.price,
      },
      quantity: menu.count,
    } as Stripe.Checkout.SessionCreateParams.LineItem
  })

  try {
    const session = await stripe.checkout.sessions.create({
      success_url: `${stripeBaseURL}${getUserPath(userId.value)}?eventId=${order.event_id}&communityAccount=${
        order.community_account
      }`,
      cancel_url: `${stripeBaseURL}/`,
      customer_creation: 'if_required',
      line_items: lineItems,
      mode: 'payment',
      payment_method_types: ['card'],
      metadata: {
        eventId: order.event_id,
        eventPayment: order.event_payment,
        communityId: order.community_id,
        communityAccount: order.community_account,
        orderId: order.order_id,
        userId: userId.value,
      },
    })
    window.location.href = session.url || getEventPath(order.community_account, order.event_id)
  } catch (err) {
    alertBody.value = $t('cart.payment_failed')
  }
}

const paymentMessage = (event: BokudeliEvent) => {
  switch (event.event_payment) {
    case 'user_advance': {
      return $t('cart.confirm_order_credit_card')
    }
    case 'user_on_day': {
      return $t('cart.confirm_order_participant_on_day')
    }
    case 'community_bill': {
      return $t('cart.confirm_order_community_bill')
    }
    default: {
      return $t('cart.confirm_order')
    }
  }
}

const openUserParameterConfirm = ref(false)
const targetUserParameter = ref('')
const showConfirm = async (cart: Cart) => {
  // ユーザー名存在チェック
  if (!storedUser.value?.userName) {
    targetUserParameter.value = $t('cart.doesnt_exists_user_name')
    openUserParameterConfirm.value = true
    return
  }

  // アイコン存在チェック
  if (!storedUser.value?.userImageUrl) {
    targetUserParameter.value = $t('cart.doesnt_exists_user_image')
    openUserParameterConfirm.value = true
    return
  }

  // メールアドレス存在チェック
  if (!storedUser.value?.userEmail) {
    targetUserParameter.value = $t('cart.doesnt_exists_user_email')
    openUserParameterConfirm.value = true
    return
  }

  const checkResult = await checkCart(cart)
  if (checkResult !== true) {
    showDisableAlert(checkResult)
    return
  }

  selectedOrder.value = cart.order
  selectedCartEvent.value = cart.event
  confirmDialogMessage.value = paymentMessage(cart.event)
  openConfirmOrder.value = true
}

const openDeleteConfirm = ref(false)
const startDeleteProcess = async () => {
  const event = selectedCartEvent.value
  const eventStore = useEventStore(event.event_id) as EventStore
  await eventStore.deleteOrder(selectedOrder.value, selectedMenu.value.menu_id)
  alertBody.value = $t('cart.removed_from_cart')
  state.cartList = await loadCartList()
}

const deleteMenuInCart = async (event: BokudeliEvent, order: OrderItem, menu: OrderMenu) => {
  selectedCartEvent.value = event
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
    orderBy('updated_at', 'desc'),
  )

  const cartSnapshot = await getDocs(inCartQuery)
  const orderItems = cartSnapshot.docs.map((doc) => {
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
        console.error($t('cart.event_not_found'), { item })
        return []
      }
      const event = convertDocumentDataToEvent(eventSnapshot.docs[0].data())
      if (event.event_status.value !== 'accepting_order') {
        return []
      }

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

const isOpenCancelpolicyDialog = ref(false)

onMounted(async () => {
  state.cartList = await loadCartList()
  state.isLoading = false
})
</script>

<template>
  <div>
    <v-row v-if="!state.isLoading && state.cartList.length !== 0" justify="center">
      <v-col v-for="cart in state.cartList" :key="cart.event.event_id" cols="12" md="8" sm="8">
        <v-card class="pa-sm-5 pa-xs-1 ma-sm-10 ma-xs-1">
          <v-row>
            <v-col class="d-flex align-center">
              <v-img class="ma-5" cover aspect-ratio="1.91" :src="cart.event.event_cover_url" />
            </v-col>
          </v-row>
          <v-card-text class="text-left pb-sm-5 text-sm-subtitle-1">
            {{ $t('cart.community_name') }}
            <router-link :to="getCommunityPath(cart.event.community_account)">
              {{ cart.event.community_name }}
            </router-link>
          </v-card-text>
          <v-card-text class="text-left pb-sm-5 text-sm-subtitle-1">
            {{ $t('cart.event_name') }}
            <router-link :to="getEventPath(cart.event.community_account, cart.event.event_id)">
              {{ cart.event.event_name }}
            </router-link>
          </v-card-text>
          <v-card-text class="text-left pb-sm-5 text-sm-subtitle-1">
            {{ $t('cart.place') }} {{ cart.event.event_address }} {{ cart.event.event_place }}
          </v-card-text>
          <v-card-text class="text-left pb-sm-5 text-sm-subtitle-1">
            {{ $t('cart.date') }}{{ dateWithDayOfWeekString(cart.event.event_start_datetime) }}〜{{
              dateOnlyTimeString(cart.event.event_end_datetime)
            }}
          </v-card-text>
          <v-card-text class="text-left pb-sm-5 text-sm-subtitle-1">
            {{ $t('cart.deadline') }}{{ dateWithDayOfWeekString(cart.event.event_deadline_datetime) }}
          </v-card-text>
          <v-card-text class="text-left pb-sm-5 text-sm-subtitle-1">
            {{ $t('cart.payment') }}{{ $t(`payment.${cart.event.event_payment}`) }} <br />
          </v-card-text>
          <v-card-text class="event-item2 d-flex align-center">
            <div class="d-flex flex-column align-center">
              {{ $t('cart.cancel') }}
            </div>
            <div class="event-content d-flex flex-column align-center">
              {{ $t('cart.cancel_until_deadline') }}
            </div>
            <div class="d-flex flex-column align-center">
              <v-btn
                :icon="mdiHelpCircleOutline"
                color="primary"
                density="compact"
                variant="text"
                @click="isOpenCancelpolicyDialog = true"
              >
              </v-btn>
            </div>
          </v-card-text>
          <v-card-text class="text-left pb-sm-5 text-sm-subtitle-1">
            {{ $t('cart.shop') }}{{ cart.event.shop_name }}
          </v-card-text>

          <v-row class="text-center align-center text-md-body-1 text-caption">
            <v-col cols="12">
              <v-table>
                <thead>
                  <tr>
                    <th class="text-center" style="padding: 2px">{{ $t('cart.menu') }}</th>
                    <th class="text-center" style="padding: 1px">{{ $t('cart.count') }}</th>
                    <th class="text-center" style="padding: 1px">{{ $t('cart.price') }}</th>
                    <th class="text-center" style="padding: 1px">{{ $t('cart.subtotal') }}</th>
                    <th class="text-center" style="padding: 1px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="menu in cart.order.menus" :key="menu.menu_id">
                    <td style="padding: 1px">{{ menu.name }}</td>
                    <td style="padding: 1px">{{ menu.count }}</td>
                    <td style="padding: 1px">¥{{ priceString(menu.price) }}</td>
                    <td style="padding: 1px">¥{{ priceString(cart.subtotals[menu.menu_id]) }}</td>
                    <td style="padding: 1px">
                      <v-btn :icon="mdiTrashCan" variant="text" @click="deleteMenuInCart(cart.event, cart.order, menu)">
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-col>
          </v-row>
          <v-card-text class="text-right">
            <span class="text-right ma-2 text-h6">{{ $t('cart.total') }}</span>
            <span class="text-right my-2 ml-2 text-h6">¥</span>
            <span class="text-right ma-2 text-h4">{{ priceString(cart.total) }}</span>
          </v-card-text>
          <v-row class="justify-center">
            <v-col class="text-center">
              <v-btn
                class="my-10 text-md-h4 text-h5"
                color="grey-900"
                size="x-large"
                rounded="pill"
                elevation="5"
                width="85%"
                @click="showConfirm(cart)"
              >
                {{ $t('cart.order_and_attend_event') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
    <v-row justify="center" v-else-if="!state.isLoading">
      <v-col cols="auto" class="my-5" style="font-size: 18px"> {{ $t('cart.no_items_in_cart') }}</v-col>
    </v-row>
    <v-row v-else justify="center">
      <v-col cols="auto">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>
    <CancelPolicyDialog v-model="isOpenCancelpolicyDialog" />
    <confirm-dialog v-model="openConfirmOrder" :is-confirm="true" :ok-click="startOrderProcess">
      {{ confirmDialogMessage }}
    </confirm-dialog>
    <confirm-dialog v-model="openDeleteConfirm" :is-confirm="true" :ok-click="startDeleteProcess">
      {{ $t('cart.remove_from_cart') }}
    </confirm-dialog>
    <confirm-dialog v-model="isOpenAlert" :is-confirm="false">{{ alertMessage }}</confirm-dialog>
    <confirm-dialog
        v-model="openUserParameterConfirm"
        :is-confirm="true"
        :ok-click="() => router.push({path: '/u/profile',})"
        ok-text='設定する'
    >
      {{ targetUserParameter }}
    </confirm-dialog>
  </div>
</template>
<style lang="scss" scoped></style>
