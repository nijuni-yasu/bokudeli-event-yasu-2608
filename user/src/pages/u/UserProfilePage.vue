<script setup lang="ts">
import { db } from '@shokujii/base/firebase.js'
import { doc, getDocs, orderBy, query, where, limit, collection } from 'firebase/firestore'
import { useRoute, useRouter } from 'vue-router'
import UserBioPanel from '@shokujii/base/components/UserBioPanel.vue'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import UserEventCard from '@shokujii/base/components/UserEventCard.vue'
import CommunityCard from '@shokujii/base/components/CommunityCard.vue'
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'
import FriendCard from '@shokujii/base/components/FriendCard.vue'
import { useCommunityListStore } from '@shokujii/base/stores/communityList.js'
import { useUserEventListByUserId } from '@shokujii/base/stores/userEventList.js'
import { useUserStore } from '@shokujii/base/stores/user.js'
import { useUserProfilePreviewStore } from '@shokujii/base/stores/userProfilePreview.js'
import { useUserFoodsStore } from '@shokujii/base/stores/userFoods.js'
import { mdiAccountCircle, mdiAccountGroup, mdiCalendarHeart, mdiFood, mdiHeartOutline, mdiReceiptText } from '@mdi/js'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { getCommunityPath, getEventPath, getReceiptPath, getUserPath } from '@/router/utils'
import { cancelOrders as callCancelOrders } from '@shokujii/base/apis/stripe.js'
import UserSuccessJoinEventDialog from '@shokujii/base/components/UserSuccessJoinEventDialog.vue'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { useUserFriendsStore, type UserFriendsStore } from '@shokujii/base/stores/userFriends.js'
import { User } from '@shokujii/common/schemas/User.js'
import type { UserFriendsSortBy } from '@shokujii/common/apis/userFriends.js'
import {
  getCommunityIconStoragePath,
  getEventCoverStoragePath,
  getEventMenuImageStoragePath,
} from '@shokujii/common/utils/storagePaths.js'
import { convertStoragePathToURL } from '@shokujii/base/utils/storage.js'

const TAB_PROFILE = 'profile'
const TAB_FRIENDS = 'friends'
const TAB_EVENTS = 'events'
const TAB_COMMUNITIES = 'communities'
const TAB_FOODS = 'foods'
const TAB_ORDERS = 'orders'

type TabKey =
  | typeof TAB_PROFILE
  | typeof TAB_FRIENDS
  | typeof TAB_EVENTS
  | typeof TAB_COMMUNITIES
  | typeof TAB_FOODS
  | typeof TAB_ORDERS

const route = useRoute()
const router = useRouter()
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

/** プロフィール表示・Firestore・注文一覧で共通の Shokujii user_id（`fetchUser` 解決後を優先） */
const profileUserId = userIdRef.value !== '' ? userIdRef.value : userId

const notification = useNotification()

const { t: $t, d } = useI18n()

const { user, exists } = storeToRefs(useUserStore(profileUserId))
const currentUserStore = useCurrentUserStore()
const { user: loginUser } = storeToRefs(currentUserStore)

const cancelLoadingEventId = ref<string | null>(null)
/** UserEventCard のキャンセルダイアログの開閉（開いているイベントの event_id、閉じているときは null） */
const cancelDialogEventId = ref<string | null>(null)

const isOwner = computed(() => loginUser.value?.user_id === profileUserId)
/** Firestore 上に users ドキュメントが無い、または退会済み */
const isInvalidProfile = computed(() => exists.value === false || (user.value != null && user.value.is_deleted))
const isProfileLoading = computed(() => profileUserId !== '' && exists.value === null)

const userEventListStore = useUserEventListByUserId(profileUserId)
const { events: userEvents, totalCount: userEventsTotalCount, orderStateByEventId } = storeToRefs(userEventListStore)

const friendSortBy = ref<UserFriendsSortBy>('meet_count')
const userFriendsByMeetCountStore = ref<UserFriendsStore | null>(null)
const userFriendsByLastMetStore = ref<UserFriendsStore | null>(null)

