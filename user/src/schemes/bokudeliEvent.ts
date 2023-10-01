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
  eventPayment: 'user_advance' | 'user_on_day' | 'community_bill'
  // eventPayer: 'user' | 'community'
  // isPaymentAdvanceByUser: boolean
}

export const defaultPayment = {
  eventPayment: 'user_advance',
  // eventPayer: 'user',
  // isPaymentAdvanceByUser: true,
}

export default BokudeliEvent
