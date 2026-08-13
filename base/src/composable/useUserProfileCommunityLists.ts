import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { orderBy, where } from 'firebase/firestore'
import { useCommunityListStore, type CommunityListStore } from '@shokujii/base/stores/communityList.js'
import { getUserRef } from '@shokujii/base/stores/user.js'
import { profileListFilterToConstraints, type ProfileListFilter } from '@shokujii/base/stores/profileListFilter.js'
import {
  USER_PROFILE_TAB_COMMUNITIES,
  type UserProfileTabKey,
} from '@shokujii/base/components/profile/userProfileConstants.js'
import { useAutoLoadWhenEmpty } from '@shokujii/base/composable/useAutoLoadWhenEmpty.js'
import type { BokudeliCommunity, BokudeliCommunityMember } from '@shokujii/base/stores/community.js'

export type UserProfileCommunityListItem = {
  community: BokudeliCommunity
  members: BokudeliCommunityMember[]
}

export type UserProfileCommunityListsState = {
  memberCommunityListStore: Ref<CommunityListStore | null>
  managerCommunityListStore: Ref<CommunityListStore | null>
  memberCommunities: ComputedRef<UserProfileCommunityListItem[]>
  managerCommunities: ComputedRef<UserProfileCommunityListItem[]>
  showJoinedSection: ComputedRef<boolean>
  showManagedSection: ComputedRef<boolean>
  memberCommunityListHasMore: ComputedRef<boolean>
  managerCommunityListHasMore: ComputedRef<boolean>
  isCommunitiesTabEmpty: ComputedRef<boolean>
  isCommunitiesTabReady: ComputedRef<boolean>
}

export const useUserProfileCommunityLists = (options: {
  profileUserId: string
  profileFilter: Ref<ProfileListFilter>
  tabs: Ref<UserProfileTabKey>
  canInitTabStores: ComputedRef<boolean>
}): UserProfileCommunityListsState => {
  const communityFilterConstraints = computed(() => profileListFilterToConstraints(options.profileFilter.value))

  const memberCommunityListStore = ref<CommunityListStore | null>(null)
  const managerCommunityListStore = ref<CommunityListStore | null>(null)

  const initCommunityListStores = () => {
    memberCommunityListStore.value = null
    managerCommunityListStore.value = null
    if (!options.canInitTabStores.value || options.profileUserId === '') {
      return
    }
    const constraints = communityFilterConstraints.value
    memberCommunityListStore.value = useCommunityListStore(
      [
        ...constraints,
        where('members', 'array-contains', getUserRef(options.profileUserId)),
        orderBy('community_num_members', 'desc'),
      ],
      5,
    )
    managerCommunityListStore.value = useCommunityListStore(
      [
        ...constraints,
        where('managers', 'array-contains', getUserRef(options.profileUserId)),
        orderBy('community_num_members', 'desc'),
      ],
      5,
    )
  }

  watch(
    [options.canInitTabStores, () => options.profileUserId, communityFilterConstraints],
    () => {
      initCommunityListStores()
    },
    { immediate: true },
  )

  const memberCommunities = computed(() =>
    (memberCommunityListStore.value?.communityStores ?? []).flatMap((communityStore) => {
      if (communityStore.community == null || communityStore.members == null) {
        return []
      }
      return {
        community: communityStore.community,
        members: communityStore.members.filter((m): m is BokudeliCommunityMember => m != null),
      }
    }),
  )

  const managerCommunities = computed(() =>
    (managerCommunityListStore.value?.communityStores ?? []).flatMap((communityStore) => {
      if (communityStore.community == null || communityStore.members == null) {
        return []
      }
      return {
        community: communityStore.community,
        members: communityStore.members.filter((m): m is BokudeliCommunityMember => m != null),
      }
    }),
  )

  const showJoinedSection = computed(() => memberCommunities.value.length > 0)
  const showManagedSection = computed(() => managerCommunities.value.length > 0)

  const memberCommunityListHasMore = computed(() => {
    const store = memberCommunityListStore.value
    if (store == null) return false
    const loaded = store.communityStores?.length ?? 0
    const total = store.totalCount
    return total != null && loaded < total
  })

  const managerCommunityListHasMore = computed(() => {
    const store = managerCommunityListStore.value
    if (store == null) return false
    const loaded = store.communityStores?.length ?? 0
    const total = store.totalCount
    return total != null && loaded < total
  })

  const isCommunitiesTabEmpty = computed(
    () =>
      memberCommunities.value.length === 0 &&
      managerCommunities.value.length === 0 &&
      !memberCommunityListHasMore.value &&
      !managerCommunityListHasMore.value,
  )

  const isCommunitiesTabReady = computed(() => {
    const memberStore = memberCommunityListStore.value
    const managerStore = managerCommunityListStore.value
    if (memberStore == null || managerStore == null) {
      return false
    }
    return memberStore.totalCount !== null && managerStore.totalCount !== null
  })

  useAutoLoadWhenEmpty(
    [memberCommunities, managerCommunities, memberCommunityListHasMore, managerCommunityListHasMore, options.tabs],
    {
      shouldLoad: () => {
        if (!options.canInitTabStores.value) return false
        if (memberCommunityListStore.value == null || managerCommunityListStore.value == null) return false
        if (options.tabs.value !== USER_PROFILE_TAB_COMMUNITIES) return false
        if (memberCommunities.value.length === 0 && memberCommunityListHasMore.value) return true
        if (managerCommunities.value.length === 0 && managerCommunityListHasMore.value) return true
        return false
      },
      load: () => {
        const memberStore = memberCommunityListStore.value
        const managerStore = managerCommunityListStore.value
        if (memberStore == null || managerStore == null) return
        if (memberCommunities.value.length === 0 && memberCommunityListHasMore.value) {
          memberStore.next()
        }
        if (managerCommunities.value.length === 0 && managerCommunityListHasMore.value) {
          managerStore.next()
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
