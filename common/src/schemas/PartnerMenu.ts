import { z } from 'zod'
import { TimestampSchema, EpochMillisSchema } from './firebase/index.js'

const PartnerMenuDbSchema = z.object({
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  menu_description: z.string().nonempty(),
  menu_image_url: z.string().url().nonempty(),
  menu_name: z.string().nonempty(),
  menu_price: z.number().int().positive(),
  is_sold_out: z.boolean(),
  // Optional
  menu_date_start: TimestampSchema.optional(),
  menu_date_end: TimestampSchema.optional(),
})

const EventOrderAppSchema = z.object({
  // Mandatory
  menu_description: z.string().nonempty(),
  menu_image_url: z.string().url().nonempty(),
  menu_name: z.string().nonempty(),
  menu_price: z.number().int().positive(),
  // Default
  is_sold_out: z.boolean().default(false),
  // Optional
  menu_date_start: TimestampSchema.optional(),
  menu_date_end: TimestampSchema.optional(),
})

export class PartnerMenu {
  // Mandatory
  readonly id: string
  createdAt: number
  updatedAt: number
  menu_description!: string
  menu_image_url!: string
  menu_name!: string
  menu_price!: number
  is_sold_out!: boolean
  // Optional
  menu_date_start?: number
  menu_date_end?: number

  constructor(id: string, src: Partial<PartnerMenu>) {
    Object.assign(this, EventOrderAppSchema.parse(src))
    this.id = id
    this.createdAt = EpochMillisSchema.default(Date.now()).parse(src.createdAt)
    this.updatedAt = Date.now()
  }

  private getDb() {
    return {
      ...this,
      createdAt: EpochMillisSchema.default(Date.now()).parse(this.createdAt),
      updatedAt: Date.now(),
    }
  }

  isValidForDatabase(): boolean {
    return PartnerMenuDbSchema.safeParse(this.getDb()).success
  }

  toFirestore(): z.infer<typeof PartnerMenuDbSchema> {
    return PartnerMenuDbSchema.parse(this.getDb())
  }
}
