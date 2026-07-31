<script setup lang="ts">
import UserBioPanel from '@shokujii/base/components/UserBioPanel.vue'
import UserProfileStatsSummaryCard from '@shokujii/base/components/profile/UserProfileStatsSummaryCard.vue'
import UserProfileFriendsPreviewCard from '@shokujii/base/components/profile/UserProfileFriendsPreviewCard.vue'
import UserProfileEventsPreviewCard from '@shokujii/base/components/profile/UserProfileEventsPreviewCard.vue'
import UserProfileCommunitiesPreviewCard from '@shokujii/base/components/profile/UserProfileCommunitiesPreviewCard.vue'
import UserProfileFoodsPreviewCard from '@shokujii/base/components/profile/UserProfileFoodsPreviewCard.vue'
import UserProfileFriendsTabPanel from '@shokujii/base/components/profile/UserProfileFriendsTabPanel.vue'
import UserProfileEventsTabPanel from '@shokujii/base/components/profile/UserProfileEventsTabPanel.vue'
import UserProfileCommunitiesTabPanel from '@shokujii/base/components/profile/UserProfileCommunitiesTabPanel.vue'
import UserProfileFoodsTabPanel from '@shokujii/base/components/profile/UserProfileFoodsTabPanel.vue'
import {
  USER_PROFILE_FRIENDS_PREVIEW_MAX_BY_BREAKPOINT,
  USER_PROFILE_TAB_COMMUNITIES,
  USER_PROFILE_TAB_EVENTS,
  USER_PROFILE_TAB_FOODS,
  USER_PROFILE_TAB_FRIENDS,
  USER_PROFILE_TAB_PROFILE,
  type UserProfileStatRow,
  type UserProfileTabKey,
} from '@shokujii/base/components/profile/userProfileConstants.js'
import { useAutoLoadWhenEmpty } from '@shokujii/base/composable/useAutoLoadWhenEmpty.js'
import { useProfileLinkPolicy } from '@shokujii/base/composable/useProfileLinkPolicy.js'
import { useProfilePreviewMedia } from '@shokujii/base/composable/useProfilePreviewMedia.js'
import { useUserProfileAuthState } from '@shokujii/base/composable/useUserProfileAuthState.js'
import { useUserProfileCommunityLists } from '@shokujii/base/composable/useUserProfileCommunityLists.js'
import { useUserProfileFriendsStores } from '@shokujii/base/composable/useUserProfileFriendsStores.js'
import { useUserProfileTabSync } from '@shokujii/base/composable/useUserProfileTabSync.js'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { useUserEventListByUserId } from '@shokujii/base/stores/userEventList.js'
import { useUserFoodsStore } from '@shokujii/base/stores/userFoods.js'
import { mdiAccountCircle, mdiAccountGroup, mdiCalendarHeart, mdiFood, mdiHeartOutline } from '@mdi/js'
import type { UserFriendsSortBy } from '@shokujii/common/apis/userFriends.js'
import { useDisplay } from 'vuetify'
import { getCommunityPath, getEventPath, getUserPath } from '@/router/utils'

const props = defineProps<{
  userId: string
}>()

const route = useRoute()
const display = useDisplay()

const profileUserId = props.userId
const profileFilter = { kind: 'pf-null' as const }

const { t: $t } = useI18n()
const currentUserStore = useCurrentUserStore()
const { user: loginUser, firebaseUser } = storeToRefs(currentUserStore)

const {
  displayUser,
  isProfileLoading,
  isInvalidProfile,
  isPreviewAccessGranted,
  previewStore,
  previewData,
  previewLoading,
  previewError,
} = useUserProfileAuthState(profileUserId, 'pf-firestore')

const isOwner = computed(() => {
  const uid = loginUser.value?.user_id ?? firebaseUser.value?.uid
  return uid != null && uid === profileUserId
})
const { canLinkToDetail } = useProfileLinkPolicy(isOwner)

const userEventListStore = useUserEventListByUserId(profileUserId, 6, { profileFilter })
const { events: userEvents, totalCount: userEventsTotalCount } = storeToRefs(userEventListStore)

