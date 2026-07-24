<script setup lang="ts">
import { db } from '@shokujii/base/firebase.js'
import { doc, orderBy, where } from 'firebase/firestore'
import { useRoute, useRouter } from 'vue-router'
import UserBioPanel from '@shokujii/base/components/UserBioPanel.vue'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import ProfileEventCard from '@shokujii/base/components/ProfileEventCard.vue'
import CommunityCard from '@shokujii/base/components/CommunityCard.vue'
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'
import FriendCard from '@shokujii/base/components/FriendCard.vue'
import { useCommunityListStore } from '@shokujii/base/stores/communityList.js'
import { useUserEventListByUserId } from '@shokujii/base/stores/userEventList.js'
import { useUserProfilePreviewStore } from '@shokujii/base/stores/userProfilePreview.js'
import { useUserFoodsStore } from '@shokujii/base/stores/userFoods.js'
import { mdiAccountCircle, mdiAccountGroup, mdiCalendarHeart, mdiFood, mdiHeartOutline } from '@mdi/js'
import { getCommunityPath, getEventPath, getUserPath } from '@/router/utils'
import { useEnterpriseId } from '@/composable/useEnterpriseId'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { useUserFriendsStore, type UserFriendsStore } from '@shokujii/base/stores/userFriends.js'
import { User } from '@shokujii/common/schemas/User.js'
import type { UserFriendsSortBy } from '@shokujii/common/apis/userFriends.js'
import type { UserProfileFoodPreviewItem } from '@shokujii/common/apis/userProfile.js'
import {
  getCommunityIconStoragePath,
  getEventCoverStoragePath,
  getEventMenuImageStoragePath,
  getMenuImageStoragePath,
} from '@shokujii/common/utils/storagePaths.js'
import { convertToDate, convertToDateWeekdayShort } from '@shokujii/common/utils/datetime.js'
import { convertStoragePathToURL } from '@shokujii/base/utils/storage.js'
import menuDefaultImage from '@shokujii/base/assets/images/menu_default.png'
import { useDisplay } from 'vuetify'

const TAB_PROFILE = 'profile'
const TAB_FRIENDS = 'friends'
const TAB_EVENTS = 'events'
const TAB_COMMUNITIES = 'communities'
const TAB_FOODS = 'foods'

/** プロフィール「ともだち」プレビュー。旧 72px×9 個相当の横幅に近づけるなら 72×(9/12)≈54。`UserAvatar` は 51 以上で medium サムネ（small より解像度高い） */
const PROFILE_FRIEND_PREVIEW_AVATAR_SIZE = 54

/** プロフィール概要カードのともだちアイコン表示上限（ブレークポイント別。ともだちタブ本体は無制限） */
const PROFILE_FRIENDS_PREVIEW_MAX_BY_BREAKPOINT = {
  mobile: 30,
  tablet: 100,
  desktop: 150,
} as const

/** `getUserFriends` の 1 回あたり件数（サーバ側 limit 上限 50 以下であること） */
const PROFILE_FRIENDS_PAGE_SIZE = 30
type TabKey = typeof TAB_PROFILE | typeof TAB_FRIENDS | typeof TAB_EVENTS | typeof TAB_COMMUNITIES | typeof TAB_FOODS

const props = defineProps<{
  userId: string
}>()

const route = useRoute()
const router = useRouter()
const display = useDisplay()

const profileFriendsPreviewMaxTotal = computed(() => {
  if (display.mdAndUp.value) return PROFILE_FRIENDS_PREVIEW_MAX_BY_BREAKPOINT.desktop
  if (display.smAndUp.value) return PROFILE_FRIENDS_PREVIEW_MAX_BY_BREAKPOINT.tablet
  return PROFILE_FRIENDS_PREVIEW_MAX_BY_BREAKPOINT.mobile
})

const profileUserId = props.userId

const { enterpriseId } = useEnterpriseId()
if (enterpriseId.value == null) {
  throw new Error('Enterprise is not resolved')
}

const { t: $t } = useI18n()

const currentUserStore = useCurrentUserStore()
const { user: loginUser } = storeToRefs(currentUserStore)

const previewStore = useUserProfilePreviewStore(profileUserId)
const {
  data: previewData,
  loading: previewLoading,
  error: previewError,
  notFound: previewNotFound,
  accessDenied: previewAccessDenied,
} = storeToRefs(previewStore)

const profileDisplayUser = computed(() => {
  const profile = previewData.value?.user_profile
  if (profile == null) {
    return null
  }
  return new User(profile.user_id, profile)
})

const profileDepartment = computed(() => previewData.value?.department ?? null)

const isOwner = computed(() => loginUser.value?.user_id === profileUserId)
/** Callable 認可ゲート: プレビュー取得成功まで本体を出さない（RC-44） */
const isProfileGateLoading = computed(
  () =>
    profileUserId !== '' &&
    previewLoading.value &&
    previewData.value == null &&
    !previewNotFound.value &&
    !previewAccessDenied.value,
)
const isProfileAccessDenied = computed(() => previewAccessDenied.value)
const isInvalidProfile = computed(() => previewNotFound.value)
const isProfileReady = computed(() => previewData.value != null && profileDisplayUser.value != null)
/** getUserProfilePreview 認可成功（RC-44: タブ store の load 条件） */
const isPreviewAccessGranted = computed(
  () => profileUserId !== '' && !previewNotFound.value && !previewAccessDenied.value && previewData.value != null,
)

const userEventListStore = useUserEventListByUserId(profileUserId, 6, {
  profileFilter: { kind: 'enterprise', enterpriseId: enterpriseId.value },
  autoLoad: false,
})
const { events: userEvents, totalCount: userEventsTotalCount } = storeToRefs(userEventListStore)

const friendSortBy = ref<UserFriendsSortBy>('meet_count')
const userFriendsByMeetCountStore = ref<UserFriendsStore | null>(null)
const userFriendsByLastMetStore = ref<UserFriendsStore | null>(null)

