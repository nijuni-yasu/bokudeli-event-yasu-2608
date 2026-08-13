import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { useDisplay } from 'vuetify'
import { useUserFriendsStore, type UserFriendsStore } from '@shokujii/base/stores/userFriends.js'
import type { UserFriendsSortBy } from '@shokujii/common/apis/userFriends.js'
import { User } from '@shokujii/common/schemas/User.js'
import {
  USER_PROFILE_FRIEND_PREVIEW_AVATAR_SIZE,
  USER_PROFILE_FRIENDS_PAGE_SIZE,
  USER_PROFILE_FRIENDS_PREVIEW_MAX_BY_BREAKPOINT,
} from '@shokujii/base/components/profile/userProfileConstants.js'
import { useAutoLoadWhenEmpty } from '@shokujii/base/composable/useAutoLoadWhenEmpty.js'

export const useUserProfileFriendsStores = (options: {
  profileUserId: string
  canInitTabStores: ComputedRef<boolean>
  friendSortBy: Ref<UserFriendsSortBy>
}) => {
  const display = useDisplay()

  const profileFriendsPreviewMaxTotal = computed(() => {
    if (display.mdAndUp.value) return USER_PROFILE_FRIENDS_PREVIEW_MAX_BY_BREAKPOINT.desktop
    if (display.smAndUp.value) return USER_PROFILE_FRIENDS_PREVIEW_MAX_BY_BREAKPOINT.tablet
    return USER_PROFILE_FRIENDS_PREVIEW_MAX_BY_BREAKPOINT.mobile
  })

  const userFriendsByMeetCountStore = ref<UserFriendsStore | null>(null)
  const userFriendsByLastMetStore = ref<UserFriendsStore | null>(null)

  watch(
    options.canInitTabStores,
    (granted) => {
      userFriendsByMeetCountStore.value = null
      userFriendsByLastMetStore.value = null
      if (!granted) return
      userFriendsByMeetCountStore.value = useUserFriendsStore(
        options.profileUserId,
        'meet_count',
        USER_PROFILE_FRIENDS_PAGE_SIZE,
      )
      userFriendsByLastMetStore.value = useUserFriendsStore(
        options.profileUserId,
        'last_met_at',
        USER_PROFILE_FRIENDS_PAGE_SIZE,
      )
    },
    { immediate: true },
  )

  const activeUserFriendsStore = computed(() =>
    options.friendSortBy.value === 'meet_count' ? userFriendsByMeetCountStore.value : userFriendsByLastMetStore.value,
  )
  const activeFriends = computed(() => activeUserFriendsStore.value?.friends ?? [])

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

  const showProfilePreviewFriendsEmpty = computed(
    () =>
      !profilePreviewFriendsLoading.value &&
      profilePreviewFriends.value.length === 0 &&
      !profilePreviewFriendsHasMore.value,
  )

  useAutoLoadWhenEmpty([profilePreviewFriends, profilePreviewFriendsHasMore, profilePreviewFriendsLoading], {
    shouldLoad: () =>
      profilePreviewFriends.value.length === 0 &&
      profilePreviewFriendsHasMore.value &&
      !profilePreviewFriendsLoading.value,
    load: loadMoreProfilePreviewFriends,
  })

  const friendUserOf = (item: { user_id: string; user_name: string; user_image_url: string }) =>
    new User(item.user_id, { user_name: item.user_name, user_image_url: item.user_image_url })

  const tryLoadMoreUserFriends = (isFriendTabActive: boolean) => {
    if (!isFriendTabActive) return
    const store = activeUserFriendsStore.value
    if (store == null) return
    if (store.hasMore && !store.loading) {
      store.next()
    }
  }

  return {
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
    friendUserOf,
    tryLoadMoreUserFriends,
  }
}
