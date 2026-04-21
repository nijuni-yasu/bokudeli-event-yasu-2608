import { z } from 'zod'
import {
  NonEmptyStringSchema,
  TimestampSchema,
  EpochMillisSchema,
  getRefFromPath,
  DocumentReference,
} from './firebase/index.js'
import { getStartOfDay } from '../utils/datetime.js'
import { computeEventFullAddress } from '../utils/splitAddress.js'

export const EVENT_PAYMENT_VALUES = ['user_advance', 'user_on_day', 'community_bill'] as const
export type EventPaymentType = (typeof EVENT_PAYMENT_VALUES)[number]

/**
 * DB上に保存されるイベントステータス
 * 新しいステータスを追加した場合、以下の対応も必要:
 * - eventMenuConverter.ts の shouldRegenerateFromPartnerMenus / shouldUpdateExistingMenusOnly に分岐を追加
 * - Event クラスの calculatedEventStatus を確認
 */
export const RAW_EVENT_STATUS_VALUES = [
  'in_draft',
  'applying_reservation',
  'applying_to_admin',
  'accepting_order',
] as const
export type RawEventStatusType = (typeof RAW_EVENT_STATUS_VALUES)[number]

export const EVENT_STATUS_VALUES = [...RAW_EVENT_STATUS_VALUES, 'order_closed', 'finished', 'full'] as const
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
export const EventDbSchema = z.object({
  // Mandatory
  event_id: z.string().nonempty(),
  community_id: z.string().nonempty(),
  community_name: z.string().nonempty(),
  community_account: z.string().nonempty(),
  event_postalcode: z.string().regex(/^\d{7}$/),
  // event_address はレガシー用。新規保存では書き込まない（EventAppSchema で default('')）
  event_address_base: z.string().nonempty(),
  event_address_detail: z.string(),
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
    shop_comment: NonEmptyStringSchema.optional(),
  }),

  is_deleted: z.boolean(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  created_by: z.string().nonempty(),
  updated_by: z.string().nonempty(),
  members: z.array(z.instanceof(DocumentReference)),
  event_num_members: z.number().int().min(0),

  // Optional
  bill_fullname: NonEmptyStringSchema.optional(),
  bill_email: NonEmptyStringSchema.optional(),
  event_place: NonEmptyStringSchema.optional(),
  event_place_url: NonEmptyStringSchema.optional(),
  event_desc: NonEmptyStringSchema.optional(),
  event_sns_hash_tag: NonEmptyStringSchema.optional(),
  organizer_phone_company: NonEmptyStringSchema.optional(),
  subdomain_tags: z.array(z.string()).optional(),
  sent_new_event_mail_at: TimestampSchema.optional(),
  sent_popular_event_mail_at: TimestampSchema.optional(),
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
  event_start_datetime: EpochMillisSchema.default(
    getStartOfDay(Date.now() + 1000 * 60 * 60 * 24 * 14) + 1000 * 60 * 60 * 12,
  ),
  event_end_datetime: EpochMillisSchema.default(
    getStartOfDay(Date.now() + 1000 * 60 * 60 * 24 * 14) + 1000 * 60 * 60 * 13,
  ),
  event_deadline_datetime: EpochMillisSchema.default(
    getStartOfDay(Date.now() + 1000 * 60 * 60 * 24 * 11) + 1000 * 60 * 60 * 12,
  ),
  is_public: z.boolean().default(true),
  event_payment: z.enum(EVENT_PAYMENT_VALUES).default('user_advance'),
  event_max_people: z.number().int().positive().default(25),
  event_status: z
    .object({
      value: z.enum(RAW_EVENT_STATUS_VALUES).default('in_draft'),
      shop_comment: z.string().default(''),
    })
    .default({
      value: 'in_draft',
      shop_comment: '',
    }),
  is_deleted: z.boolean().default(false),
  members: z.array(MemberIdSchema).default([]),
  event_postalcode: z.string().default(''),
  event_address: z.string().default(''),
  event_address_base: z.string().default(''),
  event_address_detail: z.string().default(''),
  partner_id: z.string().default(''),
  shop_id: z.string().default(''),
  shop_name: z.string().default(''),
  event_name: z.string().default(''),
  event_cover_url: z.string().default(''),
  subdomain_tags: z.array(z.string()).default([]),
  bill_fullname: z.string().default(''),
  bill_email: z.string().default(''),
  event_place: z.string().default(''),
  event_place_url: z.string().default(''),
  event_desc: z.string().default(''),
  event_sns_hash_tag: z.string().default(''),
  organizer_phone_company: z.string().default(''),
  organizer_fullname: z.string().default(''),
  organizer_company: z.string().default(''),
  organizer_email: z.string().default(''),
  organizer_phone_personal: z.string().default(''),
  organizer_memo: z.string().default(''),
  sent_new_event_mail_at: EpochMillisSchema.optional(),
  sent_popular_event_mail_at: EpochMillisSchema.optional(),
})

const convertToDb = (event: Event, updated_by: string) => {
  return {
    ...event,
    created_at: EpochMillisSchema.default(Date.now()).parse(event.created_at),
    created_by: event.created_by ?? updated_by,
    updated_at: Date.now(),
    updated_by,
    members: event.members.map((id) => getRefFromPath(`users/${id}`)),
    event_num_members: event.members.length,
  }
}

export class Event {
  readonly id: string
  readonly event_id!: string
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
    shop_comment: string
  }
  is_deleted!: boolean

  event_postalcode!: string
  event_address!: string
  event_address_base!: string
  event_address_detail!: string
  partner_id!: string
  shop_id!: string
  shop_name!: string
  event_name!: string
  event_cover_url!: string
  event_desc!: string
  organizer_fullname!: string
  organizer_company!: string
  organizer_phone_personal!: string
  organizer_phone_company!: string
  organizer_email!: string
  organizer_memo!: string
  event_sns_hash_tag!: string
  bill_fullname!: string
  bill_email!: string

  event_place!: string
  event_place_url!: string
  members!: string[]
  subdomain_tags!: string[]

  created_at: number
  created_by?: string
  updated_at: number
  updated_by?: string
  sent_new_event_mail_at?: number
  sent_popular_event_mail_at?: number

  constructor(id: string, src: Partial<Event>) {
    Object.assign(this, EventAppSchema.parse({ ...src, event_id: id }))
    this.id = id
    this.created_at = EpochMillisSchema.default(Date.now()).parse(src.created_at)
    this.updated_at = Date.now()
  }

  get fullAddress(): string {
    return computeEventFullAddress({
      event_address: this.event_address,
      event_address_base: this.event_address_base,
      event_address_detail: this.event_address_detail,
    })
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

  isValidForDatabase(updateUserId: string): boolean {
    return EventDbSchema.safeParse(convertToDb(this, updateUserId)).success
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toFirestore(updateUserId: string): any {
    return EventDbSchema.parse(convertToDb(this, updateUserId))
  }
}
