import { getAuth } from 'firebase/auth'
import type { EnterpriseSubsidySettingsEntryType } from '@shokujii/common/schemas/EnterpriseSubsidySettings.js'
import { getEnterpriseById } from '@shokujii/base/stores/enterprise.js'

export type EnterpriseDocumentData = {
  company_name: string
  company_logo_url: string
  theme_color: string
  subdomain: string
  custom_domain?: string
  allowed_email_domains: string[]
  subsidy_settings_history: EnterpriseSubsidySettingsEntryType[]
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
    subsidy_settings_history: enterprise.subsidy_settings_history,
  }
}
