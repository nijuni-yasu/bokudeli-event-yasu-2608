import { z } from 'zod'
import { EpochMillisSchema, TimestampSchema } from './firebase/index.js'

export const AUDIT_LOG_TARGET_TYPE_VALUES = [
  'community',
  'event',
  'order_session',
  'member',
  'enterprise',
  'settings',
  'enterprise_subsidy_settings',
] as const
export type AuditLogTargetType = (typeof AUDIT_LOG_TARGET_TYPE_VALUES)[number]

const AuditLogDbSchema = z.object({
  enterprise_id: z.string().nonempty(),
  user_id: z.string().nonempty(),
  action: z.string().nonempty(),
  target_id: z.string().nullable().optional(),
  target_type: z.enum(AUDIT_LOG_TARGET_TYPE_VALUES).nullable().optional(),
  timestamp: TimestampSchema,
  ip_address: z.string().nullable().optional(),
  details: z.record(z.unknown()).nullable().optional(),
})

const AuditLogAppSchema = z.object({
  enterprise_id: z.string().nonempty(),
  user_id: z.string().nonempty(),
  action: z.string().nonempty(),
  target_id: z.string().nullable().optional(),
  target_type: z.enum(AUDIT_LOG_TARGET_TYPE_VALUES).nullable().optional(),
  timestamp: EpochMillisSchema.optional(),
  ip_address: z.string().nullable().optional(),
  details: z.record(z.unknown()).nullable().optional(),
})

const convertToDb = (log: AuditLog) => {
  return {
    ...log,
    timestamp: EpochMillisSchema.default(Date.now()).parse(log.timestamp),
  }
}

export class AuditLog {
  readonly id: string
  enterprise_id!: string
  user_id!: string
  action!: string
  target_id?: string | null
  target_type?: AuditLogTargetType | null
  timestamp: number
  ip_address?: string | null
  details?: Record<string, unknown> | null

  constructor(id: string, src: Partial<AuditLog>) {
    Object.assign(this, AuditLogAppSchema.parse(src))
    this.id = id
    this.timestamp = EpochMillisSchema.default(Date.now()).parse(src.timestamp)
  }

  isValidForDatabase(): boolean {
    return AuditLogDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof AuditLogDbSchema> {
    return AuditLogDbSchema.parse(convertToDb(this))
  }
}
