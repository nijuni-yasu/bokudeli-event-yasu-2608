import { z } from 'zod'
import { TimestampSchema, EpochMillisSchema } from './firebase/index.js'

const PartnerMenuDbSchema = z.object({
  updatedAt: TimestampSchema,
  menu_description: z.string().nonempty(),
  menu_image_url: z.string().url().nonempty(),
  menu_name: z.string().nonempty(),
  menu_price: z.number().int().positive(),
  is_sold_out: z.boolean(),
  // Optional
  menu_sort_number: z.number().int().nonnegative().optional(),
  menu_date_start: TimestampSchema.optional(),
  menu_date_end: TimestampSchema.optional(),
})

const PartnerMenuAppSchema = z.object({
  // Default
  menu_description: z.string().default(''),
  menu_image_url: z.string().default(''),
  menu_name: z.string().default(''),
  menu_price: z.number().int().positive().default(100),
  is_sold_out: z.boolean().default(false),
  // Optional
  menu_sort_number: z.number().int().nonnegative().optional(),
  menu_date_start: EpochMillisSchema.optional(),
  menu_date_end: EpochMillisSchema.optional(),
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
  menu_image_url!: string
  menu_name!: string
  menu_price!: number
  is_sold_out!: boolean
  // Optional
  menu_sort_number?: number
  menu_date_start?: number
  menu_date_end?: number

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
