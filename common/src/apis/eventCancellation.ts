export type CancelEventRequest = {
  communityId: string
  eventId: string
  cancelReason: string
}

export type CancelEventResponse = {
  success: boolean
  event_id: string
}