watch(
  isPreviewAccessGranted,
  (granted) => {
    userFriendsByMeetCountStore.value = null
    userFriendsByLastMetStore.value = null
    if (!granted) return
    userFriendsByMeetCountStore.value = useUserFriendsStore(profileUserId, 'meet_count', PROFILE_FRIENDS_PAGE_SIZE)
    userFriendsByLastMetStore.value = useUserFriendsStore(profileUserId, 'last_met_at', PROFILE_FRIENDS_PAGE_SIZE)
  },
  { immediate: true },
)
const activeUserFriendsStore = computed(() =>
  friendSortBy.value === 'meet_count' ? userFriendsByMeetCountStore.value : userFriendsByLastMetStore.value,
)
const activeFriends = computed(() => activeUserFriendsStore.value?.friends ?? [])
/** プロフィール内ともだちアイコンは meet_count ストアとデータを共有しつつ表示だけ上限で切る */
const profilePreviewFriends = computed(() => {
  const store = userFriendsByMeetCountStore.value
  if (store == null) return []
  return store.friends.slice(0, profileFriendsPreviewMaxTotal.value)
})
const profilePreviewFriendsLoading = computed(() => userFriendsByMeetCountStore.value?.loading ?? false)
const profilePreviewFriendsHasMore = computed(() => {
  const store = userFriendsByMeetCountStore.value
  const maxTotal = profileFriendsPreviewMaxTotal.value
  return store != null && store.hasMore && store.friends.length < maxTotal
})

const loadMoreProfilePreviewFriends = () => {
  const store = userFriendsByMeetCountStore.value
  if (store == null) return
  const maxTotal = profileFriendsPreviewMaxTotal.value
  if (!store.hasMore || store.loading || store.friends.length >= maxTotal) return
  store.next()
}

/** 概要ともだち: 追読み余地がなく空のときだけ「ともだちなし」（RC-52） */
const showProfilePreviewFriendsEmpty = computed(
  () =>
    !profilePreviewFriendsLoading.value &&
    profilePreviewFriends.value.length === 0 &&
    !profilePreviewFriendsHasMore.value,
)

/** 表示 0 件かつ追読み余地があるときに loadMore を試す（RC-72） */
const setupAutoLoadWhenEmpty = (deps: unknown[], config: { shouldLoad: () => boolean; load: () => void }) => {
  watch(deps, () => {
    if (config.shouldLoad()) {
      config.load()
    }
  })
}

setupAutoLoadWhenEmpty([profilePreviewFriends, profilePreviewFriendsHasMore, profilePreviewFriendsLoading], {
  shouldLoad: () =>
    profilePreviewFriends.value.length === 0 &&
    profilePreviewFriendsHasMore.value &&
    !profilePreviewFriendsLoading.value,
  load: loadMoreProfilePreviewFriends,
})

/**
 * URL の `?tab=xxx` をタブに解決する。
 */
const resolveTabFromQuery = (rawTab: string): TabKey => {
  switch (rawTab) {
    case TAB_FRIENDS:
    case TAB_EVENTS:
    case TAB_COMMUNITIES:
    case TAB_FOODS:
      return rawTab
    default:
      return TAB_PROFILE
  }
}

const tabs = ref<TabKey>(resolveTabFromQuery(String(route.query.tab ?? '')))

const queryTabFor = (tab: TabKey): string | undefined => (tab === TAB_PROFILE ? undefined : tab)

const syncTabToUrl = (tab: TabKey) => {
  const nextTab = queryTabFor(tab)
  const currentTab = route.query.tab == null || String(route.query.tab) === '' ? undefined : String(route.query.tab)
  if (currentTab === nextTab) return
  const query = { ...route.query } as Record<string, string | string[] | undefined>
  if (nextTab === undefined) {
    delete query.tab
  } else {
    query.tab = nextTab
  }
  void router.replace({ query })
}

/** ブラウザ戻る/進む・loginUser 解決後の URL 反映 */
watch(
  () => [route.query.tab, loginUser.value?.user_id, profileUserId] as const,
  ([rawTab]) => {
    const resolved = resolveTabFromQuery(String(rawTab ?? ''))
    if (tabs.value !== resolved) {
      tabs.value = resolved
    }
  },
)

const userFoodsStore = useUserFoodsStore(profileUserId, 12, { autoLoad: false })
const { foods: pagedFoods, hasMore: foodHasMore, loading: foodLoading, error: foodError } = storeToRefs(userFoodsStore)

/** RC-44: preview Callable 成功後のみイベント/フードタブ store を load */
watch(
  isPreviewAccessGranted,
  (granted) => {
    if (!granted) return
    userEventListStore.reload()
    userFoodsStore.reload()
  },
  { immediate: true },
)

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

/** タブ表示直後に IncrementalLoader が画面外のとき、追読みを 1 回試す */
watch(tabs, (tab) => {
  syncTabToUrl(tab)
  if (!isFriendTab(tab)) return
  void nextTick(() => {
    tryLoadMoreUserFriends()
  })
})

watch(friendSortBy, () => {
  if (!isFriendTab(tabs.value)) return
  void nextTick(() => {
    tryLoadMoreUserFriends()
  })
})

/** §4.2.0: 限定公開も表示。詳細リンクは本人または is_linkable / 一般公開のみ */
const canLinkToDetail = (isPublic: boolean, isLinkable?: boolean): boolean => isLinkable ?? (isOwner.value || isPublic)

const memberCommunityListStore = computed(() =>
  useCommunityListStore(
    [
      where('enterprise_id', '==', enterpriseId.value),
      where('members', 'array-contains', doc(db, 'users', profileUserId)),
      orderBy('community_num_members', 'desc'),
    ],
    5,
  ),
)

const managerCommunityListStore = computed(() =>
  useCommunityListStore(
    [
      where('enterprise_id', '==', enterpriseId.value),
      where('managers', 'array-contains', doc(db, 'users', profileUserId)),
      orderBy('community_num_members', 'desc'),
    ],
    5,
  ),
)

const memberCommunities = computed(() =>
  (memberCommunityListStore.value.communityStores ?? []).flatMap((communityStore) => {
    if (communityStore.community == null || communityStore.members == null) {
      return []
    }
    return {
      community: communityStore.community,
      members: communityStore.members.filter((m) => m !== undefined),
    }
  }),
)

const managerCommunities = computed(() =>
  (managerCommunityListStore.value.communityStores ?? []).flatMap((communityStore) => {
    if (communityStore.community == null || communityStore.members == null) {
      return []
    }
    return {
      community: communityStore.community,
      members: communityStore.members.filter((m) => m !== undefined),
    }
  }),
)

const isUserEventsLoaded = computed(() => userEventsTotalCount.value !== null)

const counts = computed(() => previewData.value?.counts ?? null)

