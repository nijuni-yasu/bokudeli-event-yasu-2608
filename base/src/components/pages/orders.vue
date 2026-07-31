<script setup lang="ts">
import { ref, computed, watch, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import UserEventCard from '@shokujii/base/components/UserEventCard.vue'
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'
import UserSuccessJoinEventDialog from '@shokujii/base/components/UserSuccessJoinEventDialog.vue'
import {
  useUserOrderHistoryByUserId,
  type UserOrderHistoryListStore,
} from '@shokujii/base/stores/userOrderHistoryList.js'
import { useUserEventListByUserId } from '@shokujii/base/stores/userEventList.js'
import type { ProfileListFilter } from '@shokujii/base/stores/profileListFilter.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { cancelOrders as callCancelOrders } from '@shokujii/base/apis/stripe.js'
import { useNotification } from '@shokujii/base/composable/notification.js'
import type {
  NavigateToEventChatFn,
  ResolveEventPathFn,
  ResolveReceiptPathFn,
} from '@shokujii/base/types/profilePathResolvers.js'

const PAGE_SIZE = 6

const props = withDefaults(
  defineProps<{
    profileFilter: ProfileListFilter
    resolveEventPath: ResolveEventPathFn
    resolveReceiptPath: ResolveReceiptPathFn
    hideShareSns?: boolean
    navigateToEventChat?: NavigateToEventChatFn
  }>(),
  {
    hideShareSns: false,
  },
)

const route = useRoute()
const notification = useNotification()
const { t: $t } = useI18n()

const { user: loginUser, firebaseUser } = storeToRefs(useCurrentUserStore())
const userId = computed(() => loginUser.value?.user_id ?? firebaseUser.value?.uid ?? '')

const userOrderHistoryStore = shallowRef<UserOrderHistoryListStore | null>(null)

const bindOrderHistoryStore = (uid: string) => {
  if (uid === '') {
    userOrderHistoryStore.value = null
    return
  }
  userOrderHistoryStore.value = useUserOrderHistoryByUserId(uid, PAGE_SIZE, {
    profileFilter: props.profileFilter,
  })
  userOrderHistoryStore.value.reload()
}

watch(
  () => [userId.value, props.profileFilter] as const,
  ([uid]) => {
    bindOrderHistoryStore(uid)
  },
  { immediate: true, deep: true },
)

const orderHistoryEvents = computed(() => userOrderHistoryStore.value?.events ?? [])
const orderHistoryStateByEventId = computed(() => userOrderHistoryStore.value?.orderStateByEventId ?? {})
const orderHistoryHasMore = computed(() => userOrderHistoryStore.value?.hasMore ?? false)
const isOrderHistoryLoaded = computed(() => userOrderHistoryStore.value?.initialLoaded ?? false)

const cancelLoadingEventId = ref<string | null>(null)
const cancelDialogEventId = ref<string | null>(null)

// 注文履歴は本人のみ閲覧（isOwner 常に true）。is_linkable 未指定時はリンク可
const canLinkToDetail = (isLinkable?: boolean): boolean => isLinkable ?? true

const showOrdersEmpty = computed(
  () => isOrderHistoryLoaded.value && orderHistoryEvents.value.length === 0 && !orderHistoryHasMore.value,
)

watch(
  [orderHistoryEvents, orderHistoryHasMore, isOrderHistoryLoaded],
  () => {
    const store = userOrderHistoryStore.value
    if (store == null) return
    if (orderHistoryEvents.value.length === 0 && orderHistoryHasMore.value && isOrderHistoryLoaded.value) {
      store.next()
    }
  },
  { immediate: true },
)

const cancel = async (orderIds: string[], communityId: string, eventId: string) => {
  const store = userOrderHistoryStore.value
  if (orderIds.length === 0 || store == null) return

  cancelLoadingEventId.value = eventId
  try {
    const { data } = await callCancelOrders({
      community_id: communityId,
      event_id: eventId,
      order_ids: orderIds,
    })
    await store.reloadOrdersForEvent(eventId)

    cancelDialogEventId.value = null

    const hasRefundIssues = data.refund_errors != null && data.refund_errors.length > 0
    if (hasRefundIssues || data.user_message) {
      notification.show(data.user_message ?? $t('user.canceled'), 'warning')
    } else {
      notification.show($t('user.canceled'), 'success')
    }
  } catch (error) {
    console.error(error)
    notification.show($t('user.cancel_failed'), 'error')
  } finally {
    cancelLoadingEventId.value = null
  }
}

const downloadReceipt = (eventId: string, stripeId: string) => {
  window.open(props.resolveReceiptPath(eventId, stripeId), '_blank', 'noopener,noreferrer')
}

const isUserSuccessJoinEventDialogVisible = ref(false)
if (route.query.eventId != null && route.query.communityAccount != null) {
  isUserSuccessJoinEventDialogVisible.value = true
}

watch(
  () => [route.query.eventId, route.query.communityAccount, userId.value] as const,
  ([eventId, communityAccount, uid]) => {
    const store = userOrderHistoryStore.value
    if (uid === '' || store == null) return
    if (eventId != null && communityAccount != null) {
      store.reload()
      useUserEventListByUserId(uid, PAGE_SIZE, { profileFilter: props.profileFilter, autoLoad: false }).reload()
    }
  },
  { immediate: true },
)
</script>

<template>
  <v-row justify="center">
    <v-col cols="12" md="10" lg="9" class="pa-4 pa-md-6">
      <div class="text-center text-h4 text-md-h3 mt-4 mb-2">{{ $t('user_profile.tab_orders') }}</div>
      <p class="text-center text-body-2 text-medium-emphasis mb-4 px-4 pre-line">
        {{ $t('user_profile.orders_page_lead') }}
      </p>
      <slot name="prepend" />
      <div v-if="showOrdersEmpty" class="text-body-1 text-medium-emphasis pa-4">
        {{ $t('user_profile.empty.orders') }}
      </div>
      <v-row v-else>
        <v-col v-for="event in orderHistoryEvents" :key="`order_${event.event_id}`" sm="12" md="6" lg="4" cols="12">
          <div class="event-card">
            <UserEventCard
              v-model:cancel-dialog-event-id="cancelDialogEventId"
              :orders="orderHistoryStateByEventId[event.event_id]?.orders ?? []"
              :orders-loading="orderHistoryStateByEventId[event.event_id]?.loading ?? false"
              :orders-error="orderHistoryStateByEventId[event.event_id]?.error != null"
              :event="event"
              :is-owner="true"
              :hide-private-scope-chip="true"
              :cancel-loading="cancelLoadingEventId === event.event_id"
              :event-detail-path="
                canLinkToDetail(event.is_linkable)
                  ? props.resolveEventPath(event.community_account, event.event_id)
                  : undefined
              "
              @download-invoice="downloadReceipt"
              @cancel="(orderIds: string[]) => cancel(orderIds, event.community_id, event.event_id)"
              @retry-orders="(eid: string) => userOrderHistoryStore?.reloadOrdersForEvent(eid)"
            />

            <div
              v-if="cancelLoadingEventId === event.event_id"
              class="progress-container d-flex justify-center align-center"
            >
              <v-progress-circular :indeterminate="true" size="large" />
            </div>
          </div>
        </v-col>
      </v-row>
      <v-row v-if="!showOrdersEmpty" class="justify-center">
        <v-col cols="auto">
          <IncrementalLoader
            :loaded-count="orderHistoryEvents.length"
            :total-count="orderHistoryHasMore ? Number.MAX_SAFE_INTEGER : orderHistoryEvents.length"
            @load="userOrderHistoryStore?.next()"
          />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
  <UserSuccessJoinEventDialog
    v-if="userId !== '' && route.query.eventId != null && route.query.communityAccount != null"
    v-model="isUserSuccessJoinEventDialogVisible"
    :event-id="String(route.query.eventId ?? '')"
    :community-account="String(route.query.communityAccount ?? '')"
    :is-posted="route.query.isPosted === 'true'"
    :session-id="String(route.query.session_id ?? '')"
    :user-id="userId"
    :navigate-to-event-chat="navigateToEventChat"
    :hide-share-sns="hideShareSns"
  />
</template>

<style scoped lang="scss">
.event-card {
  position: relative;

  .progress-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #00000022;
  }
}
</style>
