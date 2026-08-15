<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { getAuth } from 'firebase/auth'
import { getCommunityPath, getEventPath, getProfile } from '@/router/utils'
import { BokudeliEvent } from '@shokujii/base/stores/event.js'
import { dateWithDayOfWeekString, dateOnlyTimeString, priceString } from '@shokujii/base/schemes/converter'
import { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import { CartItem, useCurrentUserStore } from '@shokujii/base/stores/currentUser'
import { useEventStore, buildEventStoreOptions, type EventStoreOptions } from '@shokujii/base/stores/event'
import { computeTotalPayment } from '@shokujii/common/utils/paymentCommunityBillOffAmount.js'
import {
  computeMemberOrdersTotalPayment,
  getMemberOrderDiscountAmount,
  replayEnterpriseSubsidyAmountsForOrders,
  resolveEnterpriseSubsidySettingsForMonth,
} from '@shokujii/common/utils/paymentEnterpriseSubsidyAmount.js'
import type { EnterpriseSubsidySettingsType } from '@shokujii/common/schemas/EnterpriseSubsidySettings.js'
import { formatYearMonth } from '@shokujii/common/utils/datetime.js'
import {
  sortEventMemberOrdersForEnterpriseSubsidyReplay,
  sortOrderIdsForEnterpriseSubsidyReplay,
} from '@shokujii/common/utils/eventMemberOrderSort.js'
import { isWithinOrderDeadline } from '@shokujii/common/utils/orderDeadline.js'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import CancelPolicyDialog from '@shokujii/base/components/CancelPolicyDialog.vue'
import { convertStoragePathToURL } from '@shokujii/base/utils/storage.js'
import { getEventCoverStoragePath } from '@shokujii/common/utils/storagePaths.js'
import EventDiscountChip from '@shokujii/base/components/EventDiscountChip.vue'
import {
  mdiTrashCan,
  mdiHelpCircleOutline,
  mdiFoodForkDrink,
  mdiPlusCircleOutline,
  mdiMinusCircleOutline,
} from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { createStripeCheckoutSession } from '@shokujii/base/apis/stripe'
import {
  pfCartEnterpriseSubsidyBudgetLoader,
  fetchCartEnterpriseSubsidyBudget,
  type CartEnterpriseSubsidyBudget,
  type CartEnterpriseSubsidyBudgetLoader,
} from '@shokujii/base/composable/cartMonthlyUsage.js'
import type { ResolveOrdersPathFn } from '@shokujii/base/types/profilePathResolvers.js'

const props = withDefaults(
  defineProps<{
    /** 福利厚生: 開催月別確定 usage（enterprise 注入） */
    enterpriseSubsidyBudgetLoader?: CartEnterpriseSubsidyBudgetLoader
    /** 注文確定後の注文履歴 URL（各 app の cart shell から注入） */
    resolveOrdersPath: ResolveOrdersPathFn
  }>(),
  {
    enterpriseSubsidyBudgetLoader: pfCartEnterpriseSubsidyBudgetLoader,
  },
)

const { t: $t } = useI18n()
const router = useRouter()

const {
  user: currentUser,
  personalInformation: currentUserPersonalInformation,
  cart,
} = storeToRefs(useCurrentUserStore())

const userId = computed(() => currentUser.value?.id ?? '')

async function resolveEventStoreOptions(): Promise<EventStoreOptions> {
  const auth = getAuth()
  const user = auth.currentUser
  if (user == null) {
    return {}
  }
  try {
    const token = await user.getIdTokenResult()
    return buildEventStoreOptions(token.claims.enterprise_id as string | undefined)
  } catch {
    return {}
  }
}

type GroupedMenu = {
  menu_id: string
  menu_name: string
  menu_price: number
  count: number
  order_ids: string[]
  totalPrice: number
  totalDiscount: number
  totalPayment: number
  /** 1個分の割引。enterprise_subsidy では品目ごとに異なり得るため表示は totalDiscount/count を使用 */
  offAmountPerUnit: number
}

const groupOrdersByMenu = (orders: EventMemberOrder[]): GroupedMenu[] => {
  const map = new Map<string, GroupedMenu>()
  for (const order of orders) {
    const discount = getMemberOrderDiscountAmount(order)
    const existing = map.get(order.menu_id)
    if (existing) {
      existing.count++
      existing.order_ids.push(order.order_id)
      existing.totalPrice += order.menu_price
      existing.totalDiscount += discount
      existing.totalPayment += order.menu_price - discount
    } else {
      map.set(order.menu_id, {
        menu_id: order.menu_id,
        menu_name: order.menu_name,
        menu_price: order.menu_price,
        count: 1,
        order_ids: [order.order_id],
        totalPrice: order.menu_price,
        totalDiscount: discount,
        totalPayment: order.menu_price - discount,
        offAmountPerUnit: discount,
      })
    }
  }
  return Array.from(map.values())
}

type EnrichedCartItem = CartItem & {
  groupedMenus: GroupedMenu[]
  totalMenuPrice: number
  totalDiscount: number
  totalPrice: number
  eventMonthLabel: string
  /** 開催月の確定済み利用額（budget ロード後） */
  eventMonthUsed: number | null
  eventMonthLimit: number | null
  /** 開催月の残り予算（確定済み利用を差し引いた値。この注文前） */
  eventMonthRemaining: number | null
  /** replay ベースの合計を表示している */
  subsidyTotalsFromReplay: boolean
}

const enterpriseSubsidyBudget = ref<CartEnterpriseSubsidyBudget | null>(null)

let subsidyBudgetLoadGeneration = 0

const reloadEnterpriseSubsidyBudget = async (): Promise<void> => {
  const uid = userId.value
  if (uid === '') {
    enterpriseSubsidyBudget.value = null
    return
  }
  const generation = ++subsidyBudgetLoadGeneration
  const normalized = await fetchCartEnterpriseSubsidyBudget(uid, props.enterpriseSubsidyBudgetLoader)
  if (generation !== subsidyBudgetLoadGeneration) {
    return
  }
  enterpriseSubsidyBudget.value = normalized
}

watch(
  userId,
  async (uid) => {
    if (uid === '') {
      subsidyBudgetLoadGeneration++
      enterpriseSubsidyBudget.value = null
      return
    }
    await reloadEnterpriseSubsidyBudget()
  },
  { immediate: true },
)

const computeEnterpriseSubsidyCartTotals = (
  event: BokudeliEvent,
  orders: EventMemberOrder[],
  budget: CartEnterpriseSubsidyBudget | null,
): Pick<
  EnrichedCartItem,
  | 'totalMenuPrice'
  | 'totalDiscount'
  | 'totalPrice'
  | 'eventMonthUsed'
  | 'eventMonthLimit'
  | 'eventMonthRemaining'
  | 'subsidyTotalsFromReplay'
> => {
  const totalMenuPrice = orders.reduce((sum, o) => sum + o.menu_price, 0)
  const replayOrders = sortEventMemberOrdersForEnterpriseSubsidyReplay(orders)
  const eventMonth = formatYearMonth(event.event_start_datetime)
  const monthlyUsageByMonth = budget?.monthlyUsage ?? null
  let settings: EnterpriseSubsidySettingsType | null
  try {
    settings =
      budget == null ? null : resolveEnterpriseSubsidySettingsForMonth(budget.subsidySettingsHistory, eventMonth)
  } catch {
    settings = null
  }
  if (settings == null || monthlyUsageByMonth == null) {
    const totalDiscount = orders.reduce((sum, o) => sum + getMemberOrderDiscountAmount(o), 0)
    return {
      totalMenuPrice,
      totalDiscount,
      totalPrice: computeMemberOrdersTotalPayment(orders),
      eventMonthUsed: null,
      eventMonthLimit: null,
      eventMonthRemaining: null,
      subsidyTotalsFromReplay: false,
    }
  }
  const monthlyUsed = monthlyUsageByMonth[eventMonth] ?? 0
  const monthlyLimit = settings.monthly_limit_per_user
  const replay = replayEnterpriseSubsidyAmountsForOrders('enterprise_subsidy', settings, replayOrders, monthlyUsed)
  return {
    totalMenuPrice,
    totalDiscount: replay.subsidyTotal,
    totalPrice: replay.totalPayment,
    eventMonthUsed: monthlyUsed,
    eventMonthLimit: monthlyLimit,
    eventMonthRemaining: Math.max(0, monthlyLimit - monthlyUsed),
    subsidyTotalsFromReplay: true,
  }
}

/** 主催者請求かつおごり設定ありのとき、カート注文テーブルに「おごり」列を出す */
const hasCartCommunityBill = (event: BokudeliEvent): boolean =>
  event.event_payment === 'community_bill' && event.community_bill_settings != null

/** EventDetailsCard と同じ主催者請求の表示用 i18n キー */
const getEventPaymentI18nKey = (event: BokudeliEvent) => {
  if (event.event_payment === 'community_bill') {
    return event.community_bill_settings?.type === 'discount'
      ? 'payment.community_bill_discount'
      : 'payment.community_bill_free'
  }
  if (event.event_payment === 'enterprise_subsidy') {
    return 'payment.enterprise_subsidy'
  }
  return `payment.${event.event_payment}`
}

/** 福利厚生割引イベントのカート表示 */
const hasCartEnterpriseSubsidy = (event: BokudeliEvent): boolean => event.event_payment === 'enterprise_subsidy'

/** community_bill + discount でかつ差額 Stripe 決済が必要かどうか */
const needsCommunityBillStripe = (event: BokudeliEvent, orders: EventMemberOrder[]): boolean => {
  if (event.event_payment !== 'community_bill') return false
  if (event.community_bill_settings?.type !== 'discount') return false
  return computeTotalPayment(orders) > 0
}

const getEventMonthLabel = (event: BokudeliEvent): string => {
  const month = formatYearMonth(event.event_start_datetime)
  const [, m] = month.split('-')
  return `${Number(m)}月`
}

const enrichedCart = computed<EnrichedCartItem[] | null>(() => {
  if (cart.value == null) return null
  const budget = enterpriseSubsidyBudget.value
  return cart.value.map((cartItem) => {
    const subsidyTotals =
      cartItem.event.event_payment === 'enterprise_subsidy'
        ? computeEnterpriseSubsidyCartTotals(cartItem.event, cartItem.orders, budget)
        : {
            totalMenuPrice: cartItem.orders.reduce((sum, o) => sum + o.menu_price, 0),
            totalDiscount: cartItem.orders.reduce((sum, o) => sum + getMemberOrderDiscountAmount(o), 0),
            totalPrice: computeMemberOrdersTotalPayment(cartItem.orders),
            eventMonthUsed: null,
            eventMonthLimit: null,
            eventMonthRemaining: null,
            subsidyTotalsFromReplay: false,
          }
    return {
      ...cartItem,
      groupedMenus: groupOrdersByMenu(cartItem.orders),
      ...subsidyTotals,
      eventMonthLabel: getEventMonthLabel(cartItem.event),
    }
  })
})

const findEnrichedCartItem = (cartItem: CartItem): EnrichedCartItem | undefined =>
  enrichedCart.value?.find((item) => item.event.event_id === cartItem.event.event_id)

const needsStripeCheckoutForItem = (item: EnrichedCartItem): boolean => {
  const { event, orders } = item
  if (event.event_payment === 'user_advance') return true
  if (needsCommunityBillStripe(event, orders)) return true
  if (event.event_payment === 'enterprise_subsidy') return item.totalPrice > 0
  return false
}

const checkCart = async (cartItem: CartItem): Promise<true | 'deadline' | 'limitPeople' | 'unselectedMenu'> => {
  const { event, orders } = cartItem

  if (!isWithinOrderDeadline(event.event_deadline_datetime)) {
    return 'deadline'
  }

  const eventStoreOptions = await resolveEventStoreOptions()
  const eventStore = useEventStore(event.event_id, eventStoreOptions)
  const members = await eventStore.getLoadedMembers()
  if (members.length >= event.event_max_people) {
    return 'limitPeople'
  }

  const eventMenus = await eventStore.getLoadedMenus()
  const menuIds = new Set(orders.map((o) => o.menu_id))
  for (const menuId of menuIds) {
    const eventMenu = eventMenus.find((m) => m.id === menuId)
    if (eventMenu == null || !eventMenu.is_selected) {
      return 'unselectedMenu'
    }
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
const selectedCartItem = ref<CartItem | undefined>()
const isOrderProcessing = ref<boolean>(false)
const menuUpdatingStates = ref<Record<string, boolean>>({})
const isDeleteProcessing = ref<boolean>(false)

const startOrderProcess = async () => {
  isOrderProcessing.value = true
  try {
    const cartItem = selectedCartItem.value
    if (cartItem === undefined) return

    const enriched = findEnrichedCartItem(cartItem)
    if (enriched === undefined) return

    const { event, orders } = cartItem
    const orderIds = sortOrderIdsForEnterpriseSubsidyReplay(orders)
    const communityId = event.community_id
    const eventId = event.event_id

    if (needsStripeCheckoutForItem(enriched)) {
      try {
        const response = await createStripeCheckoutSession({
          community_id: communityId,
          event_id: eventId,
          order_ids: orderIds,
          isPosted: false,
          origin: window.location.origin,
        })
        if (response.data.subsidy_recalculated) {
          await reloadEnterpriseSubsidyBudget()
          alertBody.value = $t('cart.subsidy_recalculated')
          return
        }
        window.location.href = response.data.url ?? getEventPath(event.community_account, eventId)
      } catch {
        alertBody.value = $t('cart.payment_failed')
      }
    } else {
      try {
        const eventStoreOptions = await resolveEventStoreOptions()
        const eventStore = useEventStore(eventId, eventStoreOptions)
        const confirmResult = await eventStore.confirmOrder({
          community_id: communityId,
          event_id: eventId,
          order_ids: orderIds,
        })
        if (confirmResult.subsidy_recalculated) {
          await reloadEnterpriseSubsidyBudget()
          alertBody.value = $t('cart.subsidy_recalculated')
          return
        }
      } catch {
        alertBody.value = $t('cart.order_failed')
        return
      }
      try {
        await router.push(props.resolveOrdersPath({ eventId, communityAccount: event.community_account }))
      } catch (error) {
        console.error('Failed to navigate after order:', error)
      }
    }
  } finally {
    isOrderProcessing.value = false
  }
}

const paymentMessageForItem = (item: EnrichedCartItem) => {
  const { event, orders, totalPrice } = item
  if (event.event_payment === 'user_advance') return $t('cart.confirm_order_credit_card')
  if (event.event_payment === 'user_on_day') return $t('cart.confirm_order_participant_on_day')
  if (event.event_payment === 'enterprise_subsidy') {
    if (totalPrice > 0) {
      return $t('cart.confirm_order_enterprise_subsidy_checkout')
    }
    return $t('cart.confirm_order_enterprise_subsidy_zero')
  }
  if (event.event_payment === 'community_bill') {
    if (needsCommunityBillStripe(event, orders)) return $t('cart.confirm_order_community_bill_checkout')
    return $t('cart.confirm_order_community_bill')
  }
  return $t('cart.confirm_order')
}

const openUserParameterConfirm = ref(false)
const targetUserParameter = ref('')
const showConfirm = async (cartItem: CartItem) => {
  if (currentUser.value?.user_name == null || currentUser.value.user_name === '') {
    targetUserParameter.value = $t('cart.doesnt_exists_user_name')
    openUserParameterConfirm.value = true
    return
  }
  if (!currentUser.value?.user_image_url) {
    targetUserParameter.value = $t('cart.doesnt_exists_user_image')
    openUserParameterConfirm.value = true
    return
  }
  if (!currentUserPersonalInformation.value?.user_email) {
    targetUserParameter.value = $t('cart.doesnt_exists_user_email')
    openUserParameterConfirm.value = true
    return
  }

  const checkResult = await checkCart(cartItem)
  if (checkResult !== true) {
    showDisableAlert(checkResult)
    return
  }

  selectedCartItem.value = cartItem
  const enriched = findEnrichedCartItem(cartItem)
  if (enriched === undefined) {
    return
  }
  if (needsStripeCheckoutForItem(enriched)) {
    await startOrderProcess()
    return
  }
  confirmDialogMessage.value = paymentMessageForItem(enriched)
  openConfirmOrder.value = true
}

const openDeleteConfirm = ref(false)
const selectedDeleteOrderId = ref<string | undefined>()
const selectedDeleteEvent = ref<BokudeliEvent | undefined>()

const startDeleteProcess = async () => {
  const event = selectedDeleteEvent.value
  const orderId = selectedDeleteOrderId.value
  if (event === undefined || orderId === undefined) return

  isDeleteProcessing.value = true
  try {
    const eventStoreOptions = await resolveEventStoreOptions()
    const eventStore = useEventStore(event.event_id, eventStoreOptions)
    await eventStore.removeFromCart({
      community_id: event.community_id,
      event_id: event.event_id,
      order_id: orderId,
    })
    alertBody.value = $t('cart.removed_from_cart')
  } catch (error) {
    console.error('Failed to remove from cart:', error)
    alertBody.value = $t('cart.delete_failed')
  } finally {
    isDeleteProcessing.value = false
    openDeleteConfirm.value = false
  }
}

const showDeleteConfirm = (event: BokudeliEvent, orderId: string) => {
  selectedDeleteEvent.value = event
  selectedDeleteOrderId.value = orderId
  openDeleteConfirm.value = true
}

const incrementMenuCount = async (event: BokudeliEvent, menu: GroupedMenu) => {
  const menuKey = `add_${menu.menu_id}`
  if (menuUpdatingStates.value[menuKey]) return
  menuUpdatingStates.value[menuKey] = true
  try {
    const eventStoreOptions = await resolveEventStoreOptions()
    const eventStore = useEventStore(event.event_id, eventStoreOptions)
    await eventStore.addToCart({
      community_id: event.community_id,
      event_id: event.event_id,
      menus: [
        {
          menu_id: menu.menu_id,
          count: 1,
        },
      ],
    })
  } catch (error) {
    console.error('Failed to add to cart:', error)
    alertBody.value = $t('cart.update_failed')
  } finally {
    menuUpdatingStates.value[menuKey] = false
  }
}

const decrementMenuCount = async (event: BokudeliEvent, menu: GroupedMenu) => {
  if (menu.count <= 1) return
  const menuKey = `remove_${menu.menu_id}`
  if (menuUpdatingStates.value[menuKey]) return
  menuUpdatingStates.value[menuKey] = true
  try {
    const lastOrderId = menu.order_ids[menu.order_ids.length - 1]
    const eventStoreOptions = await resolveEventStoreOptions()
    const eventStore = useEventStore(event.event_id, eventStoreOptions)
    await eventStore.removeFromCart({
      community_id: event.community_id,
      event_id: event.event_id,
      order_id: lastOrderId,
    })
  } catch (error) {
    console.error('Failed to remove from cart:', error)
    alertBody.value = $t('cart.update_failed')
  } finally {
    menuUpdatingStates.value[menuKey] = false
  }
}

const isMenuUpdating = (menuId: string) => {
  return (menuUpdatingStates.value[`add_${menuId}`] || menuUpdatingStates.value[`remove_${menuId}`]) ?? false
}

const isOpenCancelpolicyDialog = ref(false)
</script>

<template>
  <v-row v-if="enrichedCart != null && enrichedCart.length !== 0" justify="center">
    <v-col cols="12" md="8" sm="8" class="pa-0 mt-5">
      <div class="text-center text-h3 my-3">{{ $t('cart.title') }}</div>
      <div class="text-center my-3">{{ $t('cart.subtitle') }}</div>
    </v-col>
    <v-col v-for="cartItem in enrichedCart" :key="cartItem.event.event_id" cols="12" md="8" sm="8">
      <v-card class="pa-0 pa-md-10 ma-0 ma-md-5">
        <v-row>
          <v-col class="d-flex align-center">
            <v-img
              class="ma-5"
              cover
              aspect-ratio="1.91"
              :src="
                convertStoragePathToURL(getEventCoverStoragePath(cartItem.event.community_id, cartItem.event.event_id))
              "
            />
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
          {{ $t('cart.place') }} {{ cartItem.event.fullAddress }} {{ cartItem.event.event_place }}
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
          <div class="d-flex align-center flex-wrap">
            <span> {{ $t('cart.payment') }}{{ $t(getEventPaymentI18nKey(cartItem.event)) }} </span>
            <EventDiscountChip
              v-if="cartItem.event.event_payment === 'community_bill' && cartItem.event.community_bill_settings != null"
              :settings="cartItem.event.community_bill_settings"
              size="x-small"
              class="ml-1"
            />
          </div>
        </v-card-text>
        <v-card-text
          v-if="cartItem.event.event_payment === 'community_bill' && cartItem.event.community_bill_settings != null"
          class="card-text-style pt-0"
        >
          <v-alert variant="tonal" color="discount" class="mb-0 cart-community-bill-banner">
            <template v-if="cartItem.event.community_bill_settings.type === 'free'">
              {{ $t('discount_settings.banner_free') }}
            </template>
            <template v-else-if="cartItem.event.community_bill_settings.type === 'discount'">
              {{ $t('discount_settings.banner_discount', [cartItem.event.community_bill_settings.off_amount]) }}
            </template>
          </v-alert>
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
                    <th class="text-center" style="padding: 1px">{{ $t('cart.unit_price') }}</th>
                    <th v-if="hasCartCommunityBill(cartItem.event)" class="text-center" style="padding: 1px">
                      {{ $t('cart.off_amount') }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="menu in cartItem.groupedMenus" :key="menu.menu_id">
                    <td style="padding: 1px">{{ menu.menu_name }}</td>
                    <td style="padding: 1px">
                      <div class="d-flex align-center justify-center">
                        <v-btn
                          v-if="menu.count > 1"
                          :icon="mdiMinusCircleOutline"
                          variant="text"
                          :loading="isMenuUpdating(menu.menu_id)"
                          @click="decrementMenuCount(cartItem.event, menu)"
                        >
                        </v-btn>
                        <v-btn
                          v-else
                          :icon="mdiTrashCan"
                          variant="text"
                          :loading="isDeleteProcessing"
                          @click="showDeleteConfirm(cartItem.event, menu.order_ids[0])"
                        >
                        </v-btn>
                        <span class="mx-2">{{ menu.count }}</span>
                        <v-btn
                          :icon="mdiPlusCircleOutline"
                          variant="text"
                          :loading="isMenuUpdating(menu.menu_id)"
                          @click="incrementMenuCount(cartItem.event, menu)"
                        >
                        </v-btn>
                      </div>
                    </td>
                    <td class="text-center" style="padding: 1px">¥{{ priceString(menu.menu_price) }}</td>
                    <td
                      v-if="hasCartCommunityBill(cartItem.event)"
                      class="text-center"
                      style="padding: 1px"
                      :class="menu.totalDiscount > 0 ? 'text-caption text-discount' : ''"
                    >
                      <template v-if="menu.totalDiscount > 0"> -¥{{ priceString(menu.totalDiscount) }} </template>
                      <template v-else>—</template>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-col>
        </v-row>
        <v-row v-if="hasCartEnterpriseSubsidy(cartItem.event)" class="text-center align-center">
          <v-col cols="12" class="px-8 pb-2">
            <v-sheet rounded="lg" class="pa-4 cart-enterprise-subsidy-summary" border>
              <div
                v-if="cartItem.eventMonthLimit != null && cartItem.eventMonthRemaining != null"
                class="text-body-2 text-medium-emphasis mb-3 cart-enterprise-subsidy-month-budget"
              >
                <div class="font-weight-medium mb-1">
                  {{ $t('cart.event_month_subsidy_heading', [cartItem.eventMonthLabel]) }}
                </div>
                <div>
                  {{
                    $t('cart.event_month_subsidy_remaining_limit', [
                      priceString(cartItem.eventMonthRemaining),
                      priceString(cartItem.eventMonthLimit),
                    ])
                  }}
                </div>
              </div>
              <div class="d-flex justify-space-between text-body-2 text-medium-emphasis mb-2">
                <span>{{ $t('cart.order_total') }}</span>
                <span class="cart-subsidy-amount">¥{{ priceString(cartItem.totalMenuPrice) }}</span>
              </div>
              <div
                v-if="cartItem.totalDiscount > 0"
                class="d-flex justify-space-between text-body-2 text-discount mb-2"
              >
                <span>{{ $t('cart.company_subsidy_total') }}</span>
                <span class="cart-subsidy-amount">-¥{{ priceString(cartItem.totalDiscount) }}</span>
              </div>
              <v-divider class="my-3" />
              <div class="d-flex justify-space-between align-end">
                <span class="text-body-1 font-weight-medium">{{ $t('cart.your_payment') }}</span>
                <span class="text-h5 text-md-h4 font-weight-bold cart-subsidy-amount">
                  ¥{{ priceString(cartItem.totalPrice) }}
                </span>
              </div>
              <div v-if="cartItem.totalPrice === 0" class="mt-3">
                <v-alert variant="tonal" color="success" density="compact" class="mb-0 cart-subsidy-summary-alert">
                  {{ $t('cart.enterprise_subsidy_zero_payment') }}
                </v-alert>
              </div>
              <div v-else-if="cartItem.totalDiscount > 0 && cartItem.totalPrice > 0" class="mt-3">
                <v-alert variant="tonal" color="discount" density="compact" class="mb-0 cart-subsidy-summary-alert">
                  {{ $t('cart.enterprise_subsidy_month', [cartItem.eventMonthLabel]) }}
                </v-alert>
              </div>
              <div
                v-if="
                  cartItem.totalDiscount > 0 && cartItem.totalMenuPrice > cartItem.totalDiscount + cartItem.totalPrice
                "
                class="mt-2"
              >
                <v-alert variant="tonal" color="warning" density="compact" class="mb-0 cart-subsidy-summary-alert">
                  {{ $t('cart.enterprise_subsidy_partial', [cartItem.eventMonthLabel]) }}
                </v-alert>
              </div>
              <div v-if="cartItem.totalDiscount === 0 && cartItem.totalMenuPrice > 0" class="mt-2">
                <v-alert variant="tonal" color="warning" density="compact" class="mb-0 cart-subsidy-summary-alert">
                  {{ $t('cart.enterprise_subsidy_exceeded', [cartItem.eventMonthLabel]) }}
                </v-alert>
              </div>
            </v-sheet>
          </v-col>
        </v-row>
        <v-card-text v-else class="text-right">
          <span class="text-right ma-2 text-h6">{{ $t('cart.total') }}</span>
          <span class="text-right my-2 ml-2 text-h6">¥</span>
          <span class="text-right ma-2 text-h3 text-md-h2 font-weight-bold">{{
            priceString(cartItem.totalPrice)
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
                needsStripeCheckoutForItem(cartItem) ? $t('cart.proceed_to_payment') : $t('cart.order_and_attend_event')
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
  <v-row justify="center" v-else-if="enrichedCart != null && !isOrderProcessing">
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

.cart-subsidy-amount {
  font-variant-numeric: tabular-nums;
}

.cart-enterprise-subsidy-summary {
  text-align: left;
}

/* Materio が .v-alert__content に font-size を直指定するため text-body-2 が効かない。本文相当に揃える */
.cart-community-bill-banner :deep(.v-alert__content),
.cart-subsidy-summary-alert :deep(.v-alert__content) {
  font-size: 0.875rem;
  line-height: 1.375rem;
}

@media (max-width: 959px) {
  .card-text-style {
    font-size: 12px !important;
    padding-bottom: 12px !important;
  }

  .cart-community-bill-banner :deep(.v-alert__content),
  .cart-subsidy-summary-alert :deep(.v-alert__content) {
    font-size: 0.75rem;
    line-height: 1.25rem;
  }
}
</style>
