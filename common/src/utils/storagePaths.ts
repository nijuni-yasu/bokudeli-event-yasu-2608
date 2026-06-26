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

/** EventMenu 画像が格納される prefix（末尾スラッシュ付き）。deleteFiles 用。 */
export function getEventMenuImagesPrefix(communityId: string, eventId: string): string {
  return `communities/${communityId}/events/${eventId}/menus/`
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

export function getEnterpriseLogoStoragePath(enterpriseId: string): string {
  return `enterprises/${enterpriseId}/logo/company-logo.png`
}

export function getEnterpriseMemberAvatarStoragePath(enterpriseId: string, userId: string): string {
  return `enterprises/${enterpriseId}/members/${userId}/avatar.png`
}

export function getEnterpriseCommunityCoverStoragePath(enterpriseId: string, communityId: string): string {
  return `enterprises/${enterpriseId}/communities/${communityId}/cover.png`
}

export function getEnterpriseEventPhotoStoragePath(
  enterpriseId: string,
  communityId: string,
  eventId: string,
  photoId: string,
): string {
  return `enterprises/${enterpriseId}/communities/${communityId}/events/${eventId}/photos/${photoId}`
}
