import { z } from 'zod'

const BannersDbSchema = z.object({
  banners: z.array(
    z.object({
      image_url: z.string().url().nonempty(),
      link_url: z.string().url().optional(),
    }),
  ),
})

const BannerAppSchema = z.object({
  image_url: z.string().default(''),
  link_url: z.string().optional(),
})

const BannersAppSchema = z.object({
  banners: z.array(BannerAppSchema).default([]),
})

export type Banner = z.infer<typeof BannerAppSchema>

export class Banners {
  readonly id: string
  banners!: Banner[]

  constructor(id: string, src: Partial<Banners>) {
    Object.assign(this, BannersAppSchema.parse(src))
    this.id = id
  }

  isValidForDatabase(): boolean {
    return BannersDbSchema.safeParse(this).success
  }

  toFirestore(): z.infer<typeof BannersDbSchema> {
    return BannersDbSchema.parse(this)
  }
}
