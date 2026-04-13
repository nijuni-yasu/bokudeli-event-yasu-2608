import { z } from 'zod'

const ConfigGlobalDbSchema = z.object({
  support_user_ids: z.array(z.string().nonempty()),
  system_id: z.string().nonempty(),
  maintenance_mode: z.boolean().default(false),
})

const ConfigGlobalAppSchema = z.object({
  support_user_ids: z.array(z.string().nonempty()),
  system_id: z.string().nonempty(),
  maintenance_mode: z.boolean().default(false),
})

export class ConfigGlobal {
  readonly id: string
  support_user_ids!: string[]
  system_id!: string
  maintenance_mode!: boolean

  constructor(id: string, src: Partial<ConfigGlobal>) {
    Object.assign(this, ConfigGlobalAppSchema.parse(src))
    this.id = id
  }

  isSupport(userId: string): boolean {
    return this.support_user_ids.includes(userId)
  }

  isSystem(userId: string): boolean {
    return this.system_id === userId
  }

  isMaintenanceMode(): boolean {
    return this.maintenance_mode
  }

  isValidForDatabase(): boolean {
    return ConfigGlobalDbSchema.safeParse(this).success
  }

  toFirestore(): z.infer<typeof ConfigGlobalDbSchema> {
    return ConfigGlobalDbSchema.parse(this)
  }
}