watch(
  () => [profileUserId, exists.value, user.value?.is_deleted] as const,
  ([pid, ex, deleted]) => {
    userFriendsByMeetCountStore.value = null
    userFriendsByLastMetStore.value = null
    if (pid === '') return
    if (ex === null) return
    if (ex === false || deleted === true) return
    userFriendsByMeetCountStore.value = useUserFriendsStore(pid, 'meet_count', 10)
    userFriendsByLastMetStore.value = useUserFriendsStore(pid, 'last_met_at', 10)
  },
  { immediate: true },
)
const activeUserFriendsStore = computed(() =>
  friendSortBy.value === 'meet_count' ? userFriendsByMeetCountStore.value : userFriendsByLastMetStore.value,
)
const activeFriends = computed(() => activeUserFriendsStore.value?.friends ?? [])

/**
 * URL の `?tab=xxx` を初期タブとして読み取り、未指定や本人以外で `orders` を直叩きされた場合は
 * プロフィールタブにフォールバックする（仕様 4.2.5）。
 */
const initialTab: TabKey = (() => {
  const raw = String(route.query.tab ?? '')
  switch (raw) {
    case TAB_FRIENDS:
    case TAB_EVENTS:
    case TAB_COMMUNITIES:
    case TAB_FOODS:
      return raw
    case TAB_ORDERS:
      return loginUser.value?.user_id === profileUserId ? TAB_ORDERS : TAB_PROFILE
    default:
      return TAB_PROFILE
  }
})()
const tabs = ref<TabKey>(initialTab)

watch(
  () => isOwner.value,
  (owner) => {
    if (!owner && tabs.value === TAB_ORDERS) {
      tabs.value = TAB_PROFILE
    }
  },
)

const previewStore = useUserProfilePreviewStore(profileUserId)
const { data: previewData, loading: previewLoading, error: previewError } = storeToRefs(previewStore)
const userFoodsStore = useUserFoodsStore(profileUserId, 12)
const { foods: pagedFoods, hasMore: foodHasMore, loading: foodLoading, error: foodError } = storeToRefs(userFoodsStore)

/** ともだち追読みのためのフック（タブ表示・ソート切替時に next を試す） */
const isFriendTab = (tab: TabKey | null) => tab === TAB_FRIENDS

const tryLoadMoreUserFriends = () => {
  if (!isFriendTab(tabs.value)) return
  const store = activeUserFriendsStore.value
  if (store == null) return
  if (store.hasMore && !store.loading) {
    store.next()
  }
}

watch(tabs, (tab) => {
  if (!isFriendTab(tab)) return
  void nextTick(() => {
    tryLoadMoreUserFriends()
    requestAnimationFrame(() => tryLoadMoreUserFriends())
    window.setTimeout(tryLoadMoreUserFriends, 300)
  })
})

watch(friendSortBy, () => {
  if (!isFriendTab(tabs.value)) return
  void nextTick(() => {
    tryLoadMoreUserFriends()
    requestAnimationFrame(() => tryLoadMoreUserFriends())
    window.setTimeout(tryLoadMoreUserFriends, 300)
  })
})

const visibleUserEvents = computed(() =>
  userEvents.value.filter((event: BokudeliEvent) => isOwner.value || event.is_public),
)

const memberCommunityListStore = useCommunityListStore(
  [where('members', 'array-contains', doc(db, 'users', profileUserId)), orderBy('community_num_members', 'desc')],
  5,
)

