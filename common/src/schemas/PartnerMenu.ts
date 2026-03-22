import { z } from 'zod'
import { TimestampSchema, EpochMillisSchema } from './firebase/index.js'

const PartnerMenuDbSchema = z.object({
  updatedAt: TimestampSchema,
  menu_description: z.string().nonempty(),
  menu_name: z.string().nonempty(),
  menu_price: z.number().int().positive(),
  is_sold_out: z.boolean(),
  menu_sort_number: z.number().int().nonnegative(),
  // Optional
  menu_date_start: TimestampSchema.nullable(),
  menu_date_end: TimestampSchema.nullable(),
  is_deleted: z.boolean().optional(),
  deleted_at: TimestampSchema.optional(),
})

const PartnerMenuAppSchema = z.object({
  // Default
  menu_description: z.string().default(''),
  menu_name: z.string().default(''),
  menu_price: z.number().int().positive().default(100),
  is_sold_out: z.boolean().default(false),
  menu_sort_number: z.number().int().nonnegative().default(0),
  // Optional
  menu_date_start: EpochMillisSchema.nullable().default(null),
  menu_date_end: EpochMillisSchema.nullable().default(null),
  is_deleted: z.boolean().default(false),
  deleted_at: EpochMillisSchema.optional(),
})

const convertToDb = (menu: PartnerMenu) => {
  return {
    ...menu,
    updatedAt: Date.now(),
  }
}

export class PartnerMenu {
  // Mandatory
  readonly id: string
  readonly menu_id: string
  readonly partner_id: string
  updatedAt: number
  menu_description!: string
  menu_name!: string
  menu_price!: number
  is_sold_out!: boolean
  menu_sort_number!: number
  // Optional
  menu_date_start!: number | null
  menu_date_end!: number | null
  is_deleted!: boolean
  deleted_at?: number

  constructor(partner_id: string, menu_id: string, src: Partial<PartnerMenu>) {
    Object.assign(this, PartnerMenuAppSchema.parse(src))
    this.partner_id = partner_id
    this.id = menu_id
    this.menu_id = menu_id
    this.updatedAt = Date.now()
  }

  isValidForDatabase(): boolean {
    return PartnerMenuDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof PartnerMenuDbSchema> {
    return PartnerMenuDbSchema.parse(convertToDb(this))
  }
}
