export function getCommunityCoverStoragePath(communityId: string): string {
  return `communities/${communityId}/community/cover`
}

export function getCommunityIconStoragePath(communityId: string): string {
  return `communities/${communityId}/community/icon`
}

export function getEventCoverStoragePath(communityId: string, eventId: string): string {
  return `communities/${communityId}/events/${eventId}/cover`
}

export function getEventMenuImageStoragePath(communityId: string, eventId: string, menuId: string): string {
  return `communities/${communityId}/events/${eventId}/menus/${menuId}/image`
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
