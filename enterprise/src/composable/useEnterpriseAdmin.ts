import { getAuth } from 'firebase/auth'
import type { EnterpriseDiscountType } from '@shokujii/common/schemas/Enterprise.js'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@shokujii/base/firebase.js'

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
  return token.claims.enterprise_id as string | undefined
}

export async function isEnterpriseAdmin(): Promise<boolean> {
  const user = getAuth().currentUser
  if (user == null) return false
  const token = await user.getIdTokenResult()
  return token.claims.enterprise_role === 'admin'
}

export async function loadEnterpriseDocument(enterpriseId: string): Promise<EnterpriseDocumentData | null> {
  const snapshot = await getDoc(doc(db, 'enterprises', enterpriseId))
  if (!snapshot.exists()) return null
  const data = snapshot.data()
  return {
    company_name: typeof data.company_name === 'string' ? data.company_name : '',
    company_logo_url: typeof data.company_logo_url === 'string' ? data.company_logo_url : '',
    theme_color: typeof data.theme_color === 'string' ? data.theme_color : '#1976D2',
    subdomain: typeof data.subdomain === 'string' ? data.subdomain : '',
    custom_domain: typeof data.custom_domain === 'string' ? data.custom_domain : undefined,
    allowed_email_domains: Array.isArray(data.allowed_email_domains)
      ? data.allowed_email_domains.filter((d): d is string => typeof d === 'string')
      : [],
    discount_type: data.discount_type === 'percentage' ? 'percentage' : 'fixed',
    discount_value: typeof data.discount_value === 'number' ? data.discount_value : 0,
    monthly_limit_per_user: typeof data.monthly_limit_per_user === 'number' ? data.monthly_limit_per_user : 0,
  }
}
