import { getAuth } from 'firebase/auth'
import type { EnterpriseDiscountType } from '@shokujii/common/schemas/Enterprise.js'
import { getEnterpriseById } from '@shokujii/base/stores/enterprise.js'

export type EnterpriseDocumentData = {
  company_name: string
  company_logo_url: string
  theme_color: string
  subdomain: string
  custom_domain?: string
  allowed_email_domains: string[]
  discount_type: EnterpriseDiscountType
  discount_value: number
  monthly_limit_per_user: number
}

export async function getEnterpriseIdFromToken(): Promise<string | undefined> {
  const user = getAuth().currentUser
  if (user == null) return undefined
  const token = await user.getIdTokenResult()
  const enterpriseId = token.claims.enterprise_id
  return typeof enterpriseId === 'string' && enterpriseId !== '' ? enterpriseId : undefined
}

export async function isEnterpriseAdmin(): Promise<boolean> {
  const user = getAuth().currentUser
  if (user == null) return false
  const token = await user.getIdTokenResult()
  return token.claims.enterprise_role === 'admin'
}

export async function loadEnterpriseDocument(enterpriseId: string): Promise<EnterpriseDocumentData | null> {
  const enterprise = await getEnterpriseById(enterpriseId)
  if (enterprise == null) {
    return null
  }
  return {
    company_name: enterprise.company_name,
    company_logo_url: enterprise.company_logo_url,
    theme_color: enterprise.theme_color,
    subdomain: enterprise.subdomain,
    custom_domain: enterprise.custom_domain,
    allowed_email_domains: enterprise.allowed_email_domains,
    discount_type: enterprise.discount_type,
    discount_value: enterprise.discount_value,
    monthly_limit_per_user: enterprise.monthly_limit_per_user,
  }
}