/** プロフィールプレビュー Callable の初回取得中（カード枠は先に表示） */
const isProfilePreviewInitialLoading = computed(() => previewLoading.value && previewData.value == null)

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
const previewJoinedCommunities = computed(() => previewData.value?.previews.joined_communities ?? [])
const previewManagedCommunities = computed(() => previewData.value?.previews.managed_communities ?? [])
const previewFoods = computed(() => previewData.value?.previews.foods ?? [])

/** フードタブ: 次ページがなく空のときだけ空表示（RC-53/54） */
const showFoodsTabEmpty = computed(() => !foodLoading.value && pagedFoods.value.length === 0 && !foodHasMore.value)

setupAutoLoadWhenEmpty([pagedFoods, foodHasMore, foodLoading, tabs], {
  shouldLoad: () =>
    tabs.value === TAB_FOODS && pagedFoods.value.length === 0 && foodHasMore.value && !foodLoading.value,
  load: () => userFoodsStore.next(),
})

watch(
  () => loginUser.value?.user_id,
  (uid, prevUid) => {
    if (uid === prevUid) return
    previewStore.reload()
  },
)

const showProfileJoinedSection = computed(() => previewJoinedCommunities.value.length > 0)
const showProfileManagedSection = computed(() => previewManagedCommunities.value.length > 0)
const isProfileCommunitiesEmpty = computed(() => !showProfileJoinedSection.value && !showProfileManagedSection.value)

const showJoinedSection = computed(() => memberCommunities.value.length > 0)
const showManagedSection = computed(() => managerCommunities.value.length > 0)
const memberCommunityListHasMore = computed(() => {
  const loaded = memberCommunityListStore.value.communityStores?.length ?? 0
  const total = memberCommunityListStore.value.totalCount
  return total != null && loaded < total
})
const managerCommunityListHasMore = computed(() => {
  const loaded = managerCommunityListStore.value.communityStores?.length ?? 0
  const total = managerCommunityListStore.value.totalCount
  return total != null && loaded < total
})
/** コミュニティタブ: 両セクションとも表示 0 かつ追読みも無いときのみ空表示（RC-61） */
const isCommunitiesTabEmpty = computed(
  () =>
    memberCommunities.value.length === 0 &&
    managerCommunities.value.length === 0 &&
    !memberCommunityListHasMore.value &&
    !managerCommunityListHasMore.value,
)
const isCommunitiesTabReady = computed(
  () => memberCommunityListStore.value.totalCount !== null && managerCommunityListStore.value.totalCount !== null,
)

setupAutoLoadWhenEmpty(
  [memberCommunities, managerCommunities, memberCommunityListHasMore, managerCommunityListHasMore, tabs],
  {
    shouldLoad: () => {
      if (tabs.value !== TAB_COMMUNITIES) return false
      if (memberCommunities.value.length === 0 && memberCommunityListHasMore.value) return true
      if (managerCommunities.value.length === 0 && managerCommunityListHasMore.value) return true
      return false
    },
    load: () => {
      if (memberCommunities.value.length === 0 && memberCommunityListHasMore.value) {
        memberCommunityListStore.value.next()
      }
      if (managerCommunities.value.length === 0 && managerCommunityListHasMore.value) {
        managerCommunityListStore.value.next()
      }
    },
  },
)

const friendUserOf = (item: { user_id: string; user_name: string; user_image_url: string }) =>
  new User(item.user_id, { user_name: item.user_name, user_image_url: item.user_image_url })

const statTabForKey = (key: ProfileStatRow['key']): TabKey => {
  switch (key) {
    case 'friend_count':
      return TAB_FRIENDS
    case 'participated_event':
      return TAB_EVENTS
    case 'joined_community':
    case 'managed_community':
      return TAB_COMMUNITIES
    case 'ordered_food':
      return TAB_FOODS
  }
}

const failedFoodMenuImageIds = ref(new Set<string>())

const getMenuImageUrl = (food: UserProfileFoodPreviewItem): string => {
  const { community_id, event_id, menu_id, event_status_value, partner_id } = food
  if (community_id === '' || event_id === '' || menu_id === '') {
    return menuDefaultImage
  }
  try {
    if (event_status_value === 'accepting_order') {
      return convertStoragePathToURL(getEventMenuImageStoragePath(community_id, event_id, menu_id))
    }
    if (partner_id !== '') {
      return convertStoragePathToURL(getMenuImageStoragePath(partner_id, menu_id))
    }
  } catch {
    return menuDefaultImage
  }
  return menuDefaultImage
}

const foodMenuImageSrc = (food: UserProfileFoodPreviewItem): string => {
  if (failedFoodMenuImageIds.value.has(food.order_id)) {
    return menuDefaultImage
  }
  return getMenuImageUrl(food)
}

