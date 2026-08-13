import type { EnterpriseDiscountType, EnterpriseMemberRoleType } from '../schemas/Enterprise.js'

export type CreateEnterpriseRequest = {
  enterprise_id: string
  company_name: string
  subdomain: string
  custom_domain?: string
  allowed_email_domains: string[]
  theme_color: string
  initial_subsidy_settings: {
    type: EnterpriseDiscountType
    value: number
    monthly_limit_per_user: number
  }
  initial_admin: {
    email: string
    display_name: string
    department?: string
  }
}

export type CreateEnterpriseResponse = {
  enterprise_id: string
  initial_admin_user_id: string
}

export type GetEnterpriseByDomainRequest = {
  hostname: string
}

export type GetEnterpriseByDomainResponse = {
  enterprise_id: string
  tenant_id: string
  company_name: string
  company_logo_url: string
  theme_color: string
  subdomain: string
  allowed_email_domains: string[]
  updated_at: number
}

export type RequestEnterpriseEmailLoginRequest = {
  enterprise_id: string
  email: string
}

export type RequestEnterpriseEmailLoginResponse = {
  success: true
}

export type ConfirmEnterpriseEmailLoginRequest = {
  enterprise_id: string
  email: string
  pass_code: string
}

export type ConfirmEnterpriseEmailLoginResponse = {
  token: string
}

export type LogEnterpriseLogoutRequest = {
  enterprise_id: string
  action: 'logout' | 'session_timeout'
}

export type LogEnterpriseLogoutResponse = {
  success: true
}

export type CreateEnterpriseMembersRequest = {
  enterprise_id: string
  members: {
    email: string
    display_name: string
    department?: string
    role?: EnterpriseMemberRoleType
  }[]
}

export type CreateEnterpriseMembersResultItem = {
  row: number
  email: string
  status: 'success' | 'error'
  error_message?: string
}

export type CreateEnterpriseMembersResponse = {
  total: number
  success_count: number
  error_count: number
  results: CreateEnterpriseMembersResultItem[]
}

export type GetEnterpriseMembersRequest = {
  enterprise_id: string
  search?: string
  role?: EnterpriseMemberRoleType | 'all'
  is_active?: boolean
  sort_by?: 'display_name' | 'department' | 'role' | 'is_active' | 'created_at' | 'monthly_usage'
  sort_order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

export type EnterpriseMemberListItem = {
  user_id: string
  display_name: string
  department?: string
  role: EnterpriseMemberRoleType
  is_active: boolean
  email: string
  monthly_usage: Record<string, number>
  created_at: number
}

export type GetEnterpriseMembersResponse = {
  members: EnterpriseMemberListItem[]
  total_count: number
}

export type DisableEnterpriseMemberRequest = {
  enterprise_id: string
  user_id: string
}

export type DisableEnterpriseMemberResponse = {
  success: true
}

export type EnableEnterpriseMemberRequest = {
  enterprise_id: string
  user_id: string
}

export type EnableEnterpriseMemberResponse = {
  success: true
}

export type UpdateEnterpriseRoleRequest = {
  enterprise_id: string
  user_id: string
  role: EnterpriseMemberRoleType
}

export type UpdateEnterpriseRoleResponse = {
  success: true
}

export type UpdateEnterpriseMemberRequest = {
  enterprise_id: string
  user_id: string
  display_name: string
  department?: string
}

export type UpdateEnterpriseMemberResponse = {
  success: true
}

export type UpdateEnterpriseSettingsRequest = {
  enterprise_id: string
  company_name?: string
  company_logo_url?: string
}

export type UpdateEnterpriseSettingsResponse = {
  success: true
}

export type UpdateEnterpriseSubsidySettingsRequest = {
  enterprise_id: string
  discount_type: EnterpriseDiscountType
  discount_value: number
  monthly_limit_per_user: number
}

export type UpdateEnterpriseSubsidySettingsResponse = {
  success: true
}

export type GetEnterpriseCommunitiesRequest = {
  enterprise_id: string
  page?: number
  page_size?: number
}

export type EnterpriseCommunityListItem = {
  community_id: string
  community_name: string
  community_account: string
  community_num_members: number
  created_at: number
  manager_display_names?: string[]
}

export type GetEnterpriseCommunitiesResponse = {
  communities: EnterpriseCommunityListItem[]
  total_count: number
}

export type CreateEnterpriseCommunitiesRequest = {
  enterprise_id: string
  communities: {
    community_name: string
    community_account: string
    description?: string
    manager_email: string
  }[]
}

export type CreateEnterpriseCommunitiesResultItem = {
  row: number
  community_name: string
  status: 'success' | 'error'
  error_message?: string
}

export type CreateEnterpriseCommunitiesResponse = {
  total: number
  success_count: number
  error_count: number
  results: CreateEnterpriseCommunitiesResultItem[]
}

export type GetInvitationUrlForEnterpriseCommunityManagerRequest = {
  communityId: string
}

export type GetInvitationUrlForEnterpriseCommunityManagerResponse = string

export type AcceptInvitationForEnterpriseCommunityManagerRequest = {
  communityAccount: string
  token: string
}

export type AcceptInvitationForEnterpriseCommunityManagerResponse = void