const friendSortBy = ref<UserFriendsSortBy>(
  String(route.query.sort ?? '') === 'last_met_at' ? 'last_met_at' : 'meet_count',
)

const {
  USER_PROFILE_FRIEND_PREVIEW_AVATAR_SIZE,
  userFriendsByMeetCountStore,
  userFriendsByLastMetStore,
  activeUserFriendsStore,
  activeFriends,
  profilePreviewFriends,
  profilePreviewFriendsLoading,
  profilePreviewFriendsHasMore,
  loadMoreProfilePreviewFriends,
  showProfilePreviewFriendsEmpty,
  tryLoadMoreUserFriends,
} = useUserProfileFriendsStores({
  profileUserId,
  canInitTabStores: isPreviewAccessGranted,
  friendSortBy,
})

const profileFriendsPreviewMaxTotal = computed(() => {
  if (display.mdAndUp.value) return USER_PROFILE_FRIENDS_PREVIEW_MAX_BY_BREAKPOINT.desktop
  if (display.smAndUp.value) return USER_PROFILE_FRIENDS_PREVIEW_MAX_BY_BREAKPOINT.tablet
  return USER_PROFILE_FRIENDS_PREVIEW_MAX_BY_BREAKPOINT.mobile
})

const { tabs, goToTab, isFriendTab } = useUserProfileTabSync({
  profileUserId,
  syncFriendSortToUrl: true,
  friendSortBy,
  loginUserId: computed(() => loginUser.value?.user_id),
  onTabChanged: (tab) => {
    if (!isFriendTab(tab)) return
    void nextTick(() => {
      tryLoadMoreUserFriends(true)
    })
  },
})

const userFoodsStore = useUserFoodsStore(profileUserId, 12)
const { foods: pagedFoods, hasMore: foodHasMore, loading: foodLoading, error: foodError } = storeToRefs(userFoodsStore)

const profileFilterRef = computed(() => profileFilter)
const communityLists = useUserProfileCommunityLists({
  profileUserId,
  profileFilter: profileFilterRef,
  tabs,
})

const {
  memberCommunityListStore,
  managerCommunityListStore,
  memberCommunities,
  managerCommunities,
  showJoinedSection,
  showManagedSection,
  memberCommunityListHasMore,
  managerCommunityListHasMore,
  isCommunitiesTabEmpty,
  isCommunitiesTabReady,
} = communityLists

const counts = computed(() => previewData.value?.counts ?? null)
const isProfilePreviewInitialLoading = computed(() => previewLoading.value && previewData.value == null)

const friendSortItems = computed(() => [
  { title: $t('user.friend_sort_meet_count'), value: 'meet_count' as UserFriendsSortBy },
  { title: $t('user.friend_sort_last_met_at'), value: 'last_met_at' as UserFriendsSortBy },
])