const markFoodMenuImageFailed = (orderId: string) => {
  if (failedFoodMenuImageIds.value.has(orderId)) return
  failedFoodMenuImageIds.value.add(orderId)
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

const failedEventCoverIds = ref(new Set<string>())

const eventCoverKey = (communityId: string, eventId: string): string => `${communityId}/${eventId}`

watch(
  () => previewData.value,
  () => {
    failedEventCoverIds.value = new Set()
  },
)

const onEventCoverError = (communityId: string, eventId: string) => {
  const key = eventCoverKey(communityId, eventId)
  if (failedEventCoverIds.value.has(key)) return
  failedEventCoverIds.value = new Set([...failedEventCoverIds.value, key])
}

const showEventCoverImage = (communityId: string, eventId: string): boolean =>
  eventCoverUrl(communityId, eventId) != null && !failedEventCoverIds.value.has(eventCoverKey(communityId, eventId))

const goToTab = (tab: TabKey) => {
  tabs.value = tab
}

/** プロフィールプレビュー用。イベントは曜日付き、それ以外は日付のみ */
const formatProfileDate = (epochMillis: number, kind: 'withWeekday' | 'date' = 'date') => {
  if (epochMillis === 0) return ''
  return kind === 'withWeekday' ? convertToDateWeekdayShort(epochMillis) : convertToDate(epochMillis)
}
</script>

<template>
  <v-container v-if="isProfileGateLoading" class="d-flex align-center justify-center" style="min-height: 60vh">
    <v-progress-circular indeterminate color="primary" size="48" />
  </v-container>
  <v-container v-else-if="isProfileAccessDenied" class="d-flex align-center justify-center" style="min-height: 60vh">
    <p class="text-body-1 text-medium-emphasis">{{ $t('user_profile.access_denied') }}</p>
  </v-container>
  <v-container v-else-if="isInvalidProfile" class="d-flex align-center justify-center" style="min-height: 60vh">
    <p class="text-body-1 text-medium-emphasis">{{ $t('user_profile.user_not_found') }}</p>
  </v-container>
  <v-row v-else-if="isProfileReady && profileDisplayUser != null" justify="center">
    <v-col cols="12" sm="8" md="3">
      <UserBioPanel :user-data="profileDisplayUser" :is-editable="isOwner" hide-sns />
      <p
        v-if="profileDepartment != null && profileDepartment !== ''"
        class="text-body-2 text-medium-emphasis mt-3 px-2"
      >
        {{ $t('user_profile.department_label', { department: profileDepartment }) }}
      </p>
    </v-col>
    <v-col cols="12" sm="8" md="9">
      <v-tabs v-model="tabs" class="profile-page-tabs" grow stacked density="compact">
        <v-tab :value="TAB_PROFILE">
          <v-icon :icon="mdiAccountCircle" size="22" />
          <span class="profile-page-tabs__label">{{ $t('user_profile.tab_profile') }}</span>
        </v-tab>
        <v-tab :value="TAB_FRIENDS">
          <v-icon :icon="mdiHeartOutline" size="22" />
          <span class="profile-page-tabs__label">{{ $t('user_profile.tab_friends') }}</span>
        </v-tab>
        <v-tab :value="TAB_EVENTS">
          <v-icon :icon="mdiCalendarHeart" size="22" />
          <span class="profile-page-tabs__label">{{ $t('user_profile.tab_events') }}</span>
        </v-tab>
        <v-tab :value="TAB_COMMUNITIES">
          <v-icon :icon="mdiAccountGroup" size="22" />
          <span class="profile-page-tabs__label">{{ $t('user_profile.tab_communities') }}</span>
        </v-tab>
        <v-tab :value="TAB_FOODS">
          <v-icon :icon="mdiFood" size="22" />
          <span class="profile-page-tabs__label">{{ $t('user_profile.tab_foods') }}</span>
        </v-tab>
      </v-tabs>
      <v-window v-model="tabs" class="pa-4 pa-md-6">
        <v-window-item :value="TAB_PROFILE">
          <div v-if="previewError != null" class="text-body-1 text-medium-emphasis pa-6">
            {{ $t('user_profile.failed_to_load') }}
          </div>
          <template v-else>
            <!-- 数値サマリー -->
            <v-card elevation="2" class="profile-panel-card mb-4">
              <v-card-text class="pa-4 pa-sm-5">
                <div class="profile-stats-summary">
                  <div v-for="row in profileStatRows" :key="row.key" class="profile-stats-item text-center">
                    <div class="text-body-2 text-medium-emphasis">{{ row.label }}</div>
                    <v-skeleton-loader
                      v-if="isProfilePreviewInitialLoading"
                      type="text"
                      class="profile-stat-skeleton mx-auto mt-1"
                    />
                    <button
                      v-else
                      type="button"
                      class="profile-stat-value text-h3 font-weight-medium mt-1"
                      :aria-label="$t('user_profile.stat_view_detail', { label: row.label })"
                      @click="goToTab(statTabForKey(row.key))"
                    >
                      {{ row.value }}
                    </button>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- ともだち -->
            <v-card elevation="2" class="profile-panel-card mb-4">
              <v-card-title class="profile-section-card-title d-flex align-center flex-wrap gap-y-2 py-4">
                <v-icon
                  :icon="mdiHeartOutline"
                  size="18"
                  class="profile-section-title__icon text-medium-emphasis me-1"
                />
                <span class="profile-section-title">{{ $t('user_profile.section.friends') }}</span>
                <v-spacer />
                <v-btn variant="text" size="small" @click="goToTab(TAB_FRIENDS)">{{
                  $t('user_profile.show_more')
                }}</v-btn>
              </v-card-title>
              <v-card-text class="pt-0">
                <div
                  v-if="
                    isProfilePreviewInitialLoading ||
                    (profilePreviewFriendsLoading && profilePreviewFriends.length === 0)
                  "
                  class="profile-friends-preview d-flex flex-wrap ga-2 align-center"
                >
                  <v-skeleton-loader
                    v-for="n in 8"
                    :key="`friend-skeleton-${n}`"
                    type="avatar"
                    class="profile-friend-preview-skeleton flex-shrink-0"
                  />
                </div>
                <div v-else-if="showProfilePreviewFriendsEmpty" class="text-body-2 text-medium-emphasis">
                  {{ $t('user_profile.empty.friends') }}
                </div>
                <div
                  v-if="profilePreviewFriends.length > 0"
                  class="profile-friends-preview d-flex flex-wrap ga-2 align-center"
                >
                  <template v-for="friend in profilePreviewFriends" :key="friend.user_id">
                    <router-link
                      v-if="friend.is_linkable !== false"
                      class="profile-friends-preview-link text-decoration-none flex-shrink-0"
                      :to="getUserPath(friend.user_id)"
                      :aria-label="friend.user_name"
                    >
                      <UserAvatar :user="friendUserOf(friend)" :size="PROFILE_FRIEND_PREVIEW_AVATAR_SIZE" />
                    </router-link>
                    <span
                      v-else
                      class="profile-friends-preview-link flex-shrink-0 d-inline-flex"
                      :aria-label="friend.user_name"
                    >
                      <UserAvatar :user="friendUserOf(friend)" :size="PROFILE_FRIEND_PREVIEW_AVATAR_SIZE" />
                    </span>
                  </template>
                </div>
                <div
                  v-if="
                    !isProfilePreviewInitialLoading &&
                    (profilePreviewFriendsHasMore || profilePreviewFriends.length > 0)
                  "
                  class="d-flex justify-center mt-3"
                >
                  <IncrementalLoader
                    :loaded-count="profilePreviewFriends.length"
                    :total-count="
                      profilePreviewFriendsHasMore ? profileFriendsPreviewMaxTotal : profilePreviewFriends.length
                    "
                    @load="loadMoreProfilePreviewFriends()"
                  />
                </div>
              </v-card-text>
            </v-card>

            <!-- 参加イベント -->
            <v-card elevation="2" class="profile-panel-card mb-4">
              <v-card-title class="profile-section-card-title d-flex align-center flex-wrap gap-y-2 py-4">
                <v-icon
                  :icon="mdiCalendarHeart"
                  size="18"
                  class="profile-section-title__icon text-medium-emphasis me-1"
                />
                <span class="profile-section-title">{{ $t('user_profile.section.events') }}</span>
                <v-spacer />
                <v-btn variant="text" size="small" @click="goToTab(TAB_EVENTS)">{{
                  $t('user_profile.show_more')
                }}</v-btn>
              </v-card-title>
              <v-card-text class="pt-0">
                <v-row v-if="isProfilePreviewInitialLoading" dense>
                  <v-col v-for="n in 4" :key="`event-skeleton-${n}`" cols="6" sm="4" md="3">
                    <v-skeleton-loader type="image, text@2" class="profile-preview-skeleton" />
                  </v-col>
                </v-row>
                <div v-else-if="previewEvents.length === 0" class="text-body-2 text-medium-emphasis">
                  {{ $t('user_profile.empty.events') }}
                </div>
                <v-row v-else dense>
                  <v-col v-for="event in previewEvents" :key="event.event_id" cols="6" sm="4" md="3">
                    <router-link
                      v-if="canLinkToDetail(event.is_public, event.is_linkable)"
                      class="preview-event-link d-block"
                      :to="getEventPath(event.community_account, event.event_id)"
                    >
                      <v-card variant="outlined" class="h-100 preview-card overflow-hidden">
                        <div class="event-preview-tile">
                          <div class="event-preview-tile__cover overflow-hidden">
                            <v-img
                              v-if="showEventCoverImage(event.community_id, event.event_id)"
                              :src="eventCoverUrl(event.community_id, event.event_id)"
                              :alt="event.event_name"
                              cover
                              aspect-ratio="1.91"
                              @error="onEventCoverError(event.community_id, event.event_id)"
                            />
                            <div
                              v-else
                              class="event-preview-tile__cover-placeholder d-flex align-center justify-center bg-surface-variant"
                            >
                              <v-icon :icon="mdiCalendarHeart" size="28" class="text-medium-emphasis" />
                            </div>
                          </div>
                          <v-card-text class="pa-3 pt-2">
                            <div
                              class="event-preview-tile__meta-row d-flex align-center justify-space-between ga-1 min-width-0"
                            >
                              <div
                                class="profile-preview-tile__meta text-medium-emphasis text-truncate min-width-0"
                                :title="formatProfileDate(event.event_start_datetime, 'withWeekday')"
                              >
                                {{ formatProfileDate(event.event_start_datetime, 'withWeekday') }}
                              </div>
                              <v-chip
                                v-if="!event.is_public"
                                size="x-small"
                                variant="flat"
                                class="profile-preview-private-chip flex-shrink-0"
                                label
                              >
                                {{ $t('user_profile.private_event_chip') }}
                              </v-chip>
                            </div>
                            <div class="text-body-2 mt-1 text-truncate" :title="event.event_name">
                              {{ event.event_name }}
                            </div>
                          </v-card-text>
                        </div>
                      </v-card>
                    </router-link>
                    <div v-else class="preview-event-link preview-event-link--static d-block">
                      <v-card variant="outlined" class="h-100 preview-card overflow-hidden">
                        <div class="event-preview-tile">
                          <div class="event-preview-tile__cover overflow-hidden">
                            <v-img
                              v-if="showEventCoverImage(event.community_id, event.event_id)"
                              :src="eventCoverUrl(event.community_id, event.event_id)"
                              :alt="event.event_name"
                              cover
                              aspect-ratio="1.91"
                              @error="onEventCoverError(event.community_id, event.event_id)"
                            />
                            <div
                              v-else
                              class="event-preview-tile__cover-placeholder d-flex align-center justify-center bg-surface-variant"
                            >
                              <v-icon :icon="mdiCalendarHeart" size="28" class="text-medium-emphasis" />
                            </div>
                          </div>
                          <v-card-text class="pa-3 pt-2">
                            <div
                              class="event-preview-tile__meta-row d-flex align-center justify-space-between ga-1 min-width-0"
                            >
                              <div
                                class="profile-preview-tile__meta text-medium-emphasis text-truncate min-width-0"
                                :title="formatProfileDate(event.event_start_datetime, 'withWeekday')"
                              >
                                {{ formatProfileDate(event.event_start_datetime, 'withWeekday') }}
                              </div>
                              <v-chip
                                v-if="!event.is_public"
                                size="x-small"
                                variant="flat"
                                class="profile-preview-private-chip flex-shrink-0"
                                label
                              >
                                {{ $t('user_profile.private_event_chip') }}
                              </v-chip>
                            </div>
                            <div class="text-body-2 mt-1 text-truncate" :title="event.event_name">
                              {{ event.event_name }}
                            </div>
                          </v-card-text>
                        </div>
                      </v-card>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- コミュニティ（参加 + 運営） -->
            <v-card elevation="2" class="profile-panel-card mb-4">
              <v-card-title class="profile-section-card-title d-flex align-center flex-wrap gap-y-2 py-4">
                <v-icon
                  :icon="mdiAccountGroup"
                  size="18"
                  class="profile-section-title__icon text-medium-emphasis me-1"
                />
                <span class="profile-section-title">{{ $t('user_profile.tab_communities') }}</span>
                <v-spacer />
                <v-btn variant="text" size="small" @click="goToTab(TAB_COMMUNITIES)">{{
                  $t('user_profile.show_more')
                }}</v-btn>
              </v-card-title>
              <v-card-text class="pt-0">
                <v-row v-if="isProfilePreviewInitialLoading" dense>
                  <v-col v-for="n in 4" :key="`community-skeleton-${n}`" cols="6" sm="4" md="3">
                    <v-skeleton-loader type="list-item-avatar-two-line" class="profile-preview-skeleton" />
                  </v-col>
                </v-row>
                <div v-else-if="isProfileCommunitiesEmpty" class="text-body-2 text-medium-emphasis">
                  {{ $t('user_profile.empty.communities') }}
                </div>
                <template v-else>
                  <template v-if="showProfileJoinedSection">
                    <h3 class="profile-community-subsection-title mb-3">
                      {{ $t('user_profile.section.joined_communities') }}
                    </h3>
                    <v-row dense class="mb-6">
                      <v-col
                        v-for="c in previewJoinedCommunities"
                        :key="`joined_${c.community_id}`"
                        cols="6"
                        sm="4"
                        md="3"
                      >
                        <router-link
                          v-if="canLinkToDetail(c.is_public, c.is_linkable)"
                          class="preview-event-link d-block"
                          :to="getCommunityPath(c.community_account)"
                        >
                          <v-card variant="outlined" class="pa-3 h-100 preview-card">
                            <div class="community-preview-tile d-flex align-stretch ga-3">
                              <v-avatar rounded="lg" size="48" class="flex-shrink-0 align-self-center">
                                <v-img
                                  v-if="communityIconUrl(c.community_id) != null"
                                  :src="communityIconUrl(c.community_id)"
                                  :alt="c.community_name"
                                  cover
                                />
                                <v-icon v-else :icon="mdiAccountGroup" />
                              </v-avatar>
                              <div
                                class="community-preview-tile__text min-width-0 flex-grow-1 d-flex flex-column justify-center"
                              >
                                <div
                                  class="community-preview-tile__name-row d-flex align-start justify-space-between ga-1 min-width-0"
                                >
                                  <div
                                    class="text-body-1 profile-preview-tile__name min-width-0 flex-grow-1"
                                    :title="c.community_name"
                                  >
                                    {{ c.community_name }}
                                  </div>
                                  <v-chip
                                    v-if="!c.is_public"
                                    size="x-small"
                                    variant="flat"
                                    class="profile-preview-private-chip flex-shrink-0"
                                    label
                                  >
                                    {{ $t('user_profile.private_event_chip') }}
                                  </v-chip>
                                </div>
                              </div>
                            </div>
                          </v-card>
                        </router-link>
                        <div v-else class="preview-event-link preview-event-link--static d-block">
                          <v-card variant="outlined" class="pa-3 h-100 preview-card">
                            <div class="community-preview-tile d-flex align-stretch ga-3">
                              <v-avatar rounded="lg" size="48" class="flex-shrink-0 align-self-center">
                                <v-img
                                  v-if="communityIconUrl(c.community_id) != null"
                                  :src="communityIconUrl(c.community_id)"
                                  :alt="c.community_name"
                                  cover
                                />
                                <v-icon v-else :icon="mdiAccountGroup" />
                              </v-avatar>
                              <div
                                class="community-preview-tile__text min-width-0 flex-grow-1 d-flex flex-column justify-center"
                              >
                                <div
                                  class="community-preview-tile__name-row d-flex align-start justify-space-between ga-1 min-width-0"
                                >
                                  <div
                                    class="text-body-1 profile-preview-tile__name min-width-0 flex-grow-1"
                                    :title="c.community_name"
                                  >
                                    {{ c.community_name }}
                                  </div>
                                  <v-chip
                                    v-if="!c.is_public"
                                    size="x-small"
                                    variant="flat"
                                    class="profile-preview-private-chip flex-shrink-0"
                                    label
                                  >
                                    {{ $t('user_profile.private_event_chip') }}
                                  </v-chip>
                                </div>
                              </div>
                            </div>
                          </v-card>
                        </div>
                      </v-col>
                    </v-row>
                  </template>

                  <template v-if="showProfileManagedSection">
                    <h3 class="profile-community-subsection-title mb-3">
                      {{ $t('user_profile.section.managed_communities') }}
                    </h3>
                    <v-row dense>
                      <v-col
                        v-for="c in previewManagedCommunities"
                        :key="`managed_${c.community_id}`"
                        cols="6"
                        sm="4"
                        md="3"
                      >
                        <router-link
                          v-if="canLinkToDetail(c.is_public, c.is_linkable)"
                          class="preview-event-link d-block"
                          :to="getCommunityPath(c.community_account)"
                        >
                          <v-card variant="outlined" class="pa-3 h-100 preview-card">
                            <div class="community-preview-tile d-flex align-stretch ga-3">
                              <v-avatar rounded="lg" size="48" class="flex-shrink-0 align-self-center">
                                <v-img
                                  v-if="communityIconUrl(c.community_id) != null"
                                  :src="communityIconUrl(c.community_id)"
                                  :alt="c.community_name"
                                  cover
                                />
                                <v-icon v-else :icon="mdiAccountGroup" />
                              </v-avatar>
                              <div
                                class="community-preview-tile__text min-width-0 flex-grow-1 d-flex flex-column justify-center"
                              >
                                <div
                                  class="community-preview-tile__name-row d-flex align-start justify-space-between ga-1 min-width-0"
                                >
                                  <div
                                    class="text-body-1 profile-preview-tile__name min-width-0 flex-grow-1"
                                    :title="c.community_name"
                                  >
                                    {{ c.community_name }}
                                  </div>
                                  <v-chip
                                    v-if="!c.is_public"
                                    size="x-small"
                                    variant="flat"
                                    class="profile-preview-private-chip flex-shrink-0"
                                    label
                                  >
                                    {{ $t('user_profile.private_event_chip') }}
                                  </v-chip>
                                </div>
                              </div>
                            </div>
                          </v-card>
                        </router-link>
                        <div v-else class="preview-event-link preview-event-link--static d-block">
                          <v-card variant="outlined" class="pa-3 h-100 preview-card">
                            <div class="community-preview-tile d-flex align-stretch ga-3">
                              <v-avatar rounded="lg" size="48" class="flex-shrink-0 align-self-center">
                                <v-img
                                  v-if="communityIconUrl(c.community_id) != null"
                                  :src="communityIconUrl(c.community_id)"
                                  :alt="c.community_name"
                                  cover
                                />
                                <v-icon v-else :icon="mdiAccountGroup" />
                              </v-avatar>
                              <div
                                class="community-preview-tile__text min-width-0 flex-grow-1 d-flex flex-column justify-center"
                              >
                                <div
                                  class="community-preview-tile__name-row d-flex align-start justify-space-between ga-1 min-width-0"
                                >
                                  <div
                                    class="text-body-1 profile-preview-tile__name min-width-0 flex-grow-1"
                                    :title="c.community_name"
                                  >
                                    {{ c.community_name }}
                                  </div>
                                  <v-chip
                                    v-if="!c.is_public"
                                    size="x-small"
                                    variant="flat"
                                    class="profile-preview-private-chip flex-shrink-0"
                                    label
                                  >
                                    {{ $t('user_profile.private_event_chip') }}
                                  </v-chip>
                                </div>
                              </div>
                            </div>
                          </v-card>
                        </div>
                      </v-col>
                    </v-row>
                  </template>
                </template>
              </v-card-text>
            </v-card>

            <!-- フード -->
            <v-card elevation="2" class="profile-panel-card mb-4">
              <v-card-title class="profile-section-card-title d-flex align-center flex-wrap gap-y-2 py-4">
                <v-icon :icon="mdiFood" size="18" class="profile-section-title__icon text-medium-emphasis me-1" />
                <span class="profile-section-title">{{ $t('user_profile.section.foods') }}</span>
                <v-spacer />
                <v-btn variant="text" size="small" @click="goToTab(TAB_FOODS)">{{
                  $t('user_profile.show_more')
                }}</v-btn>
              </v-card-title>
              <v-card-text class="pt-0">
                <v-row v-if="isProfilePreviewInitialLoading" dense>
                  <v-col v-for="n in 4" :key="`food-skeleton-${n}`" cols="6" sm="4" md="3">
                    <v-skeleton-loader type="image, text@2" class="profile-preview-skeleton" />
                  </v-col>
                </v-row>
                <div v-else-if="previewFoods.length === 0" class="text-body-2 text-medium-emphasis">
                  {{ $t('user_profile.empty.foods') }}
                </div>
                <v-row v-else dense>
                  <v-col v-for="food in previewFoods" :key="food.order_id" cols="6" sm="4" md="3">
                    <v-card variant="outlined" class="h-100 preview-card">
                      <v-img
                        :src="foodMenuImageSrc(food)"
                        :alt="food.menu_name"
                        cover
                        height="120"
                        @error="markFoodMenuImageFailed(food.order_id)"
                      />
                      <v-card-text class="pa-3 pt-2">
                        <div
                          v-if="food.shop_name !== ''"
                          class="profile-preview-tile__meta text-medium-emphasis text-truncate"
                          :title="food.shop_name"
                        >
                          {{ food.shop_name }}
                        </div>
                        <div
                          class="text-body-2 profile-preview-tile__name"
                          :class="{ 'mt-1': food.shop_name !== '' }"
                          :title="food.menu_name"
                        >
                          {{ food.menu_name }}
                        </div>
                        <div v-if="food.event_name !== ''" class="mt-1 min-width-0">
                          <router-link
                            v-if="canLinkToDetail(food.is_public, food.is_linkable)"
                            class="food-event-link text-body-2 text-truncate d-block"
                            :to="getEventPath(food.community_account, food.event_id)"
                            :title="food.event_name"
                            :aria-label="$t('user_profile.food_event_link_label')"
                          >
                            {{ food.event_name }}
                          </router-link>
                          <span v-else class="text-body-2 text-truncate d-block" :title="food.event_name">
                            {{ food.event_name }}
                          </span>
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
          <v-row v-if="activeFriends.length > 0" class="align-center mb-2">
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
              <FriendCard
                :friend="friend"
                :target-user-id="profileUserId"
                :target-user-name="profileDisplayUser.user_name"
                :is-owner="isOwner"
                :resolve-user-path="getUserPath"
                :resolve-event-path="getEventPath"
              />
            </v-col>
          </v-row>
          <div v-else-if="!activeUserFriendsStore?.loading" class="text-body-1 text-medium-emphasis pa-4">
            {{
              isOwner
                ? $t('user.friend_empty_tab')
                : $t('user.friend_empty_other', { name: profileDisplayUser.user_name })
            }}
          </div>
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
          <div v-if="isUserEventsLoaded && userEvents.length === 0" class="text-body-1 text-medium-emphasis pa-4">
            {{ $t('user_profile.empty.events') }}
          </div>
          <v-row v-else>
            <v-col v-for="event in userEvents" :key="`event_${event.event_id}`" sm="12" md="6" lg="4" cols="12">
              <div class="event-card">
                <router-link
                  v-if="canLinkToDetail(event.is_public)"
                  :to="getEventPath(event.community_account, event.event_id)"
                >
                  <ProfileEventCard :event="event" />
                </router-link>
                <div v-else>
                  <ProfileEventCard :event="event" />
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

        <v-window-item :value="TAB_COMMUNITIES">
          <div v-if="isCommunitiesTabReady && isCommunitiesTabEmpty" class="text-body-1 text-medium-emphasis pa-4">
            {{ $t('user_profile.empty.communities') }}
          </div>
          <template v-else-if="isCommunitiesTabReady">
            <template v-if="showJoinedSection">
              <h3 class="text-h6 mt-2 mb-2">{{ $t('user_profile.section.joined_communities') }}</h3>
              <v-row>
                <v-col
                  v-for="{ community, members } in memberCommunities"
                  :key="`member_${community.community_id}`"
                  cols="12"
                >
                  <router-link
                    v-if="canLinkToDetail(community.is_public)"
                    :to="getCommunityPath(community.community_account)"
                  >
                    <CommunityCard :community="community" :members="members" />
                  </router-link>
                  <div v-else>
                    <CommunityCard :community="community" :members="members" />
                  </div>
                </v-col>
              </v-row>
            </template>
            <v-row
              v-if="memberCommunityListHasMore || memberCommunities.length > 0"
              class="justify-center"
              :class="{ 'mt-2': showJoinedSection }"
            >
              <v-col cols="auto">
                <IncrementalLoader
                  :loaded-count="memberCommunityListStore.communityStores?.length ?? 0"
                  :total-count="memberCommunityListStore.totalCount ?? Number.MAX_SAFE_INTEGER"
                  @load="memberCommunityListStore.next()"
                />
              </v-col>
            </v-row>

            <template v-if="showManagedSection">
              <h3 class="text-h6 mt-6 mb-2">{{ $t('user_profile.section.managed_communities') }}</h3>
              <v-row>
                <v-col
                  v-for="{ community, members } in managerCommunities"
                  :key="`manager_${community.community_id}`"
                  cols="12"
                >
                  <router-link
                    v-if="canLinkToDetail(community.is_public)"
                    :to="getCommunityPath(community.community_account)"
                  >
                    <CommunityCard :community="community" :members="members" />
                  </router-link>
                  <div v-else>
                    <CommunityCard :community="community" :members="members" />
                  </div>
                </v-col>
              </v-row>
            </template>
            <v-row v-if="managerCommunityListHasMore || managerCommunities.length > 0" class="justify-center mt-2">
              <v-col cols="auto">
                <IncrementalLoader
                  :loaded-count="managerCommunityListStore.communityStores?.length ?? 0"
                  :total-count="managerCommunityListStore.totalCount ?? Number.MAX_SAFE_INTEGER"
                  @load="managerCommunityListStore.next()"
                />
              </v-col>
            </v-row>
          </template>
        </v-window-item>

        <v-window-item :value="TAB_FOODS">
          <div v-if="foodLoading && pagedFoods.length === 0" class="d-flex justify-center pa-6">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <div v-else-if="foodError != null" class="text-body-1 text-medium-emphasis pa-6">
            {{ $t('user_profile.failed_to_load') }}
          </div>
          <template v-else>
            <div v-if="showFoodsTabEmpty" class="text-body-1 text-medium-emphasis pa-4">
              {{ $t('user_profile.empty.foods') }}
            </div>
            <v-row v-if="pagedFoods.length > 0">
              <v-col v-for="food in pagedFoods" :key="food.order_id" cols="12" sm="6" md="4">
                <v-card elevation="2" class="h-100 preview-card profile-panel-card">
                  <v-img
                    v-if="foodImageUrl(food) != null"
                    :src="foodImageUrl(food)"
                    :alt="food.menu_name"
                    cover
                    height="180"
                  />
                  <div
                    v-else
                    class="food-preview-placeholder d-flex align-center justify-center bg-surface-variant"
                    style="height: 180px"
                  >
                    <v-icon :icon="mdiFood" size="40" class="text-medium-emphasis" />
                  </div>
                  <v-card-title class="text-truncate" :title="food.menu_name">{{ food.menu_name }}</v-card-title>
                  <v-card-text>
                    <div v-if="food.event_name !== ''" class="mb-2 min-width-0">
                      <router-link
                        v-if="canLinkToDetail(food.is_public, food.is_linkable)"
                        class="food-event-link text-body-2 text-truncate d-block"
                        :to="getEventPath(food.community_account, food.event_id)"
                        :title="food.event_name"
                        :aria-label="$t('user_profile.food_event_link_label')"
                      >
                        {{ food.event_name }}
                      </router-link>
                      <span v-else class="text-body-2 text-truncate d-block" :title="food.event_name">
                        {{ food.event_name }}
                      </span>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatProfileDate(food.ordered_at, 'date') }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            <v-row v-if="foodHasMore || pagedFoods.length > 0" class="justify-center mt-2">
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
      </v-window>
    </v-col>
  </v-row>
