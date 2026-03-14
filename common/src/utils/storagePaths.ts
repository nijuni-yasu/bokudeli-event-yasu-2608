export function getCommunityCoverStoragePath(communityId: string): string {
  return `communities/${communityId}/community/cover`
}

export function getCommunityIconStoragePath(communityId: string): string {
  return `communities/${communityId}/community/icon`
}

export function getEventCoverStoragePath(communityId: string, eventId: string): string {
  return `communities/${communityId}/events/${eventId}/cover`
}

export function getTinymceImageStoragePath(communityId: string, eventId: string, uuid: string): string {
  return `communities/${communityId}/events/${eventId}/tinymce/${uuid}`
}

export function generateTinymceImageStoragePath(communityId: string, eventId: string): string {
  const uuid = crypto.randomUUID()
  return getTinymceImageStoragePath(communityId, eventId, uuid)
}
