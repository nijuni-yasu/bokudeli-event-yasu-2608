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
  paymentDisplay: string
  payer: 'user' | 'community'
  isPaymentAdvanceByUser: boolean
}

export const defaultPayment = {
  paymentDisplay: '参加者 事前決済',
  payer: 'user',
  isPaymentAdvanceByUser: true,
}

export default BokudeliEvent