</template>

<style scoped lang="scss">
/* タブ: 1 行に均等配置（横スクロール不要）。stacked でアイコン上・ラベル下 */
.profile-page-tabs {
  :deep(.v-slide-group__content) {
    flex: 1 1 auto;
  }

  :deep(.v-tab) {
    min-width: 0;
    max-width: none;
  }

  :deep(.v-btn__content) {
    flex-direction: column;
    gap: 2px;
    white-space: normal;
    text-align: center;
  }
}

.profile-page-tabs__label {
  line-height: 1.2;
  word-break: keep-all;
  overflow-wrap: anywhere;
}

@media (max-width: 599.98px) {
  .profile-page-tabs :deep(.v-tab) {
    padding-inline: 2px;
    letter-spacing: 0;
  }

  .profile-page-tabs__label {
    font-size: 0.65rem;
  }
}

@media (min-width: 600px) {
  .profile-page-tabs__label {
    font-size: 0.8125rem;
  }
}

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

/* プロフィール preview のリンク要素 */
.preview-event-link {
  text-decoration: none;
  color: inherit;
}

.preview-event-link--static {
  cursor: default;
}

.profile-panel-card {
  border-radius: 8px;
}

/* プロフィールタブ各セクション見出し（ともだち / イベント / コミュニティ / フード）
 * text-h6（1.25rem）相当。子 span だけに text-h6 を付けても VCardTitle 既定 typography と
 * 見た目がほぼ変わらないため、行（v-card-title）側で font-size を明示する。 */
