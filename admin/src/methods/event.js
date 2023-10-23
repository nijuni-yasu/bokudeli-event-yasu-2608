export function getEventUrl (communityAccount, eventId) {
  return `https://${process.env.VUE_APP_EVENT_HOST}/community/${communityAccount}/events/${eventId}`
}
