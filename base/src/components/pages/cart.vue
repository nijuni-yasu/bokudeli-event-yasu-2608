<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { getCommunityPath, getEventPath, getUserPath, getProfile } from '@/router/utils'
import { BokudeliEvent } from '@shokujii/base/stores/event.js'
import { dateWithDayOfWeekString, dateOnlyTimeString, priceString } from '@shokujii/base/schemes/converter'
import { EventOrder, type OrderMenuType } from '@shokujii/common/schemas/EventOrder.js'
import { CartItem, useCurrentUserStore } from '@shokujii/base/stores/currentUser'
import { useEventStore, type EventStore } from '@shokujii/base/stores/event'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import CancelPolicyDialog from '@shokujii/base/components/CancelPolicyDialog.vue'
import {
  mdiTrashCan,
  mdiHelpCircleOutline,
  mdiFoodForkDrink,
  mdiPlusCircleOutline,
  mdiMinusCircleOutline,
} from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { createStripeCheckoutSession } from '@shokujii/base/apis/stripe'

const { t: $t } = useI18n()
const router = useRouter()

const {
  user: currentUser,
  personalInformation: currentUserPersonalInformation,
  cart,
} = storeToRefs(useCurrentUserStore())

const userId = computed(() => currentUser.value?.id ?? '')

