import { z } from 'zod'
import { EpochMillisSchema, NonEmptyStringSchema, TimestampSchema } from './firebase/index.js'

export const ENTERPRISE_DISCOUNT_TYPE_VALUES = ['fixed', 'percentage'] as const
export type EnterpriseDiscountType = (typeof ENTERPRISE_DISCOUNT_TYPE_VALUES)[number]

export const ENTERPRISE_MEMBER_ROLE_VALUES = ['admin', 'member'] as const
export type EnterpriseMemberRoleType = (typeof ENTERPRISE_MEMBER_ROLE_VALUES)[number]

/** createEnterprise の subdomain バリデーション用（DNS ラベル準拠・予約語） */
export const RESERVED_ENTERPRISE_SUBDOMAINS = [
  'www',
  'user',
  'partner',
  'enterprise',
  'admin',
  'api',
  'mail',
  'app',
] as const

export const ENTERPRISE_SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

export const ENTERPRISE_PAYMENT_METHOD_VALUES = ['credit_card'] as const
export type EnterprisePaymentMethodType = (typeof ENTERPRISE_PAYMENT_METHOD_VALUES)[number]

export const BILLING_STATUS_VALUES = ['final', 'provisional'] as const
export type BillingStatusType = (typeof BILLING_STATUS_VALUES)[number]

export const USER_TYPE_VALUES = ['platform', 'enterprise'] as const
export type UserType = (typeof USER_TYPE_VALUES)[number]

export const COMMUNITY_APPROVAL_STATUS_VALUES = ['pending', 'approved', 'rejected'] as const
export type CommunityApprovalStatusType = (typeof COMMUNITY_APPROVAL_STATUS_VALUES)[number]

export const GUEST_PAYMENT_VALUES = ['free', 'self_pay'] as const
export type GuestPaymentType = (typeof GUEST_PAYMENT_VALUES)[number]

const YearMonthRecordSchema = z.record(z.string(), z.number().int().nonnegative())

const EnterpriseBillingSettingsDbSchema = z.object({
  unit_price: z.number().int().nonnegative(),
  trial_months: z.number().int().positive(),
  billing_trial_ends_at: TimestampSchema,
})

const EnterpriseBillingSettingsAppSchema = z.object({
  unit_price: z.number().int().nonnegative().default(500),
  trial_months: z.number().int().positive().default(3),
  billing_trial_ends_at: EpochMillisSchema,
})

export type EnterpriseBillingSettingsType = z.infer<typeof EnterpriseBillingSettingsAppSchema>

