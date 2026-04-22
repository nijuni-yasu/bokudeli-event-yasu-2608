import { z } from 'zod'
import { EpochMillisSchema, NonEmptyStringSchema, TimestampSchema } from './firebase/index.js'

const AlbumItemDbSchema = z.object({
  // Mandatory
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  // Optional
  album_caption: NonEmptyStringSchema.optional(),
})

const AlbumItemAppSchema = z.object({
  // Default
  album_caption: z.string().default(''),
  created_at: EpochMillisSchema,
  updated_at: EpochMillisSchema,
})

const convertToDb = (item: AlbumItem) => {
  const base = {
    created_at: item.created_at,
    updated_at: Date.now(),
  }
  if (item.album_caption.trim() !== '') {
    return { ...base, album_caption: item.album_caption }
  }
  return base
}

export class AlbumItem {
  readonly id: string
  album_caption!: string
  created_at!: number
  updated_at!: number

  constructor(id: string, src: Partial<AlbumItem>) {
    const now = Date.now()
    Object.assign(
      this,
      AlbumItemAppSchema.parse({
        ...src,
        created_at: src.created_at ?? now,
        updated_at: src.updated_at ?? now,
      }),
    )
    this.id = id
  }

  isValidForDatabase(): boolean {
    return AlbumItemDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof AlbumItemDbSchema> {
    return AlbumItemDbSchema.parse(convertToDb(this))
  }
}
