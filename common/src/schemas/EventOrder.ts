import { z } from 'zod'
import { TimestampSchema, EpochMillisSchema, NonEmptyStringSchema } from './firebase/index.js'

export const EVENT_ORDER_STATUS_VALUES = ['in_cart', 'ordered', 'canceled'] as const
export type EventOrderStatusType = (typeof EVENT_ORDER_STATUS_VALUES)[number]

const OrderMenuSchema = z.object({
  count: z.number().int().positive(),
  partner_id: z.string().nonempty(),
  menu_id: z.string().nonempty(),
  name: z.string().nonempty(),
  price: z.number().int().positive(),
  note: NonEmptyStringSchema,
  imageUrl: z.string().url().nonempty(),
})
export type OrderMenuType = z.infer<typeof OrderMenuSchema>

const EventOrderDbSchema = z.object({
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  carted_at: TimestampSchema,
  community_account: z.string().nonempty(),
  community_id: z.string().nonempty(),
  event_id: z.string().nonempty(),
  order_id: z.string().nonempty(),
  user_id: z.string().nonempty(),
  menus: z.array(OrderMenuSchema).nonempty(),
  status: z.enum(EVENT_ORDER_STATUS_VALUES),
  // Optional
  ordered_at: TimestampSchema.optional(),
  canceled_at: TimestampSchema.optional(),
  payment_intent: z.string().nonempty().optional(),
  receipt_number: NonEmptyStringSchema.optional(),
})

const EventOrderAppSchema = z.object({
  // Mandatory
  community_account: z.string().nonempty(),
  community_id: z.string().nonempty(),
  event_id: z.string().nonempty(),
  order_id: z.string().nonempty(),
  user_id: z.string().nonempty(),
  menus: z.array(OrderMenuSchema).nonempty(),
  // Default
  status: z.enum(EVENT_ORDER_STATUS_VALUES).default('in_cart'),
  // Optional
  ordered_at: EpochMillisSchema.optional(),
  canceled_at: EpochMillisSchema.optional(),
  receipt_number: z.string().optional(),
  payment_intent: z.string().optional(),
})

const convertToDb = (order: EventOrder) => {
  return {
    ...order,
    created_at: EpochMillisSchema.default(Date.now()).parse(order.created_at),
    updated_at: Date.now(),
  }
}

export class EventOrder {
  // Mandatory
  readonly id: string
  readonly order_id: string
  readonly event_id: string
  created_at: number
  updated_at: number
  carted_at: number
  community_account!: string
  community_id!: string
  user_id!: string
  menus!: OrderMenuType[]
  status!: EventOrderStatusType
  // Optional
  ordered_at?: number
  canceled_at?: number
  receipt_number?: string
  payment_intent?: string

  constructor(event_id: string, order_id: string, src: Partial<EventOrder>) {
    Object.assign(this, EventOrderAppSchema.parse(src))
    this.event_id = event_id
    this.id = order_id
    this.order_id = order_id
    this.created_at = EpochMillisSchema.default(Date.now()).parse(src.created_at)
    this.carted_at = EpochMillisSchema.default(Date.now()).parse(src.carted_at)
    this.updated_at = EpochMillisSchema.default(Date.now()).parse(src.updated_at)
  }

  get totalPrice() {
    return this.menus.reduce((acc, menu) => acc + menu.price * menu.count, 0)
  }

  get totalCount() {
    return this.menus.reduce((acc, menu) => acc + menu.count, 0)
  }

  // 税抜き化価格
  get ExTaxPrice() {
    return Math.ceil(this.totalPrice / 1.08)
  }

  get TaxPrice() {
    return this.totalPrice - this.ExTaxPrice
  }

  isValidForDatabase(): boolean {
    return EventOrderDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof EventOrderDbSchema> {
    return EventOrderDbSchema.parse(convertToDb(this))
  }
}