const managerCommunityListStore = useCommunityListStore(
  [where('managers', 'array-contains', doc(db, 'users', profileUserId)), orderBy('community_num_members', 'desc')],
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

const cancel = async (orderIds: string[], communityId: string, eventId: string) => {
  if (orderIds.length === 0) return

  cancelLoadingEventId.value = eventId
  try {
    const { data } = await callCancelOrders({
      community_id: communityId,
      event_id: eventId,
      order_ids: orderIds,
    })
    await userEventListStore.reloadOrdersForEvent(eventId)

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

// Stripeからのリダイレクトでイベントに参加した場合の処理
const isUserSuccessJoinEventDialogVisible = ref(false)
if (route.query.eventId != null && route.query.communityAccount != null) {
  isUserSuccessJoinEventDialogVisible.value = true
}

/** 注文完了で遷移したとき・既存 Pinia ストアが古い一覧のままになるのを防ぐ */
watch(
  () => [route.query.eventId, route.query.communityAccount] as const,
  ([eventId, communityAccount]) => {
    if (profileUserId === '') return
    if (eventId != null && communityAccount != null) {
      userEventListStore.reload()
    }
  },
  { immediate: true },
)

const downloadReceipt = (eventId: string, stripeId: string) => {
  window.open(getReceiptPath(eventId, stripeId), '_blank')
}

const counts = computed(() => previewData.value?.counts ?? null)

type ProfileStatRow = {
  key: 'participated_event' | 'friend_count' | 'joined_community' | 'managed_community' | 'ordered_food'
  label: string
  value: number
}

const profileStatRows = computed((): ProfileStatRow[] => {
  const c = counts.value
  return [
    { key: 'friend_count', label: $t('user_profile.counts.stat_friends_count'), value: c?.friend_count ?? 0 },
    {
      key: 'participated_event',
      label: $t('user_profile.counts.stat_participated_events_count'),
      value: c?.participated_event_count ?? 0,
    },
    {
      key: 'joined_community',
      label: $t('user_profile.counts.stat_joined_communities_count'),
      value: c?.joined_community_count ?? 0,
    },
    {
      key: 'managed_community',
      label: $t('user_profile.counts.stat_managed_communities_count'),
      value: c?.managed_community_count ?? 0,
    },
    { key: 'ordered_food', label: $t('user_profile.counts.stat_foods_count'), value: c?.ordered_food_count ?? 0 },
  ]
})

const previewEvents = computed(() => previewData.value?.previews.events ?? [])
const previewFriends = computed(() => previewData.value?.previews.friends ?? [])
const previewJoinedCommunities = computed(() => previewData.value?.previews.joined_communities ?? [])
const previewManagedCommunities = computed(() => previewData.value?.previews.managed_communities ?? [])
const previewFoods = computed(() => previewData.value?.previews.foods ?? [])

const friendUserOf = (item: { user_id: string; user_name: string; user_image_url: string }) =>
  new User(item.user_id, { user_name: item.user_name, user_image_url: item.user_image_url })

const foodImageUrl = (food: {
  community_id: string
  event_id: string
  menu_id: string
  event_status_value: string
  partner_id: string
}): string | undefined => {
  if (food.community_id === '' || food.event_id === '' || food.menu_id === '') {
    return undefined
  }
  try {
    if (food.event_status_value === 'accepting_order') {
      return convertStoragePathToURL(getEventMenuImageStoragePath(food.community_id, food.event_id, food.menu_id))
    }
    if (food.partner_id !== '') {
      return convertStoragePathToURL(`partners/${food.partner_id}/menus/${food.menu_id}/image`)
    }
  } catch {
    return undefined
  }
  return undefined
}

const communityIconUrl = (communityId: string): string | undefined => {
  if (communityId === '') return undefined
  try {
    return convertStoragePathToURL(getCommunityIconStoragePath(communityId))
  } catch {
    return undefined
  }
}

/** イベント公開ページ・UserEventCard と同じ Storage パス（カバー未設定時も URL は返る） */
const eventCoverUrl = (communityId: string, eventId: string): string | undefined => {
  if (communityId === '' || eventId === '') return undefined
  try {
    return convertStoragePathToURL(getEventCoverStoragePath(communityId, eventId))
  } catch {
    return undefined
  }
}

const goToTab = (tab: TabKey) => {
  tabs.value = tab
  void router.replace({ query: { ...route.query, tab } })
}

/** プロフィールプレビュー用。イベントは曜日付き、それ以外は日付のみ（`datetimeFormats` と整合） */
const formatProfileDate = (epochMillis: number, kind: 'withWeekday' | 'date' = 'date') => {
  if (!epochMillis) return ''
  const date = new Date(epochMillis)
  return kind === 'withWeekday' ? d(date, 'date_weekday_short') : d(date, 'date')
}
</script>

<template>
  <v-container v-if="isProfileLoading" class="d-flex align-center justify-center" style="min-height: 60vh">
    <v-progress-circular indeterminate color="primary" size="48" />
  </v-container>
  <v-container v-else-if="isInvalidProfile" class="d-flex align-center justify-center" style="min-height: 60vh">
    <p class="text-body-1 text-medium-emphasis">{{ $t('user_profile.user_not_found') }}</p>
  </v-container>
  <v-row v-else-if="user != null" justify="center">
    <v-col cols="12" sm="8" md="3">
      <UserBioPanel :user-data="user" :is-editable="isOwner" />
    </v-col>
    <v-col cols="12" sm="8" md="9">
      <v-tabs v-model="tabs">
        <v-tab :value="TAB_PROFILE">
          <v-icon start :icon="mdiAccountCircle" />
          {{ $t('user_profile.tab_profile') }}
        </v-tab>
        <v-tab :value="TAB_FRIENDS">
          <v-icon start :icon="mdiHeartOutline" />
          {{ $t('user_profile.tab_friends') }}
        </v-tab>
        <v-tab :value="TAB_EVENTS">
          <v-icon start :icon="mdiCalendarHeart" />
          {{ $t('user_profile.tab_events') }}
        </v-tab>
        <v-tab :value="TAB_COMMUNITIES">
          <v-icon start :icon="mdiAccountGroup" />
          {{ $t('user_profile.tab_communities') }}
        </v-tab>
        <v-tab :value="TAB_FOODS">
          <v-icon start :icon="mdiFood" />
          {{ $t('user_profile.tab_foods') }}
        </v-tab>
        <v-tab v-if="isOwner" :value="TAB_ORDERS">
          <v-icon start :icon="mdiReceiptText" />
          {{ $t('user_profile.tab_orders') }}
        </v-tab>
      </v-tabs>
      <v-window v-model="tabs" class="pa-4 pa-md-6">
        <v-window-item :value="TAB_PROFILE">
          <div v-if="previewLoading && previewData == null" class="d-flex justify-center pa-6">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <div v-else-if="previewError != null" class="text-body-1 text-medium-emphasis pa-6">
            {{ $t('user_profile.failed_to_load') }}
          </div>
          <template v-else-if="previewData != null">
            <!-- 数値サマリー -->
            <v-card elevation="2" class="profile-panel-card mb-4">
              <v-card-text class="pa-4 pa-sm-5">
                <v-row dense>
                  <v-col
                    v-for="row in profileStatRows"
                    :key="row.key"
                    cols="6"
                    sm="4"
                    md="2"
                    lg="2"
                    class="text-center"
                  >
                    <div class="text-caption text-medium-emphasis">{{ row.label }}</div>
                    <div class="profile-stat-value text-h3 font-weight-medium mt-1">{{ row.value }}</div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- ともだち -->
            <v-card elevation="2" class="profile-panel-card mb-4">
              <v-card-title class="d-flex align-center flex-wrap gap-y-2 py-4">
                <v-icon :icon="mdiHeartOutline" size="small" class="text-medium-emphasis me-1" />
                <span class="text-subtitle-1 font-weight-medium">{{ $t('user_profile.section.friends') }}</span>
                <v-spacer />
                <v-btn variant="text" size="small" @click="goToTab(TAB_FRIENDS)">{{
                  $t('user_profile.show_more')
                }}</v-btn>
              </v-card-title>
              <v-card-text class="pt-0">
                <div v-if="previewFriends.length === 0" class="text-body-2 text-medium-emphasis">
                  {{ $t('user_profile.empty.friends') }}
                </div>
                <v-row v-else dense>
                  <v-col v-for="friend in previewFriends" :key="friend.user_id" cols="auto">
                    <router-link
                      class="d-flex flex-column align-center text-decoration-none"
                      :to="getUserPath(friend.user_id)"
                    >
                      <UserAvatar :user="friendUserOf(friend)" :size="72" />
                      <div class="text-body-2 mt-2 text-truncate friend-preview-name" :title="friend.user_name">
                        {{ friend.user_name }}
                      </div>
                    </router-link>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- 参加イベント -->
            <v-card elevation="2" class="profile-panel-card mb-4">
              <v-card-title class="d-flex align-center flex-wrap gap-y-2 py-4">
                <v-icon :icon="mdiCalendarHeart" size="small" class="text-medium-emphasis me-1" />
                <span class="text-subtitle-1 font-weight-medium">{{ $t('user_profile.section.events') }}</span>
                <v-spacer />
                <v-btn variant="text" size="small" @click="goToTab(TAB_EVENTS)">{{
                  $t('user_profile.show_more')
                }}</v-btn>
              </v-card-title>
              <v-card-text class="pt-0">
                <div v-if="previewEvents.length === 0" class="text-body-2 text-medium-emphasis">
                  {{ $t('user_profile.empty.events') }}
                </div>
                <v-row v-else dense>
                  <v-col v-for="event in previewEvents" :key="event.event_id" cols="6" sm="4" md="3">
                    <component
                      :is="event.is_visible_to_viewer ? 'router-link' : 'div'"
                      :to="
                        event.is_visible_to_viewer ? getEventPath(event.community_account, event.event_id) : undefined
                      "
                      :class="['preview-event-link d-block', { 'preview-no-link': !event.is_visible_to_viewer }]"
                      :aria-label="event.is_visible_to_viewer ? undefined : $t('user_profile.no_link_label')"
                    >
                      <v-card
                        variant="outlined"
                        class="pa-3 h-100 preview-card"
                        :class="{ 'preview-card--muted': !event.is_visible_to_viewer }"
                      >
                        <div class="event-preview-tile d-flex align-stretch ga-3">
                          <div class="event-preview-tile__cover flex-shrink-0 rounded overflow-hidden">
                            <v-img
                              v-if="eventCoverUrl(event.community_id, event.event_id) != null"
                              :src="eventCoverUrl(event.community_id, event.event_id)"
                              :alt="event.event_name"
                              cover
                              aspect-ratio="1.91"
                              width="100"
                            />
                            <div
                              v-else
                              class="event-preview-tile__cover-placeholder d-flex align-center justify-center bg-surface-variant"
                            >
                              <v-icon :icon="mdiCalendarHeart" size="28" class="text-medium-emphasis" />
                            </div>
                          </div>
                          <div
                            class="event-preview-tile__text min-width-0 flex-grow-1 d-flex flex-column justify-center"
                          >
                            <div class="text-body-2 text-medium-emphasis">
                              {{ formatProfileDate(event.event_start_datetime, 'withWeekday') }}
                            </div>
                            <div class="text-body-1 mt-1 text-truncate" :title="event.event_name">
                              {{ event.event_name }}
                            </div>
                            <div v-if="!event.is_public" class="mt-2">
                              <v-chip size="x-small" variant="tonal" color="secondary" label>
                                {{ $t('user_profile.visibility_private') }}
                              </v-chip>
                            </div>
                          </div>
                        </div>
                      </v-card>
                    </component>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- コミュニティ（参加 + 運営） -->
            <v-card elevation="2" class="profile-panel-card mb-4">
              <v-card-title class="d-flex align-center flex-wrap gap-y-2 py-4">
                <v-icon :icon="mdiAccountGroup" size="small" class="text-medium-emphasis me-1" />
                <span class="text-subtitle-1 font-weight-medium">{{ $t('user_profile.tab_communities') }}</span>
                <v-spacer />
                <v-btn variant="text" size="small" @click="goToTab(TAB_COMMUNITIES)">{{
                  $t('user_profile.show_more')
                }}</v-btn>
              </v-card-title>
              <v-card-text class="pt-0">
                <div class="text-subtitle-2 font-weight-medium mb-3">
                  {{ $t('user_profile.section.joined_communities') }}
                </div>
                <div v-if="previewJoinedCommunities.length === 0" class="text-body-2 text-medium-emphasis mb-6">
                  {{ $t('user_profile.empty.joined_communities') }}
                </div>
                <v-row v-else dense class="mb-6">
                  <v-col v-for="c in previewJoinedCommunities" :key="`joined_${c.community_id}`" cols="6" sm="4" md="3">
                    <component
                      :is="c.is_visible_to_viewer ? 'router-link' : 'div'"
                      :to="c.is_visible_to_viewer ? getCommunityPath(c.community_account) : undefined"
                      :class="['preview-event-link d-block', { 'preview-no-link': !c.is_visible_to_viewer }]"
                      :aria-label="c.is_visible_to_viewer ? undefined : $t('user_profile.no_link_label_community')"
                    >
                      <v-card
                        variant="outlined"
                        class="pa-3 h-100 preview-card"
                        :class="{ 'preview-card--muted': !c.is_visible_to_viewer }"
                      >
                        <div class="community-preview-tile d-flex align-center ga-3">
                          <v-avatar rounded="lg" size="48" class="flex-shrink-0">
                            <v-img
                              v-if="communityIconUrl(c.community_id) != null"
                              :src="communityIconUrl(c.community_id)"
                              :alt="c.community_name"
                              cover
                            />
                            <v-icon v-else :icon="mdiAccountGroup" />
                          </v-avatar>
                          <div class="community-preview-tile__text min-width-0 flex-grow-1">
                            <div class="text-body-1 text-truncate" :title="c.community_name">
                              {{ c.community_name }}
                            </div>
                            <div v-if="!c.is_public" class="mt-1">
                              <v-chip size="x-small" variant="tonal" color="secondary" label>
                                {{ $t('user_profile.visibility_private') }}
                              </v-chip>
                            </div>
                          </div>
                        </div>
                      </v-card>
                    </component>
                  </v-col>
                </v-row>

                <div class="text-subtitle-2 font-weight-medium mb-3">
                  {{ $t('user_profile.section.managed_communities') }}
                </div>
                <div v-if="previewManagedCommunities.length === 0" class="text-body-2 text-medium-emphasis">
                  {{ $t('user_profile.empty.managed_communities') }}
                </div>
                <v-row v-else dense>
                  <v-col
                    v-for="c in previewManagedCommunities"
                    :key="`managed_${c.community_id}`"
                    cols="6"
                    sm="4"
                    md="3"
                  >
                    <component
                      :is="c.is_visible_to_viewer ? 'router-link' : 'div'"
                      :to="c.is_visible_to_viewer ? getCommunityPath(c.community_account) : undefined"
                      :class="['preview-event-link d-block', { 'preview-no-link': !c.is_visible_to_viewer }]"
                      :aria-label="c.is_visible_to_viewer ? undefined : $t('user_profile.no_link_label_community')"
                    >
                      <v-card
                        variant="outlined"
                        class="pa-3 h-100 preview-card"
                        :class="{ 'preview-card--muted': !c.is_visible_to_viewer }"
                      >
                        <div class="community-preview-tile d-flex align-center ga-3">
                          <v-avatar rounded="lg" size="48" class="flex-shrink-0">
                            <v-img
                              v-if="communityIconUrl(c.community_id) != null"
                              :src="communityIconUrl(c.community_id)"
                              :alt="c.community_name"
                              cover
                            />
                            <v-icon v-else :icon="mdiAccountGroup" />
                          </v-avatar>
                          <div class="community-preview-tile__text min-width-0 flex-grow-1">
                            <div class="text-body-1 text-truncate" :title="c.community_name">
                              {{ c.community_name }}
                            </div>
                            <div v-if="!c.is_public" class="mt-1">
                              <v-chip size="x-small" variant="tonal" color="secondary" label>
                                {{ $t('user_profile.visibility_private') }}
                              </v-chip>
                            </div>
                          </div>
                        </div>
                      </v-card>
                    </component>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- フード -->
            <v-card elevation="2" class="profile-panel-card mb-4">
              <v-card-title class="d-flex align-center flex-wrap gap-y-2 py-4">
                <v-icon :icon="mdiFood" size="small" class="text-medium-emphasis me-1" />
                <span class="text-subtitle-1 font-weight-medium">{{ $t('user_profile.section.foods') }}</span>
                <v-spacer />
                <v-btn variant="text" size="small" @click="goToTab(TAB_FOODS)">{{
                  $t('user_profile.show_more')
                }}</v-btn>
              </v-card-title>
              <v-card-text class="pt-0">
                <div v-if="previewFoods.length === 0" class="text-body-2 text-medium-emphasis">
                  {{ $t('user_profile.empty.foods') }}
                </div>
                <v-row v-else dense>
                  <v-col v-for="food in previewFoods" :key="food.order_id" cols="6" sm="4" md="3">
                    <v-card variant="outlined" class="h-100 preview-card">
                      <v-img
                        v-if="foodImageUrl(food) != null"
                        :src="foodImageUrl(food)"
                        :alt="food.menu_name"
                        cover
                        height="120"
                      />
                      <v-card-text>
                        <div class="text-body-2 text-truncate" :title="food.menu_name">{{ food.menu_name }}</div>
                        <div class="text-caption text-medium-emphasis">
                          {{ formatProfileDate(food.ordered_at, 'date') }}
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </template>
        </v-window-item>

        <v-window-item :value="TAB_FRIENDS">
          <v-row class="align-center mb-2">
            <v-col cols="12" sm="4">
              <v-btn-toggle
                v-model="friendSortBy"
                mandatory
                color="primary"
                density="comfortable"
                divided
                class="friend-sort-toggle w-100"
              >
                <v-btn value="meet_count">{{ $t('user.friend_sort_meet_count') }}</v-btn>
                <v-btn value="last_met_at">{{ $t('user.friend_sort_last_met_at') }}</v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>
          <v-row v-if="activeFriends.length > 0">
            <v-col v-for="friend in activeFriends" :key="friend.user_id" cols="12" sm="6" md="4">
              <FriendCard :friend="friend" />
            </v-col>
          </v-row>
          <v-row v-else-if="!activeUserFriendsStore?.loading" class="justify-center">
            <v-col cols="12" class="text-center">
              <div class="text-body-1 text-medium-emphasis mb-4">
                {{ isOwner ? $t('user.friend_empty') : $t('user.friend_empty_other', { name: user.user_name }) }}
              </div>
              <v-btn v-if="isOwner" color="primary" @click="$router.push('/')">{{ $t('user.friend_empty_cta') }}</v-btn>
            </v-col>
          </v-row>
          <v-row class="justify-center">
            <v-col cols="auto">
              <IncrementalLoader
                :loaded-count="activeFriends.length"
                :total-count="activeUserFriendsStore?.hasMore ? Number.MAX_SAFE_INTEGER : activeFriends.length"
                @load="activeUserFriendsStore?.next()"
              />
            </v-col>
          </v-row>
        </v-window-item>

        <v-window-item :value="TAB_EVENTS">
          <v-row>
            <v-col v-for="event in visibleUserEvents" :key="`event_${event.event_id}`" sm="12" md="6" lg="4" cols="12">
              <div class="event-card">
                <router-link :to="getEventPath(event.community_account, event.event_id)">
                  <UserEventCard
                    v-model:cancel-dialog-event-id="cancelDialogEventId"
                    :orders="orderStateByEventId[event.event_id]?.orders ?? []"
                    :orders-loading="orderStateByEventId[event.event_id]?.loading ?? false"
                    :orders-error="orderStateByEventId[event.event_id]?.error != null"
                    :event="event"
                    :isOwner="false"
                    :cancelLoading="false"
                    @retry-orders="(eid: string) => userEventListStore.reloadOrdersForEvent(eid)"
                  />
                </router-link>
              </div>
            </v-col>
          </v-row>
          <v-row class="justify-center">
            <v-col cols="auto">
              <IncrementalLoader
                :loaded-count="userEvents.length"
                :total-count="userEventsTotalCount ?? Number.MAX_SAFE_INTEGER"
                @load="userEventListStore.next()"
              />
            </v-col>
          </v-row>
        </v-window-item>

        <v-window-item :value="TAB_COMMUNITIES">
          <h3 class="text-h6 mt-2 mb-2">{{ $t('user_profile.section.joined_communities') }}</h3>
          <v-row>
            <v-col
              v-for="{ community, members } in memberCommunities"
              :key="`member_${community.community_id}`"
              cols="12"
            >
              <router-link :to="getCommunityPath(community.community_account)">
                <CommunityCard :community="community" :members="members" />
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

          <h3 class="text-h6 mt-6 mb-2">{{ $t('user_profile.section.managed_communities') }}</h3>
          <v-row>
            <v-col
              v-for="{ community, members } in managerCommunities"
              :key="`manager_${community.community_id}`"
              cols="12"
            >
              <router-link :to="getCommunityPath(community.community_account)">
                <CommunityCard :community="community" :members="members" />
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

        <v-window-item :value="TAB_FOODS">
          <div v-if="foodLoading && pagedFoods.length === 0" class="d-flex justify-center pa-6">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <div v-else-if="foodError != null" class="text-body-1 text-medium-emphasis pa-6">
            {{ $t('user_profile.failed_to_load') }}
          </div>
          <template v-else>
            <div v-if="pagedFoods.length === 0" class="text-body-1 text-medium-emphasis pa-4">
              {{ $t('user_profile.empty.foods') }}
            </div>
            <v-row v-else>
              <v-col v-for="food in pagedFoods" :key="food.order_id" cols="12" sm="6" md="4">
                <v-card variant="outlined" class="h-100 preview-card">
                  <v-img
                    v-if="foodImageUrl(food) != null"
                    :src="foodImageUrl(food)"
                    :alt="food.menu_name"
                    cover
                    height="180"
                  />
                  <v-card-title class="text-truncate" :title="food.menu_name">{{ food.menu_name }}</v-card-title>
                  <v-card-text>
                    <div class="text-body-2">¥{{ food.menu_price.toLocaleString('ja-JP') }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatProfileDate(food.ordered_at, 'date') }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            <v-row v-if="pagedFoods.length > 0" class="justify-center mt-2">
              <v-col cols="auto">
                <IncrementalLoader
                  :loaded-count="pagedFoods.length"
                  :total-count="foodHasMore ? Number.MAX_SAFE_INTEGER : pagedFoods.length"
                  @load="userFoodsStore.next()"
                />
              </v-col>
            </v-row>
          </template>
        </v-window-item>

        <v-window-item v-if="isOwner" :value="TAB_ORDERS">
          <div v-if="visibleUserEvents.length === 0" class="text-body-1 text-medium-emphasis pa-4">
            {{ $t('user_profile.empty.orders') }}
          </div>
          <v-row>
            <v-col v-for="event in visibleUserEvents" :key="`order_${event.event_id}`" sm="12" md="6" lg="4" cols="12">
              <div class="event-card">
                <router-link :to="getEventPath(event.community_account, event.event_id)">
                  <UserEventCard
                    v-model:cancel-dialog-event-id="cancelDialogEventId"
                    :orders="orderStateByEventId[event.event_id]?.orders ?? []"
                    :orders-loading="orderStateByEventId[event.event_id]?.loading ?? false"
                    :orders-error="orderStateByEventId[event.event_id]?.error != null"
                    :event="event"
                    :isOwner="isOwner"
                    :cancelLoading="cancelLoadingEventId === event.event_id"
                    @downloadInvoice="downloadReceipt"
                    @cancel="(orderIds: string[]) => cancel(orderIds, event.community_id, event.event_id)"
                    @retry-orders="(eid: string) => userEventListStore.reloadOrdersForEvent(eid)"
                  />
                </router-link>

                <div
                  v-if="cancelLoadingEventId === event.event_id"
                  class="progress-container d-flex justify-center align-center"
                >
                  <v-progress-circular :indeterminate="true" size="large" />
                </div>
              </div>
            </v-col>
          </v-row>
          <v-row class="justify-center">
            <v-col cols="auto">
              <IncrementalLoader
                :loaded-count="userEvents.length"
                :total-count="userEventsTotalCount ?? Number.MAX_SAFE_INTEGER"
                @load="userEventListStore.next()"
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

/* ともだちソート: 親幅いっぱいにし、各ボタンが均等幅でラベルが潰れないようにする */
.friend-sort-toggle {
  max-width: 100%;

  :deep(.v-btn) {
    flex: 1 1 0;
    min-width: 0;
    white-space: nowrap;
    padding-inline: 12px;
  }
}

/* プロフィール preview のリンク要素：is_visible_to_viewer === false ではカーソル default にする */
.preview-event-link {
  text-decoration: none;
  color: inherit;
}
.preview-no-link {
  cursor: default;
}

.profile-panel-card {
  border-radius: 8px;
}

.preview-card {
  transition:
    box-shadow 0.15s ease,
    opacity 0.15s ease;
}

.preview-card--muted {
  opacity: 0.88;
  box-shadow: inset 0 0 0 1px rgba(var(--v-border-color), var(--v-border-opacity));
}

.preview-event-link:not(.preview-no-link) .preview-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 参加イベントプレビュー: 左カバー（イベントページと同じ 1.91）＋右に日付・タイトル */
.event-preview-tile__cover {
  width: 100px;
}

.event-preview-tile__cover-placeholder {
  width: 100px;
  aspect-ratio: 1.91;
  min-height: 52px;
}

.friend-preview-name {
  /* アバター約 1.3 倍に合わせて名前の折り返し幅も拡げる */
  max-width: 6.5rem;
  font-size: 0.9375rem;
  line-height: 1.35;
}
</style>
