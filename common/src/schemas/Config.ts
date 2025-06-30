import { z } from 'zod'

const ConfigGlobalDbSchema = z.object({
  support_user_ids: z.array(z.string().nonempty()),
  // maintenance_mode: z.boolean(),
})

const ConfigGlobalAppSchema = z.object({
  support_user_ids: z.array(z.string().nonempty()),
  // maintenance_mode: z.boolean(),
})

export class ConfigGlobal {
  readonly id: string
  support_user_ids!: string[]

  constructor(id: string, src: Partial<ConfigGlobal>) {
    Object.assign(this, ConfigGlobalAppSchema.parse(src))
    this.id = id
  }

  isSupport(userId: string): boolean {
    return this.support_user_ids.includes(userId)
  }

  isValidForDatabase(): boolean {
    return ConfigGlobalDbSchema.safeParse(this).success
  }

  toFirestore(): z.infer<typeof ConfigGlobalDbSchema> {
    return ConfigGlobalDbSchema.parse(this)
  }
}
