<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { type EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import { computeOrderLineNet } from '@shokujii/common/utils/paymentCommunityBillOffAmount.js'
import { convertToDate, convertToDatetimeWeekdayShort } from '@shokujii/common/utils/datetime.js'
import EventStatusChip from '@shokujii/base/components/EventStatusChip.vue'
import EventDiscountChip from '@shokujii/base/components/EventDiscountChip.vue'
import { convertStoragePathToURL } from '../utils/storage'
import { getEventCoverStoragePath } from '@shokujii/common/utils/storagePaths.js'

const props = defineProps<{
  event: BokudeliEvent
  orders: EventMemberOrder[]
  isOwner: boolean
  /** マイページ文脈では URL 限定公開チップを出さない（§4.2.0） */
  hidePrivateScopeChip?: boolean
  cancelLoading?: boolean
  /** 注文サブコレクション取得中（注文ブロックのみローディング） */
  ordersLoading?: boolean
  /** 注文取得失敗時 true（注文ブロックにエラー＋再試行） */
  ordersError?: boolean
  /** 指定時はカバー・タイトルをイベント詳細へリンク（操作ボタンはリンク外） */
  eventDetailPath?: RouteLocationRaw
}>()

const { t } = useI18n()

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

/** 参加者の実支払額（福利厚生・主催者負担割引は common の computeOrderLineNet） */
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

const formatOrderMenuLine = (menu: { menu_name: string; count: number }): string =>
  menu.count === 1 ? menu.menu_name : t('user_event_card.menu_item', [menu.menu_name, menu.count])

const totalPrice = computed(() =>
  props.orders.filter((o) => o.status !== 'canceled').reduce((sum, o) => sum + orderLineNet(o), 0),
)

const isShowCancelButton = computed(
  () =>
    !props.ordersLoading &&
    !props.ordersError &&
    props.orders.some((o) => o.status === 'ordered') &&
    props.event.event_deadline_datetime > Date.now(),
)

const isAllCanceled = computed(() => props.orders.length > 0 && props.orders.every((o) => o.status === 'canceled'))

const isShowProcessing = computed(() => props.orders.some((o) => o.status === 'processing'))

const isShowInvoiceButton = computed(() => {
  if (props.ordersLoading || props.ordersError) return false
  if (!props.orders.some((o) => o.status === 'ordered')) return false
  return (
    props.event.event_payment === 'user_advance' ||
    props.orders.some((o) => o.status === 'ordered' && o.stripe_id != null)
  )
})

const showOrderSummary = computed(() => !props.ordersLoading && !props.ordersError && groupedMenus.value.length > 0)

/** キャンセルモーダル・領収書日付で共通（ordered_at を優先し、欠損時は carted_at / created_at） */
const getOrderTimestamp = (o: EventMemberOrder) => o.ordered_at ?? o.carted_at ?? o.created_at ?? 0

/** Stripe グループの並び用。グループ内の注文について getOrderTimestamp の最小値が若い順。時刻不明は末尾へ */
const earliestTimestampForStripe = (stripeId: string): number => {
  const tsList = props.orders
    .filter((o) => o.status !== 'canceled' && o.stripe_id === stripeId)
    .map(getOrderTimestamp)
    .filter((ts) => ts > 0)
  return tsList.length === 0 ? Number.MAX_SAFE_INTEGER : Math.min(...tsList)
}

const stripeGroups = computed(() => {
  const stripeIds: string[] = []
  const seen = new Set<string>()
  for (const o of props.orders.filter((o) => o.status !== 'canceled' && o.stripe_id != null)) {
    const sid = o.stripe_id!
    if (!seen.has(sid)) {
      seen.add(sid)
      stripeIds.push(sid)
    }
  }
  stripeIds.sort((a, b) => {
    const ta = earliestTimestampForStripe(a)
    const tb = earliestTimestampForStripe(b)
    if (ta !== tb) return ta - tb
    return a < b ? -1 : a > b ? 1 : 0
  })
  return stripeIds.map((stripeId) => ({ stripeId }))
})

const stripeReceiptDateLabel = (stripeId: string): string | null => {
  const earliest = earliestTimestampForStripe(stripeId)
  if (earliest === Number.MAX_SAFE_INTEGER) return null
  return convertToDate(earliest)
}

/** キャンセルモーダル「注文日」。領収書ボタン付記と同じ convertToDate（yyyy/M/d、曜日・時刻なし） */
const cancelDialogOrderDateLabel = (millis: number | null): string => (millis != null ? convertToDate(millis) : '')

const receiptButtonLabel = (stripeId: string): string => {
  const base = t('user_event_card.download_invoice')
  if (stripeGroups.value.length === 1) return base
  const d = stripeReceiptDateLabel(stripeId)
  return d != null ? `${base} ${d}` : base
}

/** EventDetailsCard と同じ支払い方法ラベル（community_bill は全額おごり vs 金額おごりでキーを分岐） */
const eventPaymentLabelKey = computed(() =>
  props.event.event_payment === 'community_bill'
    ? props.event.community_bill_settings?.type === 'discount'
      ? 'payment.community_bill_discount'
      : 'payment.community_bill_free'
    : `payment.${props.event.event_payment}`,
)

// ── キャンセルモーダル ──

type CancelDialogOrderedRow = {
  orderId: string
  menu_name: string
  orderDateMillis: number | null
  /** メニュー価格（税込想定の単価） */
  menu_price: number
  /** 参加者支払額（自己負担額 = menu_price - 割引・補助相当） */
  line_net: number
  checked: boolean
}

type CancelDialogCanceledRow = {
  orderId: string
  menu_name: string
  orderDateMillis: number | null
  menu_price: number
}

const cancelOrderedRows = ref<CancelDialogOrderedRow[]>([])
const cancelCanceledRows = ref<CancelDialogCanceledRow[]>([])

const initCancelDialogRows = () => {
  const ordered = props.orders
    .filter((o) => o.status === 'ordered')
    .sort((a, b) => getOrderTimestamp(a) - getOrderTimestamp(b))
  cancelOrderedRows.value = ordered.map((o) => {
    const ts = getOrderTimestamp(o)
    return {
      orderId: o.id,
      menu_name: o.menu_name,
      orderDateMillis: ts > 0 ? ts : null,
      menu_price: o.menu_price,
      line_net: orderLineNet(o),
      checked: false,
    }
  })
  const canceled = props.orders
    .filter((o) => o.status === 'canceled')
    .sort((a, b) => getOrderTimestamp(a) - getOrderTimestamp(b))
  cancelCanceledRows.value = canceled.map((o) => {
    const ts = getOrderTimestamp(o)
    return {
      orderId: o.id,
      menu_name: o.menu_name,
      orderDateMillis: ts > 0 ? ts : null,
      menu_price: o.menu_price,
    }
  })
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

const isEnterpriseSubsidyEvent = computed(() => props.event.event_payment === 'enterprise_subsidy')

const totalPriceLabelKey = computed(() =>
  isEnterpriseSubsidyEvent.value ? 'user_event_card.total_self_pay' : 'user_event_card.total_price',
)

/** 主催者請求書払い・福利厚生ではメニュー金額と参加者支払額を分けて表示 */
const showCancelPaymentColumn = computed(
  () => props.event.event_payment === 'community_bill' || isEnterpriseSubsidyEvent.value,
)

const cancelDialogAmountColumnKey = computed(() =>
  isEnterpriseSubsidyEvent.value
    ? 'user_event_card.cancel_dialog.column_self_pay'
    : 'user_event_card.cancel_dialog.column_amount',
)

const submitCancel = () => {
  if (!canSubmit.value) return
  emit('cancel', selectedOrderIds.value)
}
</script>

<template>
  <v-card class="pa-0">
    <router-link
      v-if="eventDetailPath != null"
      class="user-event-card-detail-link d-block text-reset text-decoration-none"
      :to="eventDetailPath"
    >
      <v-img
        cover
        class="ma-0 pa-0"
        aspect-ratio="1.91"
        :src="convertStoragePathToURL(getEventCoverStoragePath(event.community_id, event.event_id))"
        :alt="event.event_name"
      />
    </router-link>
    <v-img
      v-else
      cover
      class="ma-0 pa-0"
      aspect-ratio="1.91"
      :src="convertStoragePathToURL(getEventCoverStoragePath(event.community_id, event.event_id))"
      :alt="event.event_name"
    />
    <div class="d-flex align-center flex-wrap ga-2 mt-2 ml-3">
      <EventStatusChip :status="event.calculatedEventStatus" size="small" />
      <v-chip v-if="!event.is_public && !hidePrivateScopeChip" color="primary" size="small">
        {{ $t('private_event') }}
      </v-chip>
    </div>
    <v-card-title class="justify-center pb-1 title text-h5">
      <router-link
        v-if="eventDetailPath != null"
        class="user-event-card-detail-link text-reset text-decoration-none"
        :to="eventDetailPath"
      >
        {{ event.event_name }}
      </router-link>
      <template v-else>{{ event.event_name }}</template>
    </v-card-title>
    <v-card-text class="py-1 px-2 event-card">
      {{ $t('user_event_card.community_name', [event.community_name]) }}
    </v-card-text>
    <v-card-text class="py-1 px-2 event-card">
      {{ $t('user_event_card.event_start_datetime', [convertToDatetimeWeekdayShort(event.event_start_datetime)]) }}
    </v-card-text>
    <v-card-text class="py-1 px-2 event-card">{{
      $t('user_event_card.event_address', [event.fullAddress])
    }}</v-card-text>
    <v-card-text class="py-1 px-2 event-card">{{ $t('user_event_card.shop_name', [event.shop_name]) }}</v-card-text>
    <v-card-text class="py-1 px-2 event-card">{{
      $t('user_event_card.event_payment', [$t(eventPaymentLabelKey)])
    }}</v-card-text>
    <v-card-text v-if="ordersLoading" class="py-2 px-2">
      <v-progress-linear indeterminate color="primary" rounded height="4" />
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
      <v-card-text v-if="showOrderSummary" class="py-1 px-2 event-card" :class="{ 'pb-4': !isOwner }">
        {{ $t('user_event_card.menu') }}
        <div class="ml-3">
          <div v-for="menu in groupedMenus" :key="menu.menu_id">{{ formatOrderMenuLine(menu) }}</div>
        </div>
      </v-card-text>
      <v-card-text v-if="showOrderSummary && isOwner" class="px-2 pt-1 pb-4 event-card">
        {{ $t(totalPriceLabelKey, [$n(totalPrice, 'currency')]) }}
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
        <v-col v-else-if="isShowProcessing" class="d-flex justify-end">
          {{ $t('user_event_card.processing') }}
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
            {{ receiptButtonLabel(sg.stripeId) }}
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>

  <v-dialog v-model="cancelDialogOpen" :persistent="cancelLoading" max-width="750px" scrollable>
    <v-card class="pa-3 pa-sm-5">
      <v-card-title class="py-4 py-sm-6 px-0 px-sm-2 text-wrap text-h5 text-sm-h4">
        {{ $t('user_event_card.cancel_dialog.title') }}
      </v-card-title>
      <v-card-text class="mb-2 mb-sm-4 px-0 px-sm-2">
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
          <div v-else-if="event.event_payment === 'enterprise_subsidy'">
            <div v-html="$t('user_event_card.cancel_dialog.description_enterprise_subsidy')" />
          </div>
        </div>

        <div class="text-h6 mb-4" style="line-height: 2rem">
          <div>{{ $t('user_event_card.cancel_dialog.event_name', [event.event_name]) }}</div>
          <div>
            {{
              $t('user_event_card.cancel_dialog.order_deadline', [
                convertToDatetimeWeekdayShort(event.event_deadline_datetime),
              ])
            }}
          </div>
          <div class="d-flex align-center flex-wrap ga-2">
            <span>{{ $t('user_event_card.event_payment', [$t(eventPaymentLabelKey)]) }}</span>
            <EventDiscountChip
              v-if="event.event_payment === 'community_bill' && event.community_bill_settings != null"
              :settings="event.community_bill_settings"
              size="small"
            />
          </div>
        </div>

        <div
          class="cancel-dialog-table text-body-1 pa-3 pa-sm-5"
          :class="{ 'cancel-dialog-table--show-payment': showCancelPaymentColumn }"
        >
          <div class="cancel-dialog-table__head text-medium-emphasis">
            <span />
            <span>{{ $t('user_event_card.cancel_dialog.column_menu') }}</span>
            <span class="cancel-dialog-table__col-date">{{
              $t('user_event_card.cancel_dialog.column_order_date')
            }}</span>
            <span class="text-end">{{ $t('user_event_card.cancel_dialog.column_menu_price') }}</span>
            <span v-if="showCancelPaymentColumn" class="text-end">{{ $t(cancelDialogAmountColumnKey) }}</span>
          </div>
          <div v-for="row in cancelOrderedRows" :key="row.orderId" class="cancel-dialog-table__row">
            <v-checkbox
              v-model="row.checked"
              density="compact"
              hide-details
              class="cancel-dialog-table__check"
              :disabled="cancelLoading"
            />
            <span class="cancel-dialog-table__menu">{{ row.menu_name }}</span>
            <div class="cancel-dialog-table__details">
              <span class="cancel-dialog-table__col-date">
                <span class="cancel-dialog-table__mobile-label d-sm-none">{{
                  $t('user_event_card.cancel_dialog.column_order_date')
                }}</span>
                {{ cancelDialogOrderDateLabel(row.orderDateMillis) }}
              </span>
              <span class="cancel-dialog-table__col-price text-end text-sm-end">
                <span class="cancel-dialog-table__mobile-label d-sm-none">{{
                  $t('user_event_card.cancel_dialog.column_menu_price')
                }}</span>
                {{ $n(row.menu_price, 'currency') }}
              </span>
              <span v-if="showCancelPaymentColumn" class="cancel-dialog-table__col-pay text-end text-sm-end">
                <span class="cancel-dialog-table__mobile-label d-sm-none">{{ $t(cancelDialogAmountColumnKey) }}</span>
                {{ $n(row.line_net, 'currency') }}
              </span>
            </div>
          </div>
          <div
            v-for="row in cancelCanceledRows"
            :key="row.orderId"
            class="cancel-dialog-table__row cancel-dialog-table__row--canceled text-disabled"
          >
            <span class="cancel-dialog-table__check-spacer" aria-hidden="true" />
            <span class="cancel-dialog-table__menu">{{ row.menu_name }}</span>
            <div class="cancel-dialog-table__details">
              <span class="cancel-dialog-table__col-date">
                <span class="cancel-dialog-table__mobile-label d-sm-none">{{
                  $t('user_event_card.cancel_dialog.column_order_date')
                }}</span>
                {{ cancelDialogOrderDateLabel(row.orderDateMillis) }}
              </span>
              <template v-if="showCancelPaymentColumn">
                <span class="cancel-dialog-table__col-price text-end text-sm-end">
                  <span class="cancel-dialog-table__mobile-label d-sm-none">{{
                    $t('user_event_card.cancel_dialog.column_menu_price')
                  }}</span>
                  {{ $n(row.menu_price, 'currency') }}
                </span>
                <span class="cancel-dialog-table__col-pay text-end text-sm-end">
                  {{ $t('user_event_card.canceled') }}
                </span>
              </template>
              <span v-else class="cancel-dialog-table__col-pay text-end text-sm-end">
                {{ $t('user_event_card.canceled') }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="selectedOrderIds.length > 0" class="font-weight-bold mt-4 text-end text-h5">
          {{ $t('user_event_card.cancel_dialog.refund_total', [$n(cancelRefundAmount, 'currency')]) }}
        </div>
      </v-card-text>
      <v-card-actions class="flex-wrap px-0 px-sm-2">
        <v-btn
          variant="text"
          class="mb-1 mb-sm-0"
          @click="selectAll"
          :disabled="cancelLoading || cancelOrderedRows.length === 0"
        >
          {{ $t('user_event_card.cancel_dialog.select_all') }}
        </v-btn>
        <v-spacer class="d-none d-sm-flex" />
        <div class="d-flex flex-wrap ga-2 ms-sm-auto w-100 w-sm-auto justify-end">
          <v-btn @click="cancelDialogOpen = false" :disabled="cancelLoading">
            {{ $t('user_event_card.cancel_dialog.not_cancel') }}
          </v-btn>
          <v-btn variant="tonal" color="error" :disabled="!canSubmit" :loading="cancelLoading" @click="submitCancel">
            {{ $t('user_event_card.cancel_dialog.submit') }}
          </v-btn>
        </div>
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
  grid-template-columns: 2.75rem minmax(0, 1fr) minmax(7rem, auto) minmax(5.5rem, auto);
  column-gap: 0.5rem;
  align-items: center;
  min-height: 2.25rem;
}

.cancel-dialog-table--show-payment .cancel-dialog-table__head,
.cancel-dialog-table--show-payment .cancel-dialog-table__row {
  grid-template-columns: 2.75rem minmax(0, 1fr) minmax(7rem, auto) minmax(5.5rem, auto) minmax(5.5rem, auto);
}

.cancel-dialog-table__details {
  display: contents;
}

.cancel-dialog-table__menu {
  min-width: 0;
  word-break: break-word;
}

.cancel-dialog-table__head {
  padding-bottom: 0.25rem;
  margin-bottom: 0.125rem;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.cancel-dialog-table__check,
.cancel-dialog-table__check-spacer {
  margin: -0.5rem 0;
  padding: 0;
  justify-self: start;
}

.cancel-dialog-table__check-spacer {
  display: block;
  width: 2.75rem;
  margin: 0;
}

.cancel-dialog-table__row--canceled {
  font-size: 0.8125rem;
}

.cancel-dialog-table__mobile-label {
  display: block;
  font-size: 0.75rem;
  line-height: 1.25;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-bottom: 0.125rem;
}

@media (max-width: 599.98px) {
  .cancel-dialog-table__head {
    display: none;
  }

  .cancel-dialog-table__row,
  .cancel-dialog-table--show-payment .cancel-dialog-table__row {
    grid-template-columns: 2.5rem minmax(0, 1fr);
    grid-template-areas:
      'check menu'
      'details details';
    column-gap: 0.5rem;
    row-gap: 0.375rem;
    align-items: start;
    min-height: unset;
    padding: 0.75rem 0;
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .cancel-dialog-table__row:last-child {
    border-bottom: none;
  }

  .cancel-dialog-table__check,
  .cancel-dialog-table__check-spacer {
    grid-area: check;
    align-self: start;
    margin: 0;
  }

  .cancel-dialog-table__menu {
    grid-area: menu;
    font-weight: 500;
    line-height: 1.4;
  }

  .cancel-dialog-table__details {
    display: flex;
    grid-area: details;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    padding-left: 2.5rem;
  }

  .cancel-dialog-table__col-date,
  .cancel-dialog-table__col-price,
  .cancel-dialog-table__col-pay {
    flex: 1 1 auto;
    min-width: 4.5rem;
    text-align: start !important;
    font-size: 0.875rem;
    line-height: 1.35;
  }
}

.user-event-card-detail-link:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
  border-radius: 4px;
}
</style>
