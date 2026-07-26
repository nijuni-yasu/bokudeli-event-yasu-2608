import { ref, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { UserFriendsSortBy } from '@shokujii/common/apis/userFriends.js'
import {
  resolveUserProfileTabFromQuery,
  USER_PROFILE_TAB_FRIENDS,
  USER_PROFILE_TAB_PROFILE,
  type UserProfileTabKey,
} from '@shokujii/base/components/profile/userProfileConstants.js'

const resolveFriendSortFromQuery = (rawSort: unknown): UserFriendsSortBy => {
  const sort = String(rawSort ?? '')
  if (sort === 'last_met_at') return 'last_met_at'
  return 'meet_count'
}

const queryTabFor = (tab: UserProfileTabKey): string | undefined => (tab === USER_PROFILE_TAB_PROFILE ? undefined : tab)

const querySortFor = (tab: UserProfileTabKey, sort: UserFriendsSortBy): string | undefined => {
  if (tab !== USER_PROFILE_TAB_FRIENDS || sort === 'meet_count') return undefined
  return sort
}

export const useUserProfileTabSync = (options: {
  profileUserId: string
  syncFriendSortToUrl: boolean
  friendSortBy: Ref<UserFriendsSortBy>
  loginUserId: Ref<string | undefined>
  onTabChanged?: (tab: UserProfileTabKey) => void
}) => {
  const route = useRoute()
  const router = useRouter()

  const tabs = ref<UserProfileTabKey>(resolveUserProfileTabFromQuery(String(route.query.tab ?? '')))

  const isFriendTab = (tab: UserProfileTabKey | null) => tab === USER_PROFILE_TAB_FRIENDS

  const syncTabToUrl = (tab: UserProfileTabKey) => {
    const nextTab = queryTabFor(tab)
    const currentTab = route.query.tab == null || String(route.query.tab) === '' ? undefined : String(route.query.tab)
    const nextSort = options.syncFriendSortToUrl ? querySortFor(tab, options.friendSortBy.value) : undefined
    const currentSort =
      route.query.sort == null || String(route.query.sort) === '' ? undefined : String(route.query.sort)
    if (currentTab === nextTab && (!options.syncFriendSortToUrl || currentSort === nextSort)) return
    const query: Record<string, string | string[] | undefined> = { ...route.query }
    if (nextTab === undefined) {
      delete query.tab
    } else {
      query.tab = nextTab
    }
    if (options.syncFriendSortToUrl) {
      if (nextSort === undefined) {
        delete query.sort
      } else {
        query.sort = nextSort
      }
    }
    void router.replace({ query })
  }

  watch(
    () =>
      [
        route.query.tab,
        ...(options.syncFriendSortToUrl ? [route.query.sort] : []),
        options.loginUserId.value,
        options.profileUserId,
      ] as const,
    (values) => {
      const rawTab = values[0]
      const rawSort = options.syncFriendSortToUrl ? values[1] : undefined
      const resolved = resolveUserProfileTabFromQuery(String(rawTab ?? ''))
      if (tabs.value !== resolved) {
        tabs.value = resolved
      }
      if (options.syncFriendSortToUrl && isFriendTab(resolved)) {
        const resolvedSort = resolveFriendSortFromQuery(rawSort)
        if (options.friendSortBy.value !== resolvedSort) {
          options.friendSortBy.value = resolvedSort
        }
      }
    },
  )

  watch(tabs, (tab) => {
    syncTabToUrl(tab)
    options.onTabChanged?.(tab)
  })

  watch(options.friendSortBy, () => {
    if (options.syncFriendSortToUrl) {
      syncTabToUrl(tabs.value)
    }
    options.onTabChanged?.(tabs.value)
  })

  const goToTab = (tab: UserProfileTabKey) => {
    tabs.value = tab
  }

  return {
    tabs,
    goToTab,
    isFriendTab,
    syncTabToUrl,
    resolveFriendSortFromQuery: () => resolveFriendSortFromQuery(route.query.sort),
  }
}
