import { Timestamp } from 'firebase/firestore'

const eventPaymentLabels = ['参加者 事前決済', '参加者 当日払い', '主催者支払い'] as const
const eventPaymentTypes = ['user_advance', 'user_on_day', 'community_bill'] as const
export type EventPaymentType = (typeof eventPaymentTypes)[number]

export const eventPaymentItems = eventPaymentTypes.map((type, i) => {
  return { title: eventPaymentLabels[i], value: type }
})

type BokudeliEvent = {
  community_id: string
  community_name: string
  community_account: string
  event_id: string
  event_address: string
  event_cover_url: string
  event_desc: string
  event_deadline_datetime: Timestamp | null
  event_max_people: number
  event_name: string
  event_start_datetime: Timestamp | null
  event_end_datetime: Timestamp | null
  partner_id: string
  shop_id: string
  shop_name: string
  is_public: boolean
  event_payment: EventPaymentType
  // eventPayer: 'user' | 'community'
  // isPaymentAdvanceByUser: boolean
  organizer_fullname: string
  organizer_company: string
  organizer_phone_personal: string
  organizer_phone_company: string
  organizer_email: string
  organizer_memo: string
  created_at?: Timestamp
  updated_at?: Timestamp
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
  organizer_fullname: '',
  organizer_company: '',
  organizer_phone_personal: '',
  organizer_phone_company: '',
  organizer_email: '',
  organizer_memo: '',
})

export default BokudeliEvent
