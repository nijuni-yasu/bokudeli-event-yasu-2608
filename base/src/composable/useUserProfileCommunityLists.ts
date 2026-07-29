import { computed, type Ref } from 'vue'
import { orderBy, where } from 'firebase/firestore'
import { useCommunityListStore } from '@shokujii/base/stores/communityList.js'
import { getUserRef } from '@shokujii/base/stores/user.js'
import { profileListFilterToConstraints, type ProfileListFilter } from '@shokujii/base/stores/profileListFilter.js'
import {
  USER_PROFILE_TAB_COMMUNITIES,
  type UserProfileTabKey,
} from '@shokujii/base/components/profile/userProfileConstants.js'
import { useAutoLoadWhenEmpty } from '@shokujii/base/composable/useAutoLoadWhenEmpty.js'

export const useUserProfileCommunityLists = (options: {
  profileUserId: string
  profileFilter: Ref<ProfileListFilter>
  tabs: Ref<UserProfileTabKey>
}) => {
  const communityFilterConstraints = computed(() => profileListFilterToConstraints(options.profileFilter.value))

  const memberCommunityListStore = computed(() =>
    useCommunityListStore(
      [
        ...communityFilterConstraints.value,
        where('members', 'array-contains', getUserRef(options.profileUserId)),
        orderBy('community_num_members', 'desc'),
      ],
      5,
    ),
  )

  const managerCommunityListStore = computed(() =>
    useCommunityListStore(
      [
        ...communityFilterConstraints.value,
        where('managers', 'array-contains', getUserRef(options.profileUserId)),
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

  useAutoLoadWhenEmpty(
    [memberCommunities, managerCommunities, memberCommunityListHasMore, managerCommunityListHasMore, options.tabs],
    {
      shouldLoad: () => {
        if (options.tabs.value !== USER_PROFILE_TAB_COMMUNITIES) return false
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

  return {
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
  }
}
