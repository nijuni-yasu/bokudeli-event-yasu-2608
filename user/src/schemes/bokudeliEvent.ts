type BokudeliEvent = {
  communityId: string
  communityName: string
  communityAccount: string
  eventId: string
  eventAddress: string
  eventCoverUrl: string
  eventDescription: string
  eventDeadline: Date | null
  eventMaxPeople: number
  eventName: string
  eventStartDatetime: Date | null
  eventEndDatetime: Date | null
  partnerId: string
  shopId: string
  shopName: string
  isPublic: boolean
}

export default BokudeliEvent
