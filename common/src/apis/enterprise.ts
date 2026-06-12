import type { EnterpriseDiscountType } from '../schemas/Enterprise.js'

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
  company_name: string
  company_logo_url: string
  theme_color: string
  subdomain: string
  allowed_email_domains: string[]
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