const EnterpriseDbSchema = z.object({
  enterprise_id: z.string().nonempty(),
  company_name: z.string().nonempty(),
  company_logo_url: z.string(),
  theme_color: z.string().nonempty(),
  subdomain: z.string().nonempty(),
  custom_domain: NonEmptyStringSchema.optional(),
  allowed_email_domains: z.array(z.string().nonempty()).min(1),
  discount_type: z.enum(ENTERPRISE_DISCOUNT_TYPE_VALUES),
  discount_value: z.number().int().nonnegative(),
  monthly_limit_per_user: z.number().int().nonnegative(),
  payment_method: z.enum(ENTERPRISE_PAYMENT_METHOD_VALUES),
  billing_settings: EnterpriseBillingSettingsDbSchema,
  is_active: z.boolean(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
})

const EnterpriseAppSchema = z.object({
  company_name: z.string().default(''),
  company_logo_url: z.string().default(''),
  theme_color: z.string().default('#1976D2'),
  subdomain: z.string().default(''),
  custom_domain: z.string().optional(),
  allowed_email_domains: z.array(z.string()).default([]),
  discount_type: z.enum(ENTERPRISE_DISCOUNT_TYPE_VALUES).default('fixed'),
  discount_value: z.number().int().nonnegative().default(500),
  monthly_limit_per_user: z.number().int().nonnegative().default(7500),
  payment_method: z.enum(ENTERPRISE_PAYMENT_METHOD_VALUES).default('credit_card'),
  billing_settings: EnterpriseBillingSettingsAppSchema.optional(),
  is_active: z.boolean().default(true),
})

const convertEnterpriseToDb = (enterprise: Enterprise) => {
  return {
    ...enterprise,
    created_at: EpochMillisSchema.default(Date.now()).parse(enterprise.created_at),
    updated_at: Date.now(),
    billing_settings: {
      ...enterprise.billing_settings,
      billing_trial_ends_at: EpochMillisSchema.parse(enterprise.billing_settings.billing_trial_ends_at),
    },
  }
}

export class Enterprise {
  readonly id: string
  readonly enterprise_id: string
  company_name!: string
  company_logo_url!: string
  theme_color!: string
  subdomain!: string
  custom_domain?: string
  allowed_email_domains!: string[]
  discount_type!: EnterpriseDiscountType
  discount_value!: number
  monthly_limit_per_user!: number
  payment_method!: EnterprisePaymentMethodType
  billing_settings!: EnterpriseBillingSettingsType
  is_active!: boolean
  created_at: number
  updated_at: number

  constructor(id: string, src: Partial<Enterprise>) {
    Object.assign(this, EnterpriseAppSchema.parse(src))
    this.id = id
    this.enterprise_id = id
    this.created_at = EpochMillisSchema.default(Date.now()).parse(src.created_at)
    this.updated_at = Date.now()
    if (src.billing_settings != null) {
      this.billing_settings = EnterpriseBillingSettingsAppSchema.parse(src.billing_settings)
    } else if (this.billing_settings == null) {
      this.billing_settings = {
        unit_price: 500,
        trial_months: 3,
        billing_trial_ends_at: this.created_at,
      }
    }
  }

  isValidForDatabase(): boolean {
    return EnterpriseDbSchema.safeParse(convertEnterpriseToDb(this)).success
  }

  toFirestore(): z.infer<typeof EnterpriseDbSchema> {
    return EnterpriseDbSchema.parse(convertEnterpriseToDb(this))
  }
}

const EnterpriseMemberDbSchema = z.object({
  user_id: z.string().nonempty(),
  role: z.enum(ENTERPRISE_MEMBER_ROLE_VALUES),
  is_active: z.boolean(),
  last_activated_at: TimestampSchema.nullable(),
  last_deactivated_at: TimestampSchema.nullable(),
  display_name: NonEmptyStringSchema.optional(),
  department: NonEmptyStringSchema.optional(),
  monthly_usage: YearMonthRecordSchema.default({}),
  monthly_order_count: YearMonthRecordSchema.default({}),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
})

const EnterpriseMemberAppSchema = z.object({
  user_id: z.string().nonempty(),
  role: z.enum(ENTERPRISE_MEMBER_ROLE_VALUES).default('member'),
  is_active: z.boolean().default(true),
  last_activated_at: EpochMillisSchema.nullable().default(null),
  last_deactivated_at: EpochMillisSchema.nullable().default(null),
  display_name: z.string().optional(),
  department: z.string().optional(),
  monthly_usage: YearMonthRecordSchema.default({}),
  monthly_order_count: YearMonthRecordSchema.default({}),
})

const convertEnterpriseMemberToDb = (member: EnterpriseMember) => {
  return {
    ...member,
    last_activated_at: member.last_activated_at == null ? null : EpochMillisSchema.parse(member.last_activated_at),
    last_deactivated_at:
      member.last_deactivated_at == null ? null : EpochMillisSchema.parse(member.last_deactivated_at),
    created_at: EpochMillisSchema.default(Date.now()).parse(member.created_at),
    updated_at: Date.now(),
  }
}

export class EnterpriseMember {
  readonly id: string
  user_id!: string
  role!: EnterpriseMemberRoleType
  is_active!: boolean
  last_activated_at: number | null
  last_deactivated_at: number | null
  display_name?: string
  department?: string
  monthly_usage!: Record<string, number>
  monthly_order_count!: Record<string, number>
  created_at: number
  updated_at: number

  constructor(userId: string, src: Partial<EnterpriseMember>) {
    Object.assign(this, EnterpriseMemberAppSchema.parse({ ...src, user_id: userId }))
    this.id = userId
    this.user_id = userId
    this.last_activated_at = src.last_activated_at ?? null
    this.last_deactivated_at = src.last_deactivated_at ?? null
    this.created_at = EpochMillisSchema.default(Date.now()).parse(src.created_at)
    this.updated_at = Date.now()
  }

  isValidForDatabase(): boolean {
    return EnterpriseMemberDbSchema.safeParse(convertEnterpriseMemberToDb(this)).success
  }

  toFirestore(): z.infer<typeof EnterpriseMemberDbSchema> {
    return EnterpriseMemberDbSchema.parse(convertEnterpriseMemberToDb(this))
  }
}

const EnterpriseBillingSnapshotDbSchema = z.object({
  year_month: z.string().regex(/^\d{4}-\d{2}$/),
  active_account_count: z.number().int().nonnegative(),
  unit_price: z.number().int().nonnegative(),
  platform_fee_amount: z.number().int().nonnegative(),
  is_trial: z.boolean(),
  meal_billing_amount: z.number().int().nonnegative(),
  total_billing_amount: z.number().int().nonnegative(),
  snapshot_at: TimestampSchema,
  billing_status: z.enum(BILLING_STATUS_VALUES),
})

const EnterpriseBillingSnapshotAppSchema = z.object({
  year_month: z.string().regex(/^\d{4}-\d{2}$/),
  active_account_count: z.number().int().nonnegative().default(0),
  unit_price: z.number().int().nonnegative().default(0),
  platform_fee_amount: z.number().int().nonnegative().default(0),
  is_trial: z.boolean().default(false),
  meal_billing_amount: z.number().int().nonnegative().default(0),
  total_billing_amount: z.number().int().nonnegative().default(0),
  billing_status: z.enum(BILLING_STATUS_VALUES).default('final'),
})

const convertBillingSnapshotToDb = (snapshot: EnterpriseBillingSnapshot) => {
  return {
    ...snapshot,
    snapshot_at: EpochMillisSchema.default(Date.now()).parse(snapshot.snapshot_at),
  }
}

export class EnterpriseBillingSnapshot {
  readonly id: string
  year_month!: string
  active_account_count!: number
  unit_price!: number
  platform_fee_amount!: number
  is_trial!: boolean
  meal_billing_amount!: number
  total_billing_amount!: number
  snapshot_at: number
  billing_status!: BillingStatusType

  constructor(yearMonth: string, src: Partial<EnterpriseBillingSnapshot>) {
    Object.assign(this, EnterpriseBillingSnapshotAppSchema.parse({ ...src, year_month: yearMonth }))
    this.id = yearMonth
    this.year_month = yearMonth
    this.snapshot_at = EpochMillisSchema.default(Date.now()).parse(src.snapshot_at)
  }

  isValidForDatabase(): boolean {
    return EnterpriseBillingSnapshotDbSchema.safeParse(convertBillingSnapshotToDb(this)).success
  }

  toFirestore(): z.infer<typeof EnterpriseBillingSnapshotDbSchema> {
    return EnterpriseBillingSnapshotDbSchema.parse(convertBillingSnapshotToDb(this))
  }
}
