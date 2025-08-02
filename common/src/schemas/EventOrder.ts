import { z } from 'zod'
import { TimestampSchema, EpochMillisSchema, NonEmptyStringSchema } from './firebase/index.js'
import { EVENT_PAYMENT_VALUES, type EventPaymentType } from './Event.js'

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
type OrderMenuType = z.infer<typeof OrderMenuSchema>

const EventOrderDbSchema = z.object({
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  community_account: z.string().nonempty(),
  community_id: z.string().nonempty(),
  event_id: z.string().nonempty(),
  order_id: z.string().nonempty(),
  event_payment: z.enum(EVENT_PAYMENT_VALUES),
  user_id: z.string().nonempty(),
  menus: z.array(OrderMenuSchema).nonempty(),
  staus: z.enum(EVENT_ORDER_STATUS_VALUES),
  // Optional
  ordered_at: TimestampSchema.optional(),
  receipt_number: NonEmptyStringSchema.optional(),
})

const EventOrderAppSchema = z.object({
  // Mandatory
  community_account: z.string().nonempty(),
  community_id: z.string().nonempty(),
  event_id: z.string().nonempty(),
  order_id: z.string().nonempty(),
  event_payment: z.enum(EVENT_PAYMENT_VALUES),
  user_id: z.string().nonempty(),
  menus: z.array(OrderMenuSchema).nonempty(),
  // Default
  status: z.enum(EVENT_ORDER_STATUS_VALUES).default('in_cart'),
  // Optional
  ordered_at: EpochMillisSchema.optional(),
  receipt_number: z.string().optional(),
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
  created_at: number
  updated_at: number
  community_account!: string
  community_id!: string
  event_id!: string
  event_payment!: EventPaymentType
  user_id!: string
  menus!: OrderMenuType[]
  status!: EventOrderStatusType
  // Optional
  ordered_at?: number
  receipt_number?: string

  constructor(id: string, src: Partial<EventOrder>) {
    Object.assign(this, EventOrderAppSchema.parse(src))
    this.id = id
    this.order_id = id
    this.created_at = EpochMillisSchema.default(Date.now()).parse(src.created_at)
    this.updated_at = Date.now()
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
