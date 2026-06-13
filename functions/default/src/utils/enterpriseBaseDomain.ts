import { defineString } from 'firebase-functions/params'
import type { Enterprise } from '@shokujii/common/schemas/Enterprise.js'
import { getEnterpriseByCustomDomain, getEnterpriseBySubdomain } from '../stores/enterprise.js'

const ENTERPRISE_BASE_DOMAIN = defineString('ENTERPRISE_BASE_DOMAIN', { default: '' })

export async function resolveEnterpriseByHostname(hostname: string): Promise<Enterprise | undefined> {
  const host = hostname.toLowerCase()
  const baseDomain = ENTERPRISE_BASE_DOMAIN.value().trim().toLowerCase()

  if (baseDomain !== '') {
    const escaped = baseDomain.replace(/\./g, '\\.')
    const subdomainMatch = new RegExp(`^([a-z0-9-]+)\\.${escaped}$`).exec(host)
    if (subdomainMatch != null) {
      const bySubdomain = await getEnterpriseBySubdomain(subdomainMatch[1]!)
      if (bySubdomain != null) {
        return bySubdomain
      }
    }
  }

  return getEnterpriseByCustomDomain(host)
}
