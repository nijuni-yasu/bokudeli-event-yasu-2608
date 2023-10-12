type BokudeliEvent = {
  community_id: string
  community_name: string
  community_account: string
  event_id: string
  event_address: string
  event_cover_url: string
  event_desc: string
  event_deadline_datetime: Date | null
  event_max_people: number
  event_name: string
  event_start_datetime: Date | null
  event_end_datetime: Date | null
  partner_id: string
  shop_id: string
  shop_name: string
  is_public: boolean
  event_payment: 'user_advance' | 'user_on_day' | 'community_bill'
  // eventPayer: 'user' | 'community'
  // isPaymentAdvanceByUser: boolean
}

export const createEmptyEvent = (): BokudeliEvent => ({
  community_id: '',
  community_name: '',
  community_account: '',
  event_id: '',
  event_address: '',
  event_cover_url: '',
  event_desc: '',
  event_deadline_datetime: null,
  event_max_people: 0,
  event_name: '',
  event_start_datetime: null,
  event_end_datetime: null,
  partner_id: '',
  shop_id: '',
  shop_name: '',
  is_public: false,
  event_payment: 'user_advance',
})

export default BokudeliEvent
