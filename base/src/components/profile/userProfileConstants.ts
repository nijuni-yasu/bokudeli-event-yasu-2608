import { convertToDate, convertToDateWeekdayShort } from '@shokujii/common/utils/datetime.js'

export const formatProfilePreviewDate = (epochMillis: number, kind: 'withWeekday' | 'date' = 'date'): string => {
  if (epochMillis === 0) return ''
  return kind === 'withWeekday' ? convertToDateWeekdayShort(epochMillis) : convertToDate(epochMillis)
}

export const USER_PROFILE_TAB_PROFILE = 'profile'
export const USER_PROFILE_TAB_FRIENDS = 'friends'
export const USER_PROFILE_TAB_EVENTS = 'events'
export const USER_PROFILE_TAB_COMMUNITIES = 'communities'
export const USER_PROFILE_TAB_FOODS = 'foods'

export type UserProfileTabKey =
  | typeof USER_PROFILE_TAB_PROFILE
  | typeof USER_PROFILE_TAB_FRIENDS
  | typeof USER_PROFILE_TAB_EVENTS
  | typeof USER_PROFILE_TAB_COMMUNITIES
  | typeof USER_PROFILE_TAB_FOODS

export const USER_PROFILE_FRIEND_PREVIEW_AVATAR_SIZE = 54

export const USER_PROFILE_FRIENDS_PREVIEW_MAX_BY_BREAKPOINT = {
  mobile: 30,
  tablet: 100,
  desktop: 150,
} as const

export const USER_PROFILE_FRIENDS_PAGE_SIZE = 30

export type UserProfileStatKey =
  | 'participated_event'
  | 'friend_count'
  | 'joined_community'
  | 'managed_community'
  | 'ordered_food'

export type UserProfileStatRow = {
  key: UserProfileStatKey
  label: string
  value: number
}

export const statTabForKey = (key: UserProfileStatKey): UserProfileTabKey => {
  switch (key) {
    case 'friend_count':
      return USER_PROFILE_TAB_FRIENDS
    case 'participated_event':
      return USER_PROFILE_TAB_EVENTS
    case 'joined_community':
    case 'managed_community':
      return USER_PROFILE_TAB_COMMUNITIES
    case 'ordered_food':
      return USER_PROFILE_TAB_FOODS
  }
}

export const resolveUserProfileTabFromQuery = (rawTab: string): UserProfileTabKey => {
  switch (rawTab) {
    case USER_PROFILE_TAB_FRIENDS:
    case USER_PROFILE_TAB_EVENTS:
    case USER_PROFILE_TAB_COMMUNITIES:
    case USER_PROFILE_TAB_FOODS:
      return rawTab
    default:
      return USER_PROFILE_TAB_PROFILE
  }
}
