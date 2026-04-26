<script setup lang="ts">
import { ref, computed } from 'vue'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { type EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import { computeOrderLineNet } from '@shokujii/common/utils/paymentCommunityBillOffAmount.js'
import EventStatusChip from '@shokujii/base/components/EventStatusChip.vue'
import { convertStoragePathToURL } from '../utils/storage'
import { getEventCoverStoragePath } from '@shokujii/common/utils/storagePaths.js'
import EventDiscountChip from '@shokujii/base/components/EventDiscountChip.vue'

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

const orderLineNet = (o: EventMemberOrder) =>
  computeOrderLineNet(o, props.event.event_payment, props.event.community_bill_settings)

const groupedMenus = computed(() => {
  const map = new Map<string, { menu_name: string; count: number }>()
  for (const o of props.orders.filter((o) => o.status !== 'canceled')) {
    const existing = map.get(o.menu_id)
    if (existing) {
      existing.count++
    } else {
      map.set(o.menu_id, { menu_name: o.menu_name, count: 1 })
    }
  }
  return Array.from(map.entries()).map(([menu_id, v]) => ({ menu_id, ...v }))
})

const totalPrice = computed(() =>
  props.orders.filter((o) => o.status !== 'canceled').reduce((sum, o) => sum + orderLineNet(o), 0),
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

const isShowInvoiceButton = computed(() => {
  if (props.ordersLoading || props.ordersError) return false
  if (!props.orders.some((o) => o.status === 'ordered')) return false
  return (
    props.event.event_payment === 'user_advance' ||
    props.orders.some((o) => o.status === 'ordered' && o.stripe_id != null)
  )
})

const showOrderSummary = computed(() => !props.ordersLoading && !props.ordersError && groupedMenus.value.length > 0)

const stripeGroups = computed(() => {
  const map = new Map<string, { stripeId: string; amount: number }>()
  for (const o of props.orders.filter((o) => o.status !== 'canceled' && o.stripe_id != null)) {
    if (!map.has(o.stripe_id!)) {
      map.set(o.stripe_id!, { stripeId: o.stripe_id!, amount: 0 })
    }
    map.get(o.stripe_id!)!.amount += orderLineNet(o)
  }
  return Array.from(map.values())
})

/** EventDetailsCard と同じ支払い方法ラベル（community_bill は全額おごり vs 金額おごりでキーを分岐） */
const eventPaymentLabelKey = computed(() =>
  props.event.event_payment === 'community_bill'
    ? props.event.community_bill_settings?.type === 'discount'
      ? 'payment.community_bill_discount'
      : 'payment.community_bill_free'
    : `payment.${props.event.event_payment}`,
)

// ── キャンセルモーダル ──

const getOrderTimestamp = (o: EventMemberOrder) => o.ordered_at ?? o.carted_at ?? o.created_at ?? 0

type CancelDialogOrderedRow = {
  orderId: string
  menu_name: string
  line_net: number
  checked: boolean
}

type CancelDialogCanceledRow = {
  orderId: string
  menu_name: string
}

const cancelOrderedRows = ref<CancelDialogOrderedRow[]>([])
const cancelCanceledRows = ref<CancelDialogCanceledRow[]>([])

const initCancelDialogRows = () => {
  const ordered = props.orders
    .filter((o) => o.status === 'ordered')
    .sort((a, b) => getOrderTimestamp(a) - getOrderTimestamp(b))
  cancelOrderedRows.value = ordered.map((o) => ({
    orderId: o.id,
    menu_name: o.menu_name,
    line_net: orderLineNet(o),
    checked: false,
  }))
  const canceled = props.orders
    .filter((o) => o.status === 'canceled')
    .sort((a, b) => getOrderTimestamp(a) - getOrderTimestamp(b))
  cancelCanceledRows.value = canceled.map((o) => ({
    orderId: o.id,
    menu_name: o.menu_name,
  }))
}

const onOpenDialog = () => {
  initCancelDialogRows()
  cancelDialogOpen.value = true
}

const selectAll = () => {
  for (const r of cancelOrderedRows.value) {
    r.checked = true
  }
}

const selectedOrderIds = computed(() => cancelOrderedRows.value.filter((r) => r.checked).map((r) => r.orderId))

const canSubmit = computed(
  () => selectedOrderIds.value.length > 0 && !props.cancelLoading && !props.ordersLoading && !props.ordersError,
)

const cancelRefundAmount = computed(() =>
  cancelOrderedRows.value.filter((r) => r.checked).reduce((sum, r) => sum + r.line_net, 0),
)

const submitCancel = () => {
  if (!canSubmit.value) return
  emit('cancel', selectedOrderIds.value)
}
</script>

<template>
  <v-card class="pa-0">
    <v-img
      cover
      class="ma-0 pa-0"
      aspect-ratio="1.91"
      :src="convertStoragePathToURL(getEventCoverStoragePath(event.community_id, event.event_id))"
    />
    <div class="d-flex align-center flex-wrap ga-2 mt-2 ml-3">
      <EventStatusChip :status="event.calculatedEventStatus" size="small" />
      <EventDiscountChip
        v-if="event.event_payment === 'community_bill' && event.community_bill_settings != null"
        :settings="event.community_bill_settings"
        size="small"
      />
      <v-chip v-if="!event.is_public" color="primary" size="small">
        {{ $t('private_event') }}
      </v-chip>
    </div>
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
      $t('user_event_card.event_payment', [$t(eventPaymentLabelKey)])
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
          <div v-for="menu in groupedMenus" :key="menu.menu_id">{{ menu.menu_name }} ×{{ menu.count }}</div>
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
            <div
              v-if="event.community_bill_settings?.type === 'discount'"
              v-html="$t('user_event_card.cancel_dialog.description_community_bill_discount')"
            />
            <div v-else v-html="$t('user_event_card.cancel_dialog.description_community_bill')" />
          </div>
        </div>

        <div class="text-h6 mb-4" style="line-height: 2rem">
          <div>{{ $t('user_event_card.cancel_dialog.event_name', [event.event_name]) }}</div>
          <div>
            {{
              $t('user_event_card.cancel_dialog.order_deadline', [
                $d(event.event_deadline_datetime, 'datetime_weekday_short'),
              ])
            }}
          </div>
        </div>

        <div class="cancel-dialog-table text-body-1 pa-5">
          <div class="cancel-dialog-table__head text-medium-emphasis">
            <span />
            <span>{{ $t('user_event_card.cancel_dialog.column_menu') }}</span>
            <span class="text-end">{{ $t('user_event_card.cancel_dialog.column_amount') }}</span>
          </div>
          <div v-for="row in cancelOrderedRows" :key="row.orderId" class="cancel-dialog-table__row">
            <v-checkbox
              v-model="row.checked"
              density="compact"
              hide-details
              class="cancel-dialog-table__check"
              :disabled="cancelLoading"
            />
            <span>{{ row.menu_name }}</span>
            <span class="text-end">{{ $n(row.line_net, 'currency') }}</span>
          </div>
          <div
            v-for="row in cancelCanceledRows"
            :key="row.orderId"
            class="cancel-dialog-table__row cancel-dialog-table__row--canceled text-disabled"
          >
            <span />
            <span>{{ row.menu_name }}</span>
            <span class="text-end">{{ $t('user_event_card.canceled') }}</span>
          </div>
        </div>

        <div v-if="selectedOrderIds.length > 0" class="font-weight-bold mt-4 text-end text-h5">
          {{ $t('user_event_card.cancel_dialog.refund_total', [$n(cancelRefundAmount, 'currency')]) }}
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="text" @click="selectAll" :disabled="cancelLoading || cancelOrderedRows.length === 0">
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

.cancel-dialog-table {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.cancel-dialog-table__head,
.cancel-dialog-table__row {
  display: grid;
  grid-template-columns: 2.75rem 1fr minmax(5.5rem, auto);
  column-gap: 0.5rem;
  align-items: center;
  min-height: 2.25rem;
}

.cancel-dialog-table__head {
  padding-bottom: 0.25rem;
  margin-bottom: 0.125rem;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.cancel-dialog-table__check {
  margin: -0.5rem 0;
  padding: 0;
  justify-self: start;
}

.cancel-dialog-table__row--canceled {
  font-size: 0.8125rem;
}
</style>
