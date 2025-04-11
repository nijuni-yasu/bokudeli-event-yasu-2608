export function getCommunityUrl(communityAccount) {
  return `https://${process.env.EVENT_HOST}/c/${communityAccount}`
}

export function getEventUrl(communityAccount, eventId) {
  return `https://${process.env.EVENT_HOST}/c/${communityAccount}/e/${eventId}`
}

export function getOrderUrl(eventId) {
  return `https://${process.env.ADMIN_HOST}/order/${eventId}`
}

export function getUserUrl(userId) {
  return `https://${process.env.EVENT_HOST}/u/${userId}`
}

export function getManageEventMemberUrl(eventId) {
  return `https://${process.env.EVENT_HOST}/manage/event/${eventId}/member`
}

export function getManageCommunityUrl(communityAccount) {
  return `https://${process.env.EVENT_HOST}/manage/${communityAccount}/events`
}