.profile-section-card-title {
  font-size: 1.25rem;
  line-height: 1.375;
}

.profile-section-title {
  font-size: inherit;
  font-weight: 500;
}

.profile-section-title__icon {
  opacity: 1;
}

.profile-community-subsection-title {
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.375;
  margin: 0;
}

.profile-stat-skeleton {
  max-width: 48px;
}

.profile-friend-preview-skeleton {
  :deep(.v-skeleton-loader__avatar) {
    width: 54px;
    height: 54px;
  }
}

.profile-preview-skeleton {
  border-radius: 8px;
  overflow: hidden;
}

.profile-stat-value {
  appearance: none;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  width: 100%;
}

/* 数値サマリー: 2 / 3 / 5 列グリッドで等幅。md 以上はカード幅いっぱいに 5 等分＋項目間の縦線 */
.profile-stats-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 8px;
}

.profile-stats-item {
  min-width: 0;
}

@media (min-width: 600px) and (max-width: 959.98px) {
  .profile-stats-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .profile-stats-summary {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0;
  }

  .profile-stats-item:not(:last-child) {
    border-inline-end: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  }
}

.preview-card {
  transition: box-shadow 0.15s ease;
}

.preview-event-link .preview-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 参加イベントプレビュー: カバー上・日付・タイトル下（EventCard と同系の縦並び） */
.event-preview-tile__cover {
  width: 100%;
}

.event-preview-tile__cover-placeholder {
  width: 100%;
  aspect-ratio: 1.91;
}

/* 上段メタ情報（日付・飲食店名など）: タイトル（text-body-2）より一段小さく */
.profile-preview-tile__meta {
  font-size: 0.6875rem;
  line-height: 1.3;
}

.event-preview-tile__meta-row {
  min-height: 1.3em;
}

.profile-preview-private-chip {
  font-size: 0.625rem;
  height: 18px;
  background-color: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));

  :deep(.v-chip__content) {
    padding-inline: 5px;
    line-height: 1;
  }
}

/* コミュニティ名: 2行で切り捨て（末尾 …）。flex 子で clamp が効くよう min-height: 0 */
.community-preview-tile__text {
  min-height: 0;
}

.profile-preview-tile__name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  /* autoprefixer: ignore next - line-clamp に必須 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.375;
  min-height: 0;
}

/* プロフィールともだちプレビュー：小アイコンのみ・折り返し */
.profile-friends-preview-link:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
  border-radius: 50%;
}

.food-event-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  text-underline-offset: 2px;
}

.food-event-link:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
  border-radius: 4px;
}
</style>
