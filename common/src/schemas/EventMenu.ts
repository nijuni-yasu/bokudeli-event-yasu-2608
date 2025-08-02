import { z } from 'zod'
import { TimestampSchema, EpochMillisSchema } from './firebase/index.js'

const EventMenuDbSchema = z.object({
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  menu_description: z.string().nonempty(),
  menu_image_url: z.string().url().nonempty(),
  menu_name: z.string().nonempty(),
  menu_price: z.number().int().positive(),
})

const EventOrderAppSchema = z.object({
  // Mandatory
  menu_description: z.string().nonempty(),
  menu_image_url: z.string().url().nonempty(),
  menu_name: z.string().nonempty(),
  menu_price: z.number().int().positive(),
})

const convertToDb = (menu: EventMenu) => {
  return {
    ...menu,
    createdAt: EpochMillisSchema.default(Date.now()).parse(menu.createdAt),
    updatedAt: Date.now(),
  }
}

export class EventMenu {
  // Mandatory
  readonly id: string
  createdAt: number
  updatedAt: number
  menu_description!: string
  menu_image_url!: string
  menu_name!: string
  menu_price!: number

  constructor(id: string, src: Partial<EventMenu>) {
    Object.assign(this, EventOrderAppSchema.parse(src))
    this.id = id
    this.createdAt = EpochMillisSchema.default(Date.now()).parse(src.createdAt)
    this.updatedAt = Date.now()
  }

  isValidForDatabase(): boolean {
    return EventMenuDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof EventMenuDbSchema> {
    return EventMenuDbSchema.parse(convertToDb(this))
  }
}
