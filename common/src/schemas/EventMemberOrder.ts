import { DateTime } from 'luxon'
import { z } from 'zod'
import { TimestampSchema, EpochMillisSchema, optionalDeleteField } from './firebase/index.js'

const nowMillis = () => DateTime.now().toMillis()

export const EVENT_MEMBER_ORDER_STATUS_VALUES = ['in_cart', 'processing', 'ordered', 'canceled'] as const
export type EventMemberOrderStatusType = (typeof EVENT_MEMBER_ORDER_STATUS_VALUES)[number]

// ── EventMember ──

const EventMemberDbSchema = z.object({
  user_id: z.string().nonempty(),
  event_id: z.string().nonempty(),
  community_id: z.string().nonempty(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  enterprise_id: z.string().nullable().optional(),
})

const EventMemberAppSchema = z.object({
  user_id: z.string().nonempty(),
  event_id: z.string().nonempty(),
  community_id: z.string().nonempty(),
  created_at: EpochMillisSchema.optional(),
  updated_at: EpochMillisSchema.optional(),
  enterprise_id: z.string().nullable().optional(),
})

const convertMemberToDb = (member: EventMember) => {
  return {
    ...member,
    enterprise_id: member.enterprise_id ?? null,
    created_at: EpochMillisSchema.default(nowMillis()).parse(member.created_at),
    updated_at: nowMillis(),
  }
}

export class EventMember {
  readonly id: string
  user_id!: string
  event_id!: string
  community_id!: string
  created_at: number
  updated_at: number
  enterprise_id?: string | null

  constructor(userId: string, src: Partial<EventMember>) {
    Object.assign(this, EventMemberAppSchema.parse(src))
    this.id = userId
    this.created_at = EpochMillisSchema.default(nowMillis()).parse(src.created_at)
    this.updated_at = EpochMillisSchema.default(nowMillis()).parse(src.updated_at)
  }

  isValidForDatabase(): boolean {
    return EventMemberDbSchema.safeParse(convertMemberToDb(this)).success
  }

  toFirestore(): z.infer<typeof EventMemberDbSchema> {
    return EventMemberDbSchema.parse(convertMemberToDb(this))
  }
}

// ── EventMemberOrder ──

const EventMemberOrderDbSchema = z.object({
  order_id: z.string().nonempty(),
  user_id: z.string().nonempty(),
  event_id: z.string().nonempty(),
  community_id: z.string().nonempty(),
  status: z.enum(EVENT_MEMBER_ORDER_STATUS_VALUES),
  menu_id: z.string().nonempty(),
  menu_name: z.string().nonempty(),
  menu_price: z.number().int().positive(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  carted_at: TimestampSchema,
  stripe_id: z.string().nonempty().optional(),
  ordered_at: TimestampSchema.optional(),
  canceled_at: TimestampSchema.optional(),
  // processing 状態のときだけ存在する一時フィールド。ordered 確定時 / async_payment_failed で in_cart に戻す際に
  // クラス側で undefined を代入し、optionalDeleteField の transform で FieldValue.delete() に変換して Firestore から削除する。
  processing_at: optionalDeleteField(TimestampSchema),
  processing_payment_intent: optionalDeleteField(z.string().nonempty()),
  // async_payment_failed 適用後、同一 PaymentIntent に対する遅延到着の checkout.session.completed (unpaid) で
  // 再度 processing に上がるのを防ぐため記録する。新しい遅延決済（別 PI）開始時・ordered 確定時に削除する。
  failed_async_payment_intent: optionalDeleteField(z.string().nonempty()),
  pay_community_bill_off_amount: z.number().int().nonnegative().optional(),
  enterprise_id: z.string().nullable().optional(),
  pay_enterprise_subsidy_amount: z.number().int().nonnegative().optional(),
})

const EventMemberOrderAppSchema = z.object({
  order_id: z.string().nonempty(),
  user_id: z.string().nonempty(),
  event_id: z.string().nonempty(),
  community_id: z.string().nonempty(),
  status: z.enum(EVENT_MEMBER_ORDER_STATUS_VALUES).default('in_cart'),
  menu_id: z.string().nonempty(),
  menu_name: z.string().nonempty(),
  menu_price: z.number().int().positive(),
  stripe_id: z.string().optional(),
  carted_at: EpochMillisSchema.optional(),
  ordered_at: EpochMillisSchema.optional(),
  canceled_at: EpochMillisSchema.optional(),
  processing_at: EpochMillisSchema.optional(),
  processing_payment_intent: z.string().nonempty().optional(),
  failed_async_payment_intent: z.string().nonempty().optional(),
  pay_community_bill_off_amount: z.number().int().nonnegative().optional(),
  enterprise_id: z.string().nullable().optional(),
  pay_enterprise_subsidy_amount: z.number().int().nonnegative().optional(),
})

const convertOrderToDb = (order: EventMemberOrder) => {
  return {
    ...order,
    enterprise_id: order.enterprise_id ?? null,
    created_at: EpochMillisSchema.default(nowMillis()).parse(order.created_at),
    updated_at: nowMillis(),
  }
}

export class EventMemberOrder {
  readonly id: string
  readonly order_id: string
  user_id!: string
  event_id!: string
  community_id!: string
  status!: EventMemberOrderStatusType
  menu_id!: string
  menu_name!: string
  menu_price!: number
  created_at: number
  updated_at: number
  carted_at: number
  stripe_id?: string
  ordered_at?: number
  canceled_at?: number
  processing_at?: number
  processing_payment_intent?: string
  failed_async_payment_intent?: string
  pay_community_bill_off_amount?: number
  enterprise_id?: string | null
  pay_enterprise_subsidy_amount?: number

  constructor(orderId: string, src: Partial<EventMemberOrder>) {
    Object.assign(this, EventMemberOrderAppSchema.parse(src))
    this.id = orderId
    this.order_id = orderId
    this.created_at = EpochMillisSchema.default(nowMillis()).parse(src.created_at)
    this.carted_at = EpochMillisSchema.default(nowMillis()).parse(src.carted_at ?? src.created_at)
    this.updated_at = EpochMillisSchema.default(nowMillis()).parse(src.updated_at)
  }

  isValidForDatabase(): boolean {
    return EventMemberOrderDbSchema.safeParse(convertOrderToDb(this)).success
  }

  toFirestore(): z.infer<typeof EventMemberOrderDbSchema> {
    return EventMemberOrderDbSchema.parse(convertOrderToDb(this))
  }
}
