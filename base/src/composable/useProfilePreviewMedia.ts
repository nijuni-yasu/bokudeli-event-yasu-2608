import { ref, watch, type Ref } from 'vue'
import type { UserProfileFoodPreviewItem } from '@shokujii/common/apis/userProfile.js'
import {
  getCommunityIconStoragePath,
  getEventCoverStoragePath,
  getEventMenuImageStoragePath,
  getMenuImageStoragePath,
} from '@shokujii/common/utils/storagePaths.js'
import { convertStoragePathToURL } from '@shokujii/base/utils/storage.js'
import menuDefaultImage from '@shokujii/base/assets/images/menu_default.png'

export type ProfileFoodMenuImageSrcFn = (food: UserProfileFoodPreviewItem) => string
export type ProfileMarkFoodMenuImageFailedFn = (orderId: string) => void
export type ProfileEventCoverUrlFn = (communityId: string, eventId: string) => string | undefined
export type ProfileShowEventCoverImageFn = (communityId: string, eventId: string) => boolean
export type ProfileOnEventCoverErrorFn = (communityId: string, eventId: string) => void
export type ProfileCommunityIconUrlFn = (communityId: string) => string | undefined
export type ProfileCanLinkFriendPreviewFn = (friend: { is_linkable?: boolean }) => boolean

export const useProfilePreviewMedia = (previewDataVersion: Ref<unknown>) => {
  const failedFoodMenuImageIds = ref(new Set<string>())
  const failedEventCoverIds = ref(new Set<string>())

  watch(previewDataVersion, () => {
    failedFoodMenuImageIds.value = new Set()
    failedEventCoverIds.value = new Set()
  })

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
    failedFoodMenuImageIds.value = new Set([...failedFoodMenuImageIds.value, orderId])
  }

  const communityIconUrl = (communityId: string): string | undefined => {
    if (communityId === '') return undefined
    try {
      return convertStoragePathToURL(getCommunityIconStoragePath(communityId))
    } catch {
      return undefined
    }
  }

  const eventCoverUrl = (communityId: string, eventId: string): string | undefined => {
    if (communityId === '' || eventId === '') return undefined
    try {
      return convertStoragePathToURL(getEventCoverStoragePath(communityId, eventId))
    } catch {
      return undefined
    }
  }

  const eventCoverKey = (communityId: string, eventId: string): string => `${communityId}/${eventId}`

  const onEventCoverError = (communityId: string, eventId: string) => {
    const key = eventCoverKey(communityId, eventId)
    if (failedEventCoverIds.value.has(key)) return
    failedEventCoverIds.value = new Set([...failedEventCoverIds.value, key])
  }

  const showEventCoverImage = (communityId: string, eventId: string): boolean =>
    eventCoverUrl(communityId, eventId) != null && !failedEventCoverIds.value.has(eventCoverKey(communityId, eventId))

  return {
    foodMenuImageSrc,
    markFoodMenuImageFailed,
    communityIconUrl,
    eventCoverUrl,
    onEventCoverError,
    showEventCoverImage,
  }
}
