import { type Event } from '../schemas/Event.js'

export function getCommunityCoverStoragePath(communityId: string): string {
  return `communities/${communityId}/community/cover`
}

export function getCommunityIconStoragePath(communityId: string): string {
  return `communities/${communityId}/community/icon`
}

export function getCommunityAlbumItemStoragePath(communityId: string, albumItemId: string): string {
  return `communities/${communityId}/album_items/${albumItemId}`
}

export function getEventCoverStoragePath(communityId: string, eventId: string): string {
  return `communities/${communityId}/events/${eventId}/cover`
}

export function getEventMenuImageStoragePath(communityId: string, eventId: string, menuId: string): string
export function getEventMenuImageStoragePath(event: Event, menuId: string): string
export function getEventMenuImageStoragePath(arg1: string | Event, arg2: string, arg3?: string): string {
  if (typeof arg1 === 'string' && typeof arg3 === 'string') {
    return `communities/${arg1}/events/${arg2}/menus/${arg3}/image`
  } else if (typeof arg1 === 'object') {
    if (arg1.event_status.value === 'accepting_order') {
      return `communities/${arg1.community_id}/events/${arg1.event_id}/menus/${arg2}/image`
    } else {
      if (arg1.partner_id === '') {
        throw new Error('partner_id is not set')
      }
      return getMenuImageStoragePath(arg1.partner_id, arg2)
    }
  } else {
    throw new Error('Invalid arguments')
  }
}

export function getTinymceImageStoragePath(communityId: string, eventId: string, uuid: string): string {
  return `communities/${communityId}/events/${eventId}/tinymce/${uuid}`
}

export function generateTinymceImageStoragePath(communityId: string, eventId: string): string {
  const uuid = crypto.randomUUID()
  return getTinymceImageStoragePath(communityId, eventId, uuid)
}

export function getShopCoverStoragePath(partnerId: string, shopId: string): string {
  return `partners/${partnerId}/shops/${shopId}/cover`
}

export function getMenuImageStoragePath(partnerId: string, menuId: string): string {
  return `partners/${partnerId}/menus/${menuId}/image`
}

export function getUserImageStoragePath(userId: string, thumbnailSize?: 'small' | 'medium' | 'large'): string {
  return thumbnailSize == null ? `users/${userId}/avatar` : `users/${userId}/avatar_thumb_${thumbnailSize}`
}