const checkCart = async (cartItem: CartItem): Promise<true | 'deadline' | 'limitPeople' | 'unselectedMenu'> => {
  const { event } = cartItem

  if (event.event_deadline_datetime && event.event_deadline_datetime < Date.now()) {
    return 'deadline'
  }

  const eventStore = useEventStore(event.event_id)
  const members = await eventStore.getLoadedMembers()
  if (members.length >= event.event_max_people) {
    return 'limitPeople'
  }

  const eventMenus = await eventStore.getLoadedMenus()
  const hasUnselectedMenu = cartItem.order.menus.some((orderMenu) => {
    const eventMenu = eventMenus.find((m) => m.id === orderMenu.menu_id)
    return eventMenu == null || !eventMenu.is_selected
  })
  if (hasUnselectedMenu) {
    return 'unselectedMenu'
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

const showDisableAlert = (reason: 'deadline' | 'limitPeople' | 'unselectedMenu') => {
  switch (reason) {
    case 'deadline':
      alertBody.value = $t('cart.cannot_order_deadline')
      break
    case 'limitPeople':
      alertBody.value = $t('cart.cannot_order_limit_people')
      break
    case 'unselectedMenu':
      alertBody.value = $t('cart.cannot_order_unselected_menu')
      break
  }
}

const openConfirmOrder = ref(false)
const confirmDialogMessage = ref('')
const selectedOrder = ref<EventOrder | undefined>()
const selectedCartEvent = ref<BokudeliEvent | undefined>()
const selectedMenu = ref<OrderMenuType | undefined>()
const isOrderProcessing = ref<boolean>(false)
const menuUpdatingStates = ref<Record<string, boolean>>({})
const isDeleteProcessing = ref<boolean>(false)

const startOrderProcess = async () => {
  isOrderProcessing.value = true
  try {
    const order = selectedOrder.value
    const event = selectedCartEvent.value
    if (order === undefined || event === undefined) {
      return
    }

    if (event.event_payment == 'user_advance') {
      try {
        const response = (await createStripeCheckoutSession({ order, isPosted: false })) as any // 一時的措置
        window.location.href = response.data.url || getEventPath(order.community_account, order.event_id)
      } catch {
        alertBody.value = $t('cart.payment_failed')
      }
    } else {
      try {
        const eventStore = useEventStore(event.event_id) as EventStore
        await eventStore.updateOrderStatus(order, 'ordered')
        router.push(
          `${getUserPath(userId.value)}?eventId=${order.event_id}&communityAccount=${order.community_account}`,
        )
      } catch {
        alertBody.value = $t('cart.order_failed')
      }
    }
  } finally {
    isOrderProcessing.value = false
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
const showConfirm = async (cart: CartItem) => {
  // ユーザー名存在チェック
  if (!currentUser.value?.user_name) {
    targetUserParameter.value = $t('cart.doesnt_exists_user_name')
    openUserParameterConfirm.value = true
    return
  }

  // アイコン存在チェック
  if (!currentUser.value?.user_image_url) {
    targetUserParameter.value = $t('cart.doesnt_exists_user_image')
    openUserParameterConfirm.value = true
    return
  }

  // メールアドレス存在チェック
  if (!currentUserPersonalInformation.value?.user_email) {
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
  const order = selectedOrder.value
  const menu = selectedMenu.value
  if (event === undefined || order === undefined || menu === undefined) {
    console.error('Not selected')
    return
  }
  isDeleteProcessing.value = true
  try {
    const eventStore = useEventStore(event.event_id) as EventStore
    await eventStore.deleteMenuInCart(order, menu.menu_id)
    alertBody.value = $t('cart.removed_from_cart')
  } catch (error) {
    console.error('Failed to delete menu:', error)
    alertBody.value = $t('cart.delete_failed')
  } finally {
    isDeleteProcessing.value = false
    openDeleteConfirm.value = false
  }
}

const deleteMenuInCart = async (event: BokudeliEvent, order: EventOrder, menu: OrderMenuType) => {
  // 個数が1個の場合のみ削除確認ダイアログを表示
  if (menu.count === 1) {
    selectedCartEvent.value = event
    selectedOrder.value = order
    selectedMenu.value = menu
    openDeleteConfirm.value = true
  }
}

const updateMenuCount = async (event: BokudeliEvent, order: EventOrder, menu: OrderMenuType, count: number) => {
  const menuKey = `${order.order_id}_${menu.menu_id}`
  if (menuUpdatingStates.value[menuKey]) {
    return
  }
  menuUpdatingStates.value[menuKey] = true
  const eventStore = useEventStore(event.event_id) as EventStore
  try {
    await eventStore.updateMenuCountInCart(order, menu.menu_id, count)
  } catch (error) {
    console.error('Failed to update menu count:', error)
    alertBody.value = $t('cart.update_failed')
  } finally {
    menuUpdatingStates.value[menuKey] = false
  }
}

const incrementMenuCount = async (event: BokudeliEvent, order: EventOrder, menu: OrderMenuType) => {
  await updateMenuCount(event, order, menu, menu.count + 1)
}

const decrementMenuCount = async (event: BokudeliEvent, order: EventOrder, menu: OrderMenuType) => {
  if (menu.count > 1) {
    await updateMenuCount(event, order, menu, menu.count - 1)
  }
}

const isMenuUpdating = (orderId: string, menuId: string) => {
  return menuUpdatingStates.value[`${orderId}_${menuId}`] ?? false
}

const isOpenCancelpolicyDialog = ref(false)
</script>

<template>
  <v-row v-if="cart != null && cart.length !== 0" justify="center">
    <v-col cols="12" md="8" sm="8" class="pa-0 mt-5">
      <div class="text-center text-h3 my-3">{{ $t('cart.title') }}</div>
      <div class="text-center my-3">{{ $t('cart.subtitle') }}</div>
    </v-col>
    <v-col v-for="cartItem in cart" :key="cartItem.event.event_id" cols="12" md="8" sm="8">
      <v-card class="pa-0 pa-md-10 ma-0 ma-md-5">
        <v-row>
          <v-col class="d-flex align-center">
            <v-img class="ma-5" cover aspect-ratio="1.91" :src="cartItem.event.event_cover_url" />
          </v-col>
        </v-row>
        <v-card-text class="card-text-style">
          {{ $t('cart.community_name') }}
          <router-link :to="getCommunityPath(cartItem.event.community_account)">
            {{ cartItem.event.community_name }}
          </router-link>
        </v-card-text>
        <v-card-text class="card-text-style">
          {{ $t('cart.event_name') }}
          <router-link :to="getEventPath(cartItem.event.community_account, cartItem.event.event_id)">
            {{ cartItem.event.event_name }}
          </router-link>
        </v-card-text>
        <v-card-text class="card-text-style">
          {{ $t('cart.place') }} {{ cartItem.event.event_address }} {{ cartItem.event.event_place }}
        </v-card-text>
        <v-card-text class="card-text-style">
          {{ $t('cart.date') }}{{ dateWithDayOfWeekString(cartItem.event.event_start_datetime) }}〜{{
            dateOnlyTimeString(cartItem.event.event_end_datetime)
          }}
        </v-card-text>
        <v-card-text class="card-text-style">
          {{ $t('cart.deadline') }}{{ dateWithDayOfWeekString(cartItem.event.event_deadline_datetime) }}
        </v-card-text>
        <v-card-text class="card-text-style">
          {{ $t('cart.payment') }}{{ $t(`payment.${cartItem.event.event_payment}`) }} <br />
        </v-card-text>
        <v-card-text class="d-flex align-center card-text-style">
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
        <v-card-text class="card-text-style"> {{ $t('cart.shop') }}{{ cartItem.event.shop_name }} </v-card-text>
        <v-card-text class="card-text-style">
          {{ $t('cart.order_contents') }}
        </v-card-text>
        <v-row class="text-center align-center text-md-body-1 text-caption">
          <v-col cols="12" class="px-8">
            <v-card class="pa-0" elevation="1">
              <v-table>
                <thead>
                  <tr>
                    <th class="text-center" style="padding: 2px">{{ $t('cart.menu') }}</th>
                    <th class="text-center" style="padding: 1px">{{ $t('cart.count') }}</th>
                    <th class="text-center" style="padding: 1px">{{ $t('cart.subtotal') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="menu in cartItem.order.menus" :key="menu.menu_id">
                    <td style="padding: 1px">{{ menu.name }}</td>
                    <td style="padding: 1px">
                      <div class="d-flex align-center justify-center">
                        <v-btn
                          v-if="menu.count > 1"
                          :icon="mdiMinusCircleOutline"
                          variant="text"
                          :loading="isMenuUpdating(cartItem.order.order_id, menu.menu_id)"
                          @click="decrementMenuCount(cartItem.event, cartItem.order, menu)"
                        >
                        </v-btn>
                        <v-btn
                          v-else
                          :icon="mdiTrashCan"
                          variant="text"
                          :loading="isDeleteProcessing"
                          @click="deleteMenuInCart(cartItem.event, cartItem.order, menu)"
                        >
                        </v-btn>
                        <span class="mx-2">{{ menu.count }}</span>
                        <v-btn
                          :icon="mdiPlusCircleOutline"
                          variant="text"
                          :loading="isMenuUpdating(cartItem.order.order_id, menu.menu_id)"
                          @click="incrementMenuCount(cartItem.event, cartItem.order, menu)"
                        >
                        </v-btn>
                      </div>
                    </td>
                    <td style="padding: 1px">¥{{ priceString(menu.price * menu.count) }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-col>
        </v-row>
        <v-card-text class="text-right">
          <span class="text-right ma-2 text-h6">{{ $t('cart.total') }}</span>
          <span class="text-right my-2 ml-2 text-h6">¥</span>
          <span class="text-right ma-2 text-h3 text-md-h2 font-weight-bold">{{
            priceString(cartItem.order.totalPrice)
          }}</span>
        </v-card-text>

        <v-row class="justify-center">
          <v-col class="text-center">
            <v-btn
              class="mt-8 text-md-h4 text-h5"
              color="grey-900"
              size="x-large"
              :loading="isOrderProcessing"
              rounded="pill"
              elevation="5"
              width="85%"
              @click="showConfirm(cartItem)"
            >
              {{
                cartItem.event.event_payment === 'user_advance'
                  ? $t('cart.proceed_to_payment')
                  : $t('cart.order_and_attend_event')
              }}
            </v-btn>
          </v-col>
        </v-row>

        <v-row class="justify-center">
          <v-col class="text-center">
            <v-btn
              :prepend-icon="mdiFoodForkDrink"
              class="mb-8 text-md-h5 text-subtitle-1"
              color="grey-600"
              variant="text"
              size="small"
              rounded="pill"
              elevation="0"
              @click="router.push(getEventPath(cartItem.event.community_account, cartItem.event.event_id))"
            >
              {{ $t('cart.add_more_menu') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card>
    </v-col>
  </v-row>
  <v-row justify="center" v-else-if="cart != null">
    <v-col cols="auto" class="my-5" style="font-size: 18px"> {{ $t('cart.no_items_in_cart') }}</v-col>
  </v-row>
  <v-row v-else justify="center">
    <v-col cols="auto">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-col>
  </v-row>
  <CancelPolicyDialog v-model="isOpenCancelpolicyDialog" />

  <ConfirmDialog
    v-model="openConfirmOrder"
    :is-confirm="true"
    :ok-click="startOrderProcess"
    :ok-loading-state="isOrderProcessing"
  >
    {{ confirmDialogMessage }}
  </ConfirmDialog>
  <ConfirmDialog
    v-model="openDeleteConfirm"
    :is-confirm="true"
    :ok-click="startDeleteProcess"
    :ok-loading-state="isDeleteProcessing"
  >
    {{ $t('cart.remove_from_cart') }}
  </ConfirmDialog>
  <ConfirmDialog v-model="isOpenAlert" :is-confirm="false">{{ alertMessage }}</ConfirmDialog>
  <ConfirmDialog
    v-model="openUserParameterConfirm"
    :is-confirm="true"
    :ok-click="() => router.push(getProfile(false))"
    :ok-text="$t('cart.go_to_setting')"
  >
    {{ targetUserParameter }}
  </ConfirmDialog>
</template>
<style scoped>
.v-table {
  border: none !important;
}
.v-table th,
.v-table td {
  border: none !important;
}
.v-table thead th {
  border-bottom: none !important;
}
.v-table tbody tr {
  border-bottom: none !important;
}

.card-text-style {
  font-size: 14px !important;
  padding-bottom: 14px !important;
}

.x-post-section {
  background-color: #fafcfe;
  border-radius: 8px;
}

@media (max-width: 959px) {
  .card-text-style {
    font-size: 12px !important;
    padding-bottom: 12px !important;
  }
}
</style>
