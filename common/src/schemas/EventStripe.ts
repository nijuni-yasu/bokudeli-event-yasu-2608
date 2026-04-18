import { DateTime } from 'luxon'
import { z } from 'zod'
import { TimestampSchema, EpochMillisSchema, NonEmptyStringSchema } from './firebase/index.js'

const nowMillis = () => DateTime.now().toMillis()

const StripeMenuSchema = z.object({
  menu_name: z.string().nonempty(),
  menu_price: z.number().int().nonnegative(),
  count: z.number().int().positive(),
})
export type StripeMenuType = z.infer<typeof StripeMenuSchema>

const RefundEntryDbSchema = z.object({
  refund_id: z.string().nonempty(),
  amount: z.number().int().positive(),
  order_ids: z.array(z.string().nonempty()),
  created_at: TimestampSchema,
})

const RefundEntryAppSchema = z.object({
  // 過去のデータ移行時に refund_id が記録されていない返金エントリが存在するため optional
  refund_id: z.string().nonempty().optional(),
  amount: z.number().int().positive(),
  order_ids: z.array(z.string().nonempty()),
  created_at: EpochMillisSchema,
})
export type RefundEntryType = z.infer<typeof RefundEntryAppSchema>

const EventStripeDbSchema = z.object({
  stripe_id: z.string().nonempty(),
  order_ids: z.array(z.string().nonempty()),
  user_id: z.string().nonempty(),
  event_id: z.string().nonempty(),
  community_id: z.string().nonempty(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  menus: z.array(StripeMenuSchema),
  payment_intent: z.string().nonempty(),
  pay_amount: z.number().int().nonnegative(),
  receipt_number: NonEmptyStringSchema.optional(),
  refunds: z.array(RefundEntryDbSchema),
  pay_community_bill_amount: z.number().int().optional(),
  pay_user_fee_amount: z.number().int().optional(),
})

const EventStripeAppSchema = z.object({
  stripe_id: z.string().nonempty(),
  order_ids: z.array(z.string().nonempty()),
  user_id: z.string().nonempty(),
  event_id: z.string().nonempty(),
  community_id: z.string().nonempty(),
  menus: z.array(StripeMenuSchema),
  payment_intent: z.string().nonempty(),
  pay_amount: z.number().int().nonnegative(),
  receipt_number: z.string().optional(),
  refunds: z.array(RefundEntryAppSchema).default([]),
  pay_community_bill_amount: z.number().int().optional(),
  pay_user_fee_amount: z.number().int().optional(),
})

const convertToDb = (stripe: EventStripe) => {
  return {
    ...stripe,
    created_at: EpochMillisSchema.default(nowMillis()).parse(stripe.created_at),
    updated_at: nowMillis(),
  }
}

export class EventStripe {
  readonly id: string
  stripe_id!: string
  order_ids!: string[]
  user_id!: string
  event_id!: string
  community_id!: string
  created_at: number
  updated_at: number
  menus!: StripeMenuType[]
  payment_intent!: string
  pay_amount!: number
  receipt_number?: string
  refunds!: RefundEntryType[]
  pay_community_bill_amount?: number
  pay_user_fee_amount?: number

  constructor(stripeId: string, src: Partial<EventStripe>) {
    Object.assign(this, EventStripeAppSchema.parse(src))
    this.id = stripeId
    this.stripe_id = stripeId
    this.created_at = EpochMillisSchema.default(nowMillis()).parse(src.created_at)
    this.updated_at = EpochMillisSchema.default(nowMillis()).parse(src.updated_at)
  }

  isValidForDatabase(): boolean {
    return EventStripeDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof EventStripeDbSchema> {
    return EventStripeDbSchema.parse(convertToDb(this))
  }
}
