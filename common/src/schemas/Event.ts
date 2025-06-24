import { z } from 'zod'
import {
  NonEmptyStringSchema,
  TimestampSchema,
  EpochMillisSchema,
  getRefFromPath,
  DocumentReference,
} from './firebase/index.js'

export const EVENT_PAYMENT_VALUES = ['user_advance', 'user_on_day', 'community_bill'] as const
export type EventPaymentType = (typeof EVENT_PAYMENT_VALUES)[number]

const RAW_EVENT_STATUS_VALUES = ['in_draft', 'applying_reservation', 'applying_to_admin', 'accepting_order'] as const
type RawEventStatusType = (typeof RAW_EVENT_STATUS_VALUES)[number]

const EVENT_STATUS_VALUES = [...RAW_EVENT_STATUS_VALUES, 'order_closed', 'finished', 'full'] as const
export type EventStatusType = (typeof EVENT_STATUS_VALUES)[number]

// Member を DocumentReference から ID に変換するための Schema
// 実装として良くはない
const MemberIdSchema = z
  .string()
  .nonempty()
  .or(z.custom<typeof DocumentReference>())
  .transform((value) => (typeof value === 'string' ? value : (value as typeof DocumentReference).id))

/**
 * データベース保存時に適用される Schema
 *
 * TODO: postalcode は utils/validatier を使用するように
 * TODO: postalcode 以外の URL 等もバリデーションする
 */