const profileStatRows = computed((): UserProfileStatRow[] => {
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

const showFoodsTabEmpty = computed(() => !foodLoading.value && pagedFoods.value.length === 0 && !foodHasMore.value)

useAutoLoadWhenEmpty([pagedFoods, foodHasMore, foodLoading, tabs], {
  shouldLoad: () =>
    tabs.value === USER_PROFILE_TAB_FOODS && pagedFoods.value.length === 0 && foodHasMore.value && !foodLoading.value,
  load: () => userFoodsStore.next(),
})

watch(
  () => loginUser.value?.user_id,
  (uid, prevUid) => {
    if (uid === prevUid) return
    previewStore.reload()
    userFoodsStore.reload()
  },
)

const showProfileJoinedSection = computed(() => previewJoinedCommunities.value.length > 0)
const showProfileManagedSection = computed(() => previewManagedCommunities.value.length > 0)
const isProfileCommunitiesEmpty = computed(() => !showProfileJoinedSection.value && !showProfileManagedSection.value)

const isUserEventsLoaded = computed(() => userEventsTotalCount.value !== null)

const {
  foodMenuImageSrc,
  markFoodMenuImageFailed,
  communityIconUrl,
  eventCoverUrl,
  onEventCoverError,
  showEventCoverImage,
} = useProfilePreviewMedia(previewData)

const showFriendSortToggle = computed(() => {
  if ((counts.value?.friend_count ?? 0) > 0) return true
  const meetLen = userFriendsByMeetCountStore.value?.friends.length ?? 0
  const lastLen = userFriendsByLastMetStore.value?.friends.length ?? 0
  return meetLen > 0 || lastLen > 0
})

const goToTabFromStat = (tab: UserProfileTabKey) => {
  goToTab(tab)
}
</script>

<template>
  <v-container v-if="isProfileLoading" class="d-flex align-center justify-center" style="min-height: 60vh">
    <v-progress-circular indeterminate color="primary" size="48" />
  </v-container>
  <v-container v-else-if="isInvalidProfile" class="d-flex align-center justify-center" style="min-height: 60vh">
    <p class="text-body-1 text-medium-emphasis">{{ $t('user_profile.user_not_found') }}</p>
  </v-container>
  <v-row v-else-if="displayUser != null" justify="center">
    <v-col cols="12" sm="8" md="3">
      <UserBioPanel :user-data="displayUser" :is-editable="isOwner" />
    </v-col>
    <v-col cols="12" sm="8" md="9">
      <v-tabs v-model="tabs" class="profile-page-tabs" grow stacked density="compact">
        <v-tab :value="USER_PROFILE_TAB_PROFILE">
          <v-icon :icon="mdiAccountCircle" size="22" />
          <span class="profile-page-tabs__label">{{ $t('user_profile.tab_profile') }}</span>
        </v-tab>
        <v-tab :value="USER_PROFILE_TAB_FRIENDS">
          <v-icon :icon="mdiHeartOutline" size="22" />
          <span class="profile-page-tabs__label">{{ $t('user_profile.tab_friends') }}</span>
        </v-tab>
        <v-tab :value="USER_PROFILE_TAB_EVENTS">
          <v-icon :icon="mdiCalendarHeart" size="22" />
          <span class="profile-page-tabs__label">{{ $t('user_profile.tab_events') }}</span>
        </v-tab>
        <v-tab :value="USER_PROFILE_TAB_COMMUNITIES">
          <v-icon :icon="mdiAccountGroup" size="22" />
          <span class="profile-page-tabs__label">{{ $t('user_profile.tab_communities') }}</span>
        </v-tab>
        <v-tab :value="USER_PROFILE_TAB_FOODS">
          <v-icon :icon="mdiFood" size="22" />
          <span class="profile-page-tabs__label">{{ $t('user_profile.tab_foods') }}</span>
        </v-tab>
      </v-tabs>
      <v-window v-model="tabs" class="pa-4 pa-md-6">
        <v-window-item :value="USER_PROFILE_TAB_PROFILE">
          <div v-if="previewError != null" class="text-body-1 text-medium-emphasis pa-6">
            {{ $t('user_profile.failed_to_load') }}
          </div>
          <template v-else>
            <UserProfileStatsSummaryCard
              :stat-rows="profileStatRows"
              :is-loading="isProfilePreviewInitialLoading"
              @go-to-tab="goToTabFromStat"
            />
            <UserProfileFriendsPreviewCard
              :friends="profilePreviewFriends"
              :is-initial-loading="isProfilePreviewInitialLoading"
              :loading="profilePreviewFriendsLoading"
              :show-empty="showProfilePreviewFriendsEmpty"
              :has-more="profilePreviewFriendsHasMore"
              :loaded-count="profilePreviewFriends.length"
              :total-count="profilePreviewFriendsHasMore ? profileFriendsPreviewMaxTotal : profilePreviewFriends.length"
              :avatar-size="USER_PROFILE_FRIEND_PREVIEW_AVATAR_SIZE"
              :resolve-user-path="getUserPath"
              @show-more="goToTab(USER_PROFILE_TAB_FRIENDS)"
              @load-more="loadMoreProfilePreviewFriends"
            />
            <UserProfileEventsPreviewCard
              :events="previewEvents"
              :is-initial-loading="isProfilePreviewInitialLoading"
              :can-link-to-detail="canLinkToDetail"
              :resolve-event-path="getEventPath"
              :event-cover-url="eventCoverUrl"
              :show-event-cover-image="showEventCoverImage"
              :on-event-cover-error="onEventCoverError"
              @show-more="goToTab(USER_PROFILE_TAB_EVENTS)"
            />
            <UserProfileCommunitiesPreviewCard
              :joined-communities="previewJoinedCommunities"
              :managed-communities="previewManagedCommunities"
              :is-initial-loading="isProfilePreviewInitialLoading"
              :is-empty="isProfileCommunitiesEmpty"
              :show-joined-section="showProfileJoinedSection"
              :show-managed-section="showProfileManagedSection"
              :can-link-to-detail="canLinkToDetail"
              :resolve-community-path="getCommunityPath"
              :community-icon-url="communityIconUrl"
              @show-more="goToTab(USER_PROFILE_TAB_COMMUNITIES)"
            />
            <UserProfileFoodsPreviewCard
              :foods="previewFoods"
              :is-initial-loading="isProfilePreviewInitialLoading"
              :can-link-to-detail="canLinkToDetail"
              :resolve-event-path="getEventPath"
              :food-menu-image-src="foodMenuImageSrc"
              :mark-food-menu-image-failed="markFoodMenuImageFailed"
              @show-more="goToTab(USER_PROFILE_TAB_FOODS)"
            />
          </template>
        </v-window-item>

        <v-window-item :value="USER_PROFILE_TAB_FRIENDS">
          <UserProfileFriendsTabPanel
            v-model="friendSortBy"
            :friend-sort-items="friendSortItems"
            :show-sort-toggle="showFriendSortToggle"
            :active-friends="activeFriends"
            :active-user-friends-store="activeUserFriendsStore"
            :profile-user-id="profileUserId"
            :target-user-name="displayUser.user_name"
            :target-user-image-url="displayUser.user_image_url"
            :is-owner="isOwner"
            :resolve-user-path="getUserPath"
            :resolve-event-path="getEventPath"
          />
        </v-window-item>

        <v-window-item :value="USER_PROFILE_TAB_EVENTS">
          <UserProfileEventsTabPanel
            :events="userEvents"
            :is-loaded="isUserEventsLoaded"
            :total-count="userEventsTotalCount"
            :can-link-to-detail="canLinkToDetail"
            :resolve-event-path="getEventPath"
            :event-list-store="userEventListStore"
          />
        </v-window-item>

        <v-window-item :value="USER_PROFILE_TAB_COMMUNITIES">
          <UserProfileCommunitiesTabPanel
            :member-communities="memberCommunities"
            :manager-communities="managerCommunities"
            :show-joined-section="showJoinedSection"
            :show-managed-section="showManagedSection"
            :member-community-list-has-more="memberCommunityListHasMore"
            :manager-community-list-has-more="managerCommunityListHasMore"
            :member-community-list-store="memberCommunityListStore"
            :manager-community-list-store="managerCommunityListStore"
            :is-communities-tab-ready="isCommunitiesTabReady"
            :is-communities-tab-empty="isCommunitiesTabEmpty"
            :can-link-to-detail="canLinkToDetail"
            :resolve-community-path="getCommunityPath"
          />
        </v-window-item>

        <v-window-item :value="USER_PROFILE_TAB_FOODS">
          <UserProfileFoodsTabPanel
            :paged-foods="pagedFoods"
            :food-loading="foodLoading"
            :food-error="foodError"
            :food-has-more="foodHasMore"
            :show-foods-tab-empty="showFoodsTabEmpty"
            :can-link-to-detail="canLinkToDetail"
            :resolve-event-path="getEventPath"
            :food-menu-image-src="foodMenuImageSrc"
            :mark-food-menu-image-failed="markFoodMenuImageFailed"
            :on-load-more="() => userFoodsStore.next()"
          />
        </v-window-item>
      </v-window>
    </v-col>
  </v-row>
</template>

<style scoped lang="scss">
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
</style>
