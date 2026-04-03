<script setup lang="ts">
import { db } from '@shokujii/base/firebase.js'
import { doc, getDocs, orderBy, query, where, limit, collection } from 'firebase/firestore'
import { useRoute } from 'vue-router'
import UserBioPanel from '@shokujii/base/components/UserBioPanel.vue'
import UserEventCard from '@shokujii/base/components/UserEventCard.vue'
import CommunityCard from '@shokujii/base/components/CommunityCard.vue'
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'
import { useCommunityListStore } from '@shokujii/base/stores/communityList.js'
import { useOrderListByUserId } from '@shokujii/base/stores/orderList.js'
import { useUserStore } from '@shokujii/base/stores/user.js'
import { mdiCalendarHeart, mdiAccountGroup, mdiHeartOutline } from '@mdi/js'
import { useEventStore, type EventStore } from '@shokujii/base/stores/event.js'
import { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { getCommunityPath, getEventPath, getReceiptPath } from '@/router/utils'
import { stripeRefunds } from '@shokujii/base/apis/stripe.js'
import UserSuccessJoinEventDialog from '@shokujii/base/components/UserSuccessJoinEventDialog.vue'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'

const route = useRoute()
const userId = route.params.userId as string

const userIdRef = ref('')
const fetchUser = async (identifier: string) => {
  const userCollection = collection(db, 'users')
  const queryById = query(userCollection, where('user_id', '==', identifier), limit(1))

  try {
    const queryByIdSnapshot = await getDocs(queryById)

    if (!queryByIdSnapshot.empty) {
      userIdRef.value = queryByIdSnapshot.docs[0].data().user_id
    } else {
      userIdRef.value = ''
    }
  } catch {
    userIdRef.value = ''
  }
}
await fetchUser(userId)

const notification = useNotification()

const { t: $t } = useI18n()

const { user } = storeToRefs(useUserStore(userId))
const { firebaseUser } = storeToRefs(useCurrentUserStore())

const tabs = ref(null)
const cancelOperatingOrderId = ref<string | null>(null)

const isOwner = computed(() => {
  const uid = firebaseUser.value?.uid
  return uid != null ? userId === uid : false
})

// オーダー情報の取得
const userOrderListStore = useOrderListByUserId(userId)
const orders = computed(() => {
  return (userOrderListStore.orders ?? []).flatMap(({ order, eventId }) => {
    const event = (useEventStore(eventId) as EventStore).event
    if (event == null) {
      return []
    }
    if (!isOwner.value && !event.is_public) {
      return []
    }
    return { order, event }
  })
})

const eventGroups = computed(() => {
  const map = new Map<string, { event: BokudeliEvent; orders: EventMemberOrder[] }>()
  for (const { order, event } of orders.value) {
    const existing = map.get(order.event_id)
    if (existing) {
      existing.orders.push(order)
    } else {
      map.set(order.event_id, { event, orders: [order] })
    }
  }
  return Array.from(map.values())
})

const memberCommunityListStore = useCommunityListStore(
  [where('members', 'array-contains', doc(db, 'users', userId)), orderBy('community_num_members', 'desc')],
  5,
)

const managerCommunityListStore = useCommunityListStore(
  [where('managers', 'array-contains', doc(db, 'users', userId)), orderBy('community_num_members', 'desc')],
  5,
)

const memberCommunities = computed(() =>
  (memberCommunityListStore.communityStores ?? []).flatMap((communityStore) => {
    if (communityStore.community == null || communityStore.members == null) {
      return []
    }
    if (!isOwner.value && !communityStore.community.is_public) {
      return []
    }
    return {
      community: communityStore.community,
      members: communityStore.members.filter((m) => m !== undefined),
    }
  }),
)

const managerCommunities = computed(() =>
  (managerCommunityListStore.communityStores ?? []).flatMap((communityStore) => {
    if (communityStore.community == null || communityStore.members == null) {
      return []
    }
    if (!isOwner.value && !communityStore.community.is_public) {
      return []
    }
    return {
      community: communityStore.community,
      members: communityStore.members.filter((m) => m !== undefined),
    }
  }),
)

// Phase 7 で cancelOrders API に統合予定。暫定的に先頭 order で既存処理を呼ぶ
const cancel = async (cancelOrders: EventMemberOrder[]) => {
  const order = cancelOrders[0]
  if (order == null) return
  const event = (useEventStore(order.event_id) as EventStore).event
  if (event == null) return

  cancelOperatingOrderId.value = order.order_id
  try {
    if (event.event_payment === 'user_advance' && order.stripe_id != null) {
      await stripeRefunds({
        order_id: order.order_id,
        community_id: order.community_id,
        event_id: order.event_id,
      })
      userOrderListStore.reload()
      notification.show($t('user.canceled'), 'success')
    } else if (event.event_payment === 'user_on_day' || event.event_payment === 'community_bill') {
      const eventStore = useEventStore(order.event_id)
      await eventStore.updateOrderStatus(order, 'canceled')
      userOrderListStore.reload()
      notification.show($t('user.canceled'), 'success')
    }
  } catch (error) {
    console.error(error)
    Object.assign(notification, { message: $t('user.cancel_failed'), color: 'error' })
  } finally {
    cancelOperatingOrderId.value = null
  }
}

// Stripeからのリダイレクトでイベントに参加した場合の処理
const isUserSuccessJoinEventDialogVisible = ref(false)
if (route.query.eventId != null && route.query.communityAccount != null) {
  isUserSuccessJoinEventDialogVisible.value = true
}

const downloadReceipt = (eventId: string, stripeId: string) => {
  window.open(getReceiptPath(eventId, stripeId), '_blank')
}
</script>

<template>
  <v-container
    v-if="user != null && user.is_deleted"
    class="d-flex align-center justify-center"
    style="min-height: 60vh"
  >
    <p class="text-body-1 text-medium-emphasis">{{ $t('user_profile.account_deleted') }}</p>
  </v-container>
  <v-row v-else-if="user != null" justify="center">
    <v-col cols="12" sm="8" md="3">
      <UserBioPanel :user-data="user" :is-editable="isOwner" />
    </v-col>
    <v-col cols="12" sm="8" md="9">
      <v-tabs v-model="tabs">
        <v-tab value="0">
          <v-icon start :icon="mdiCalendarHeart" />
          {{ $t('user.order_list') }}
        </v-tab>
        <v-tab value="1">
          <v-icon start :icon="mdiAccountGroup" />
          {{ $t('user.member_community_list') }}
        </v-tab>
        <v-tab value="2">
          <v-icon start :icon="mdiHeartOutline" />
          {{ $t('user.manager_community_list') }}
        </v-tab>
      </v-tabs>
      <v-window v-model="tabs" class="pa-6">
        <v-window-item value="0">
          <v-row>
            <v-col
              v-for="{ event, orders: groupOrders } in eventGroups"
              :key="`event_${event.event_id}`"
              sm="12"
              md="6"
              lg="4"
              cols="12"
            >
              <div class="event-card">
                <router-link :to="getEventPath(event.community_account, event.event_id)">
                  <UserEventCard
                    :orders="groupOrders"
                    :event="event"
                    :isOwner="isOwner"
                    @downloadInvoice="downloadReceipt"
                    @cancel="cancel"
                  />
                </router-link>

                <div
                  v-if="groupOrders.some((o) => cancelOperatingOrderId === o.order_id)"
                  class="progress-container d-flex justify-center align-center"
                >
                  <v-progress-circular :indeterminate="true" size="large" />
                </div>
              </div>
            </v-col>
          </v-row>
          <v-row class="justify-center">
            <v-col cols="auto">
              <IncrementalLoader :has-more="userOrderListStore.hasMore" @load="userOrderListStore.next()" />
            </v-col>
          </v-row>
        </v-window-item>
        <v-window-item value="1">
          <v-row>
            <v-col
              v-for="{ community, members } in memberCommunities"
              :key="`member_${community.community_id}`"
              cols="12"
            >
              <router-link :to="getCommunityPath(community.community_account)">
                <CommunityCard :community="community" :members="members" :textLength="60" />
              </router-link>
            </v-col>
          </v-row>
          <v-row class="justify-center">
            <v-col cols="auto">
              <IncrementalLoader
                :loaded-count="memberCommunityListStore.communityStores?.length ?? 0"
                :total-count="memberCommunityListStore.totalCount ?? Number.MAX_SAFE_INTEGER"
                @load="memberCommunityListStore.next()"
              />
            </v-col>
          </v-row>
        </v-window-item>
        <v-window-item value="2">
          <v-row>
            <v-col
              v-for="{ community, members } in managerCommunities"
              :key="`member_${community.community_id}`"
              cols="12"
            >
              <router-link :to="getCommunityPath(community.community_account)">
                <CommunityCard :community="community" :members="members" :textLength="60" />
              </router-link>
            </v-col>
          </v-row>
          <v-row class="justify-center">
            <v-col cols="auto">
              <IncrementalLoader
                :loaded-count="managerCommunityListStore.communityStores?.length ?? 0"
                :total-count="managerCommunityListStore.totalCount ?? Number.MAX_SAFE_INTEGER"
                @load="managerCommunityListStore.next()"
              />
            </v-col>
          </v-row>
        </v-window-item>
      </v-window>
    </v-col>
  </v-row>
  <!-- 存在しない eventId や communityAccount にも反応してしまう。 TODO 修正 -->
  <!-- prettier-ignore -->
  <UserSuccessJoinEventDialog
    v-if="$route.query.eventId != null || $route.query.communityAccount != null"
    v-model="isUserSuccessJoinEventDialogVisible"
    :event-id="(($route.query.eventId ?? '') as string)"
    :community-account="(($route.query.communityAccount ?? '') as string)"
    :is-posted="($route.query.isPosted === 'true')"
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
