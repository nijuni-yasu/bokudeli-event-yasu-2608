import { DocumentData, Timestamp } from 'firebase/firestore'
import _ from 'lodash'

const eventPaymentLabels = ['参加者 事前決済', '参加者 当日払い', '主催者支払い'] as const
const eventPaymentTypes = ['user_advance', 'user_on_day', 'community_bill'] as const
export type EventPaymentType = (typeof eventPaymentTypes)[number]

export const eventPaymentItems = eventPaymentTypes.map((type, i) => {
  return { title: eventPaymentLabels[i], value: type }
})

type RawEventStatusType = {
  value: 'in_draft' | 'applying_reservation' | 'accepting_order'
  shop_comment?: string
}

export type EventStatusType = Omit<RawEventStatusType, 'value'> & {
  value: RawEventStatusType['value'] | 'order_closed' | 'finished'
}

class BokudeliEvent {
  community_id: string = '';
  community_name: string = '';
  community_account: string = '';
  event_id: string = '';
  event_address: string = '';
  event_cover_url: string = '';
  event_desc: string = '';
  event_deadline_datetime: Timestamp | null = null;
  event_max_people: number = 0;
  event_name: string = '';
  event_start_datetime: Timestamp | null = null;
  event_end_datetime: Timestamp | null = null;
  partner_id: string = '';
  shop_id: string = '';
  shop_name: string = '';
  is_public: boolean = false;
  event_payment: EventPaymentType = 'user_advance';
  // eventPayer: 'user' | 'community'
  // isPaymentAdvanceByUser: boolean
  organizer_fullname: string = '';
  organizer_company: string = '';
  organizer_phone_personal: string = '';
  organizer_phone_company: string = '';
  organizer_email: string = '';
  organizer_memo: string = '';
  event_place: string = '';
  event_place_url: string = '';
  event_postalcode: string = '';

  created_at: Timestamp = Timestamp.now();
  updated_at: Timestamp | null = null;

  raw_event_status: RawEventStatusType = { value: 'in_draft' };

  get event_status(): EventStatusType {
    const now = new Date()
    if (this.event_end_datetime != null && this.event_end_datetime.toDate() < now) {
      return { value: 'finished' }
    } else if (this.event_deadline_datetime != null && this.event_deadline_datetime.toDate() < now) {
      return { value: 'order_closed' }
    } else {
      // event_status が string だった仕様の時もあったので、その対応
      return (typeof this.raw_event_status === 'string') ? { value: this.raw_event_status} as EventStatusType : this.raw_event_status
    }
  }

  set event_status(value: RawEventStatusType) {
    this.raw_event_status.value = value.value
  }

  constructor(eventData?: DocumentData) {
    if (eventData != null) {
      _.merge(
        this,
        _.assign(_.omit(eventData, ['event_status']), { raw_event_status: eventData.event_status })
      )
    }
  }

  convertToDocumentData(): DocumentData {
    const result = {
      event_status: this.raw_event_status,
    }
    return _.merge(result, _.omit(this, ['raw_event_status']))
  }
}

export default BokudeliEvent
