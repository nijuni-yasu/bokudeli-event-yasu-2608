<script setup lang="ts">
import { db } from '@/firebase'
import { collectionGroup, doc, getDocs, orderBy, query, where, limit, collection } from 'firebase/firestore'
import { useRoute, useRouter } from 'vue-router'
import UserBioPanel from '@/components/UserBioPanel.vue'
import UserEventCard from '@/components/UserEventCard.vue'
import CommunityCard from '@/components/CommunityCard.vue'
import IncrementalLoader from '@/components/IncrementalLoader.vue'
import { useCommunityListStore } from '@/stores/communityList'
import { useUserStore } from '@/stores/user'
import { mdiCalendarHeart, mdiAccountGroup, mdiHeartOutline } from '@mdi/js'
import { getAuth } from 'firebase/auth'
import { useEventStore, type EventStore } from '@/stores/event'
import { createEmptyOrderItem, type OrderItem } from '@/schemes/orderItem'
import type BokudeliEvent from '@/schemes/bokudeliEvent'
import { getCommunityPath, getEventPath, getInvoicePath } from '@/router/utils'
import { functions } from '@/firebase'
import { httpsCallable } from 'firebase/functions'
import UserSuccessJoinEventDialog from '@/components/UserSuccessJoinEventDialog.vue'
import type { CommunityMember } from '@/schemes/communityMember'
import { getInvoicePdf } from '@/utils/pdf'
import { useNotification } from '@/composable/notification'

const route = useRoute()
const router = useRouter()
const id = route.params.userId as string

const userIdRef = ref('')
const fetchUser = async (identifier: string) => {
  const userCollection = collection(db, "users")
  const queryById = query(userCollection, where("user_id", "==", identifier), limit(1))
  const queryByUrlPath = query(userCollection, where("user_url_path", "==", identifier), limit(1))

  try {
    const [queryByIdSnapshot, queryByUrlPathSnapshot] = await Promise.all([
      getDocs(queryById),
      getDocs(queryByUrlPath),
    ])

    if (!queryByIdSnapshot.empty) {
      userIdRef.value = queryByIdSnapshot.docs[0].data().user_id
    } else if (!queryByUrlPathSnapshot.empty) {
      userIdRef.value = queryByUrlPathSnapshot.docs[0].data().user_id
    } else {
      userIdRef.value = ''
    }
  } catch (error) {
    userIdRef.value = ''
  }
}
await fetchUser(id)
const userId = userIdRef.value as string

if (userId === '') router.replace('/')


const notification = useNotification()

const { t: $t } = useI18n()

const isOwner = computed(() => {
  const uid = getAuth().currentUser?.uid
  return uid != null ? userId === uid : false
})

const { user } = storeToRefs(useUserStore(userId))
const tabs = ref(null)
const cancelOperatingOrder = ref<OrderItem | null>(null)

// オーダー情報の取得
// TODO: 直接 firebase を叩くべきではないので、store を使えるようにする
const fetchOrders = async () =>
  getDocs(
    query(
      collectionGroup(db, 'orders'),
      where('user_id', '==', userId),
      where('status', '!=', 'in_cart'),
      orderBy('updated_at', 'desc'),
    ),
  )
const orderSnapshots = ref(await fetchOrders())
const orders: Ref<{ order: OrderItem; event: BokudeliEvent }[]> = computed(() => {
  return orderSnapshots.value.docs.flatMap((orderSnapshot) => {
    const eventId = orderSnapshot.ref.parent.parent!.id
    const event = (useEventStore(eventId) as EventStore).event
    if (event == null) {
      return []
    }
    if (!isOwner.value && !event.is_public) {
      return []
    }
    const order = { ...createEmptyOrderItem(), ...orderSnapshot.data() } as OrderItem
    return { order, event }
  })
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
      members: communityStore.members.filter((m) => m != null) as CommunityMember[],
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
      members: communityStore.members.filter((m) => m != null) as CommunityMember[],
    }
  }),
)

const cancel = async (order: OrderItem) => {
  cancelOperatingOrder.value = order
  try {
    if (order.event_payment == 'user_advance' && order.payment_intent) {
      // user_advance はstripeの支払いの場合
      const stripeRefunds = httpsCallable(functions, 'stripe_refunds')
      await stripeRefunds({ paymentIntent: order.payment_intent, orderId: order.order_id })
      orderSnapshots.value = await fetchOrders()
      notification.show($t('user.canceled'), 'success')
    } else if (order.event_payment == 'user_on_day' || order.event_payment == 'community_bill') {
      // それ以外は事前決済してないのでStripeの返金処理はなし
      const eventStore = useEventStore(order.event_id)
      eventStore.updateOrderStatus(order, 'canceled')
      orderSnapshots.value = await fetchOrders()
      notification.show($t('user.canceled'), 'success')
    }
  } catch (error) {
    console.error(error)
    Object.assign(notification, { message: $t('user.cancel_failed'), color: 'error' })
  } finally {
    cancelOperatingOrder.value = null
  }
}

// Stripeからのリダイレクトでイベントに参加した場合の処理
const isUserSuccessJoinEventDialogVisible = ref(false)
if (route.query.eventId != null && route.query.communityAccount != null) {
  isUserSuccessJoinEventDialogVisible.value = true
}

const downloadInvoice = async (order: OrderItem) => {
  const w = window.open(getInvoicePath(), '_blank')
  const pdf = await getInvoicePdf(order.event_id, order.order_id)
  w!.location.href = window.URL.createObjectURL(pdf)
}
</script>

<template>
  <v-row v-if="user != null" justify="center">
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
            <v-col v-for="{ order, event } in orders" :key="`order_${order.order_id}`" sm="12" md="6" lg="4" cols="12">
              <div class="event-card">
                <router-link :to="getEventPath(event.community_account, event.event_id)">
                  <UserEventCard
                    :order="order"
                    :event="event"
                    :isOwner="isOwner"
                    @downloadInvoice="downloadInvoice"
                    @cancel="cancel"
                  />
                </router-link>

                <div
                  v-if="toRaw(cancelOperatingOrder) === order"
                  class="progress-container d-flex justify-center align-center"
                >
                  <v-progress-circular :indeterminate="true" size="large" />
                </div>
              </div>
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
                :total-count="memberCommunityListStore.totalCount ?? 0"
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
                :total-count="managerCommunityListStore.totalCount ?? 0"
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
    v-model="isUserSuccessJoinEventDialogVisible"
    :event-id="(($route.query.eventId ?? '') as string)"
    :community-account="(($route.query.communityAccount ?? '') as string)"
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