const EventDbSchema = z.object({
  // Mandatory
  event_id: z.string().nonempty(),
  community_id: z.string().nonempty(),
  community_name: z.string().nonempty(),
  community_account: z.string().nonempty(),
  event_postalcode: z.string().regex(/^\d{7}$/),
  event_address: z.string().nonempty(),
  event_start_datetime: TimestampSchema,
  event_end_datetime: TimestampSchema,
  event_deadline_datetime: TimestampSchema,
  partner_id: z.string().nonempty(),
  shop_id: z.string().nonempty(),
  shop_name: z.string().nonempty(),
  event_name: z.string().nonempty(),
  event_cover_url: z.string().nonempty(),
  event_payment: z.enum(EVENT_PAYMENT_VALUES),
  event_max_people: z.number().int().positive(),
  organizer_fullname: z.string().nonempty(),
  organizer_company: z.string().nonempty(),
  organizer_email: z.string().nonempty(),
  organizer_phone_personal: z.string().nonempty(),
  organizer_memo: z.string().nonempty(),
  is_public: z.boolean(),
  event_status: z.object({
    value: z.enum(RAW_EVENT_STATUS_VALUES),
    shop_comment: z.string().optional(),
  }),
  bill_fullname: z.string().nonempty(),
  bill_email: z.string().nonempty(),

  is_deleted: z.boolean(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  created_by: z.string().nonempty(),
  updated_by: z.string().nonempty(),
  members: z.array(z.instanceof(DocumentReference)),
  event_num_members: z.number().int().min(0),

  // Optional
  event_place: NonEmptyStringSchema.optional(),
  event_place_url: NonEmptyStringSchema.optional(),
  event_desc: NonEmptyStringSchema.optional(),
  event_sns_hash_tag: NonEmptyStringSchema.optional(),
  organizer_phone_company: NonEmptyStringSchema.optional(),
  subdomain_tags: z.array(z.string()).optional(),
})

/**
 * Event Object 新規作成時に適用される Schema
 * Event Class の定義と重複するが、良い手がない
 */
const EventAppSchema = z.object({
  // Mandatory
  event_id: z.string().nonempty(),
  community_id: z.string().nonempty(),
  community_name: z.string().nonempty(),
  community_account: z.string().nonempty(),
  // Default
  event_start_datetime: EpochMillisSchema.default(Date.now()),
  event_end_datetime: EpochMillisSchema.default(Date.now() + 1000 * 60 * 60 * 24),
  event_deadline_datetime: EpochMillisSchema.default(Date.now() + 1000 * 60 * 60 * 24 * 3),
  is_public: z.boolean().default(true),
  event_payment: z.enum(EVENT_PAYMENT_VALUES).default('user_advance'),
  event_max_people: z.number().int().positive().default(25),
  event_status: z.object({
    value: z.enum(RAW_EVENT_STATUS_VALUES).default('in_draft'),
    shop_comment: z.string().optional(),
  }),
  is_deleted: z.boolean().default(false),
  members: z.array(MemberIdSchema).default([]),

  // Optional
  event_postalcode: z
    .string()
    .regex(/^\d{7}$/)
    .optional(),
  event_address: z.string().nonempty().optional(),
  partner_id: z.string().nonempty().optional(),
  shop_id: z.string().nonempty().optional(),
  shop_name: z.string().nonempty().optional(),
  event_name: z.string().nonempty().optional(),
  event_cover_url: z.string().nonempty().optional(),
  organizer_fullname: z.string().nonempty().optional(),
  organizer_company: z.string().nonempty().optional(),
  organizer_email: z.string().nonempty().optional(),
  organizer_phone_personal: z.string().nonempty().optional(),
  organizer_memo: z.string().nonempty().optional(),
  subdomain_tags: z.array(z.string()).optional(),

  // 本来は nonempty をつけたいが、現状 empty 状態のデータがあるため、nonempty を外す
  bill_fullname: z.string().optional(),
  bill_email: z.string().optional(),
  event_place: z.string().optional(),
  event_place_url: z.string().optional(),
  event_desc: z.string().optional(),
  event_sns_hash_tag: z.string().optional(),
  organizer_phone_company: z.string().optional(),
})

export class Event {
  readonly id: string
  readonly event_id: string
  community_id!: string
  community_name!: string
  community_account!: string
  event_start_datetime!: number
  event_end_datetime!: number
  event_deadline_datetime!: number
  is_public!: boolean
  event_payment!: EventPaymentType
  event_max_people!: number
  event_status!: {
    value: RawEventStatusType
    shop_comment: string | undefined
  }
  is_deleted!: boolean

  event_postalcode: string = ''
  event_address: string = ''
  partner_id: string = ''
  shop_id: string = ''
  shop_name: string = ''
  event_name: string = ''
  event_cover_url: string = ''
  event_desc: string = ''
  organizer_fullname: string = ''
  organizer_company: string = ''
  organizer_phone_personal: string = ''
  organizer_phone_company: string = ''
  organizer_email: string = ''
  organizer_memo: string = ''
  event_sns_hash_tag: string = ''
  bill_fullname: string = ''
  bill_email: string = ''

  event_place: string = ''
  event_place_url: string = ''
  members: string[] = []
  subdomain_tags: string[] = []

  created_at: number
  created_by?: string
  updated_at: number
  updated_by?: string

  constructor(id: string, src: Partial<Event>) {
    Object.assign(this, EventAppSchema.parse(src))
    this.id = id
    this.event_id = id
    this.created_at = EpochMillisSchema.default(Date.now()).parse(src.created_at)
    this.updated_at = Date.now()
  }

  /**
   * event_status を時間によって更新する getter
   * @returns {EventStatusType}
   *
   * TODO: user, admin, manager にも同等のコードが存在するので、こちらを利用するように変更する
   */
  get calculatedEventStatus(): EventStatusType {
    const event_end_datetime = this.event_end_datetime
    const event_deadline_datetime = this.event_deadline_datetime
    const rawStatus = this.event_status.value
    if (rawStatus === 'accepting_order') {
      const now = Date.now()
      if (event_end_datetime < now) {
        return 'finished'
      } else if (event_deadline_datetime < now) {
        return 'order_closed'
      } else if (this.members.length >= this.event_max_people) {
        return 'full'
      }
    }
    return rawStatus
  }

  addMember(userId: string) {
    if (this.members.includes(userId)) {
      return
    }
    this.members.push(userId)
  }

  removeMember(userId: string) {
    this.members = this.members.filter((id) => id !== userId)
  }

  private getDb(updated_by: string) {
    return {
      ...this,
      created_at: EpochMillisSchema.default(Date.now()).parse(this.created_at),
      created_by: this.created_by ?? updated_by,
      updated_at: Date.now(),
      updated_by,
      members: this.members.map((id) => getRefFromPath(`users/${id}`)),
      event_num_members: this.members.length,
    }
  }

  isValidForDatabase(updateUserId: string): boolean {
    return EventDbSchema.safeParse(this.getDb(updateUserId)).success
  }

  toFirestore(updateUserId: string): any {
    return EventDbSchema.parse(this.getDb(updateUserId))
  }
}
