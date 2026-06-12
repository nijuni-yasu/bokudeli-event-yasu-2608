import { z } from 'zod'

export const ENTERPRISE_SUBSIDY_TYPE_VALUES = ['fixed', 'percentage'] as const
export type EnterpriseSubsidyType = (typeof ENTERPRISE_SUBSIDY_TYPE_VALUES)[number]

export const EnterpriseSubsidySettingsAppSchema = z.object({
  type: z.enum(ENTERPRISE_SUBSIDY_TYPE_VALUES),
  value: z.number().int().nonnegative(),
  monthly_limit_per_user: z.number().int().nonnegative(),
})

export const EnterpriseSubsidySettingsDbSchema = EnterpriseSubsidySettingsAppSchema

export type EnterpriseSubsidySettingsType = z.infer<typeof EnterpriseSubsidySettingsAppSchema>
