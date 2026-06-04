/*
 * User URLs
 */
export function getCommunityUrl(host: string, communityAccount: string) {
  return `https://${host}/c/${communityAccount}`
}

export function getEventUrl(host: string, communityAccount: string, eventId: string) {
  return `https://${host}/c/${communityAccount}/e/${eventId}`
}

export function getUserUrl(host: string, userId: string) {
  return `https://${host}/u/${userId}`
}

export const getCommunityInvitationUrl = (host: string, communityAccount: string, tokenId: string): string => {
  return `https://${host}/c/${communityAccount}/invites?t=${tokenId}`
}

/*
 * User Manage URLs
 */
export function getManageEventMemberUrl(host: string, eventId: string) {
  return `https://${host}/manage/event/${eventId}/member`
}

export function getManageEventInvoiceUrl(host: string, eventId: string, invoiceId: string) {
  return `https://${host}/manage/event/${eventId}/invoice?id=${invoiceId}`
}

export function getManageCommunityUrl(host: string, communityAccount: string) {
  return `https://${host}/manage/community/${communityAccount}/events`
}

/*
 * Partner URLs
 */
export function getPartnerOrderUrl(host: string, eventId: string) {
  return `https://${host}/order/${eventId}`
}
