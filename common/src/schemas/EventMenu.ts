import { z } from 'zod'
import { TimestampSchema } from './firebase/index.js'

const EventMenuDbSchema = z.object({
  updatedAt: TimestampSchema,
  menu_description: z.string().nonempty(),
  menu_image_url: z.string().url().nonempty(),
  menu_name: z.string().nonempty(),
  menu_price: z.number().int().positive(),
  is_sold_out: z.boolean(),
  menu_sort_number: z.number().int().nonnegative(),
  is_selected: z.boolean(),
})

const EventMenuAppSchema = z.object({
  // Mandatory
  menu_name: z.string().nonempty(),
  // Default
  menu_price: z.number().int().positive().default(100),
  menu_image_url: z.string().default(''),
  menu_description: z.string().default(''),
  is_sold_out: z.boolean().default(false),
  is_selected: z.boolean().default(true),
  // Mandatory
  menu_sort_number: z.number().int().nonnegative(),
})

const convertToDb = (menu: EventMenu) => {
  return {
    ...menu,
    updatedAt: Date.now(),
  }
}

export class EventMenu {
  // Mandatory
  readonly id: string
  readonly menu_id: string
  readonly event_id: string
  updatedAt: number
  menu_description!: string
  menu_image_url!: string
  menu_name!: string
  menu_price!: number
  is_sold_out!: boolean
  menu_sort_number!: number
  is_selected!: boolean

  constructor(event_id: string, menu_id: string, src: Partial<EventMenu>) {
    Object.assign(this, EventMenuAppSchema.parse(src))
    this.event_id = event_id
    this.id = menu_id
    this.menu_id = menu_id
    this.updatedAt = Date.now()
  }

  isValidForDatabase(): boolean {
    return EventMenuDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof EventMenuDbSchema> {
    return EventMenuDbSchema.parse(convertToDb(this))
  }
}
