<script setup lang="ts">
import { ref, computed } from 'vue'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { type EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import EventStatusChip from '@shokujii/base/components/EventStatusChip.vue'

const props = defineProps<{
  event: BokudeliEvent
  orders: EventMemberOrder[]
  isOwner: boolean
  cancelLoading?: boolean
  /** 注文サブコレクション取得中（注文ブロックのみローディング） */
  ordersLoading?: boolean
  /** 注文取得失敗時 true（注文ブロックにエラー＋再試行） */
  ordersError?: boolean
}>()

const emit = defineEmits<{
  downloadInvoice: [eventId: string, stripeId: string]
  cancel: [orderIds: string[]]
  retryOrders: [eventId: string]
}>()

/** キャンセルダイアログを開いているイベント ID（閉じているときは null）。親が v-model で保持し、成功後に閉じる。 */
const cancelDialogEventId = defineModel<string | null>('cancelDialogEventId', { default: null })

const cancelDialogOpen = computed({
  get: () => cancelDialogEventId.value === props.event.event_id,
  set: (open: boolean) => {
    if (open) {
      cancelDialogEventId.value = props.event.event_id
    } else if (cancelDialogEventId.value === props.event.event_id) {
      cancelDialogEventId.value = null
    }
  },
})

const groupedMenus = computed(() => {
  const map = new Map<string, { menu_name: string; menu_price: number; count: number }>()
  for (const o of props.orders.filter((o) => o.status !== 'canceled')) {
    const existing = map.get(o.menu_id)
    if (existing) {
      existing.count++
    } else {
      map.set(o.menu_id, { menu_name: o.menu_name, menu_price: o.menu_price, count: 1 })
    }
  }
  return Array.from(map.entries()).map(([menu_id, v]) => ({ menu_id, ...v }))
})

const totalPrice = computed(() =>
  props.orders.filter((o) => o.status !== 'canceled').reduce((sum, o) => sum + o.menu_price, 0),
)

const hasActiveOrders = computed(() => props.orders.some((o) => o.status !== 'canceled'))

const isShowCancelButton = computed(
  () =>
    !props.ordersLoading &&
    !props.ordersError &&
    hasActiveOrders.value &&
    props.event.event_deadline_datetime > Date.now(),
)

const isAllCanceled = computed(() => props.orders.length > 0 && props.orders.every((o) => o.status === 'canceled'))

const isShowInvoiceButton = computed(
  () =>
    !props.ordersLoading &&
    !props.ordersError &&
    props.orders.some((o) => o.status === 'ordered') &&
    props.event.event_payment === 'user_advance',
)

const showOrderSummary = computed(() => !props.ordersLoading && !props.ordersError && groupedMenus.value.length > 0)

const stripeGroups = computed(() => {
  const map = new Map<string, { stripeId: string; amount: number }>()
  for (const o of props.orders.filter((o) => o.status !== 'canceled' && o.stripe_id != null)) {
    if (!map.has(o.stripe_id!)) {
      map.set(o.stripe_id!, { stripeId: o.stripe_id!, amount: 0 })
    }
    map.get(o.stripe_id!)!.amount += o.menu_price
  }
  return Array.from(map.values())
})

// ── キャンセルモーダル ──

const getOrderTimestamp = (o: EventMemberOrder) => o.ordered_at ?? o.carted_at ?? o.created_at ?? 0

type CancelMenuGroup = {
  menu_id: string
  menu_name: string
  menu_price: number
  orderedIds: string[]
  canceledCount: number
  checked: boolean
  cancelCount: number
}

const cancelMenuGroups = computed<CancelMenuGroup[]>(() => {
  const map = new Map<
    string,
    { ordered: EventMemberOrder[]; canceledCount: number; menu_name: string; menu_price: number }
  >()
  for (const o of props.orders) {
    const existing = map.get(o.menu_id)
    if (existing) {
      if (o.status === 'ordered') existing.ordered.push(o)
      else if (o.status === 'canceled') existing.canceledCount++
    } else {
      map.set(o.menu_id, {
        menu_name: o.menu_name,
        menu_price: o.menu_price,
        ordered: o.status === 'ordered' ? [o] : [],
        canceledCount: o.status === 'canceled' ? 1 : 0,
      })
    }
  }

  return Array.from(map.entries()).map(([menu_id, g]) => {
    g.ordered.sort((a, b) => getOrderTimestamp(a) - getOrderTimestamp(b))
    return {
      menu_id,
      menu_name: g.menu_name,
      menu_price: g.menu_price,
      orderedIds: g.ordered.map((o) => o.id),
      canceledCount: g.canceledCount,
      checked: false,
      cancelCount: 0,
    }
  })
})

const cancelSelections = ref<CancelMenuGroup[]>([])

const initCancelSelections = () => {
  cancelSelections.value = cancelMenuGroups.value.map((g) => ({
    ...g,
    checked: false,
    cancelCount: 0,
  }))
}

const onOpenDialog = () => {
  initCancelSelections()
  cancelDialogOpen.value = true
}

const onCheckChanged = (group: CancelMenuGroup) => {
  if (group.checked && group.cancelCount === 0) {
    group.cancelCount = group.orderedIds.length
  } else if (!group.checked) {
    group.cancelCount = 0
  }
}

const selectAll = () => {
  for (const g of cancelSelections.value) {
    if (g.orderedIds.length > 0) {
      g.checked = true
      g.cancelCount = g.orderedIds.length
    }
  }
}

const selectedOrderIds = computed(() => {
  const ids: string[] = []
  for (const g of cancelSelections.value) {
    if (g.checked && g.cancelCount > 0) {
      ids.push(...g.orderedIds.slice(-g.cancelCount))
    }
  }
  return ids
})

const canSubmit = computed(
  () => selectedOrderIds.value.length > 0 && !props.cancelLoading && !props.ordersLoading && !props.ordersError,
)

const cancelRefundAmount = computed(() => {
  let total = 0
  for (const g of cancelSelections.value) {
    if (g.checked && g.cancelCount > 0) {
      total += g.menu_price * g.cancelCount
    }
  }
  return total
})

const submitCancel = () => {
  if (!canSubmit.value) return
  emit('cancel', selectedOrderIds.value)
}
</script>

<template>
  <v-card class="pa-0">
    <v-img cover class="ma-0 pa-0" aspect-ratio="1.91" :src="event.event_cover_url"></v-img>
    <EventStatusChip :status="event.calculatedEventStatus" size="small" class="mt-2 ml-3" />
    <v-chip v-if="!event.is_public" class="mt-2 ml-3" color="primary" size="small">
      {{ $t('private_event') }}
    </v-chip>
    <v-card-title class="justify-center pb-1 title text-h5">
      {{ event.event_name }}
    </v-card-title>
    <v-card-text class="py-1 px-2 event-card">
      {{ $t('user_event_card.community_name', [event.community_name]) }}
    </v-card-text>
    <v-card-text class="py-1 px-2 event-card">
      {{ $t('user_event_card.event_start_datetime', [$d(event.event_start_datetime, 'datetime_weekday_short')]) }}
    </v-card-text>
    <v-card-text class="py-1 px-2 event-card">{{
      $t('user_event_card.event_address', [event.fullAddress])
    }}</v-card-text>
    <v-card-text class="py-1 px-2 event-card">{{ $t('user_event_card.shop_name', [event.shop_name]) }}</v-card-text>
    <v-card-text class="py-1 px-2 event-card">{{
      $t('user_event_card.event_payment', [$t(`payment.${event.event_payment}`)])
    }}</v-card-text>
    <v-card-text v-if="ordersLoading" class="py-3 px-2 d-flex justify-center align-center">
      <v-progress-circular indeterminate color="primary" size="28" width="2" />
    </v-card-text>
    <v-card-text v-else-if="ordersError" class="py-2 px-2 event-card">
      <p class="text-body-2 text-error mb-2">{{ $t('user_event_card.orders_load_error') }}</p>
      <v-btn
        variant="tonal"
        color="primary"
        size="small"
        rounded="pill"
        @click.stop.prevent="emit('retryOrders', event.event_id)"
      >
        {{ $t('user_event_card.orders_retry') }}
      </v-btn>
    </v-card-text>
    <template v-else>
      <v-card-text v-if="showOrderSummary" class="py-1 px-2 event-card">
        {{ $t('user_event_card.menu') }}
        <div class="ml-3">
          <div v-for="menu in groupedMenus" :key="menu.menu_id">
            {{ menu.menu_name }} ×{{ menu.count }}（{{ $n(menu.menu_price * menu.count, 'currency') }}）
          </div>
        </div>
      </v-card-text>
      <v-card-text v-if="showOrderSummary" class="px-2 pt-1 pb-4 event-card">
        {{ $t('user_event_card.total_price', [$n(totalPrice, 'currency')]) }}
      </v-card-text>
    </template>
    <v-card-text>
      <v-row v-if="isOwner" justify="end">
        <v-spacer></v-spacer>
        <v-col v-if="isShowCancelButton" class="d-flex justify-end pa-1">
          <v-btn variant="outlined" rounded="pill" color="secondary" size="small" @click.prevent="onOpenDialog">
            {{ $t('user_event_card.cancel_order') }}
          </v-btn>
        </v-col>
        <v-col v-else-if="isAllCanceled" class="d-flex justify-end">{{ $t('user_event_card.canceled') }} </v-col>
      </v-row>
      <v-row v-if="isOwner && isShowInvoiceButton">
        <v-col class="d-flex justify-end pa-1 flex-wrap ga-1">
          <v-btn
            v-for="sg in stripeGroups"
            :key="sg.stripeId"
            variant="outlined"
            rounded="pill"
            color="secondary"
            size="small"
            @click.prevent="$emit('downloadInvoice', event.event_id, sg.stripeId)"
          >
            {{
              stripeGroups.length === 1
                ? $t('user_event_card.download_invoice')
                : `${$t('user_event_card.download_invoice')}（${$n(sg.amount, 'currency')}）`
            }}
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>

  <v-dialog v-model="cancelDialogOpen" :persistent="cancelLoading" max-width="600px">
    <v-card class="pa-5">
      <v-card-title class="py-6 px-6 text-wrap text-h4">
        {{ $t('user_event_card.cancel_dialog.title') }}
      </v-card-title>
      <v-card-text class="mb-4">
        <div class="text-body-2 mb-4" style="line-height: 1.5rem">
          <div v-if="event.event_payment === 'user_advance'">
            <div v-html="$t('user_event_card.cancel_dialog.description_user_advance')" />
          </div>
          <div v-else-if="event.event_payment === 'community_bill'">
            <div v-html="$t('user_event_card.cancel_dialog.description_community_bill')" />
          </div>
        </div>

        <div v-for="group in cancelSelections" :key="group.menu_id" class="mb-3">
          <div v-if="group.orderedIds.length > 0" class="d-flex align-center ga-3">
            <v-checkbox
              v-model="group.checked"
              :label="`${group.menu_name}（${$n(group.menu_price, 'currency')}）`"
              density="compact"
              hide-details
              :disabled="cancelLoading"
              @update:model-value="onCheckChanged(group)"
            />
            <v-select
              v-if="group.checked"
              v-model="group.cancelCount"
              :items="Array.from({ length: group.orderedIds.length }, (_, i) => i + 1)"
              density="compact"
              hide-details
              :disabled="cancelLoading"
              style="max-width: 100px"
            />
            <span class="text-body-2 text-medium-emphasis">
              {{ $t('user_event_card.cancel_dialog.remaining', [group.orderedIds.length]) }}
            </span>
          </div>
          <div v-if="group.canceledCount > 0" class="text-body-2 text-disabled ml-8">
            {{ group.menu_name }} ×{{ group.canceledCount }} {{ $t('user_event_card.canceled') }}
          </div>
        </div>

        <div v-if="selectedOrderIds.length > 0" class="font-weight-bold mt-4">
          {{ $t('user_event_card.cancel_dialog.refund_amount', [$n(cancelRefundAmount, 'currency')]) }}
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="text" @click="selectAll" :disabled="cancelLoading">
          {{ $t('user_event_card.cancel_dialog.select_all') }}
        </v-btn>
        <v-spacer />
        <v-btn @click="cancelDialogOpen = false" :disabled="cancelLoading">
          {{ $t('user_event_card.cancel_dialog.not_cancel') }}
        </v-btn>
        <v-btn variant="tonal" color="error" :disabled="!canSubmit" :loading="cancelLoading" @click="submitCancel">
          {{ $t('user_event_card.cancel_dialog.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<style lang="scss" scoped>
.event-card {
  font-size: 13px;
}
</style>
