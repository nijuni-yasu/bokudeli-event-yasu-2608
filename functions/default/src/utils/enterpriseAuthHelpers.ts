import { HttpsError } from 'firebase-functions/https'
import type { CallableRequest } from 'firebase-functions/https'
import { ENTERPRISE_SUBDOMAIN_PATTERN, RESERVED_ENTERPRISE_SUBDOMAINS } from '@shokujii/common/schemas/Enterprise.js'
import { getEnterpriseById, getEnterpriseMember } from '../stores/enterprise.js'

function getTokenTenantId(token: Record<string, unknown>): string | undefined {
  const firebaseClaims = token.firebase
  if (firebaseClaims == null || typeof firebaseClaims !== 'object') {
    return undefined
  }
  const tenant = (firebaseClaims as { tenant?: unknown }).tenant
  return typeof tenant === 'string' && tenant !== '' ? tenant : undefined
}

export async function assertEnterpriseAdmin(auth: CallableRequest['auth'], enterpriseId: string): Promise<void> {
  if (auth?.uid == null) {
    throw new HttpsError('unauthenticated', 'not logged in')
  }
  const token = auth.token as Record<string, unknown>
  if (token.user_type !== 'enterprise') {
    throw new HttpsError('permission-denied', 'enterprise admin only')
  }
  const tokenEnterpriseId = token.enterprise_id as string | undefined
  if (tokenEnterpriseId !== enterpriseId) {
    throw new HttpsError('permission-denied', 'enterprise admin only')
  }
  const tokenTenantId = getTokenTenantId(token)
  if (tokenTenantId == null) {
    throw new HttpsError('permission-denied', 'enterprise admin only')
  }

  const [member, enterprise] = await Promise.all([
    getEnterpriseMember(enterpriseId, auth.uid),
    getEnterpriseById(enterpriseId),
  ])

  if (enterprise?.tenant_id == null || enterprise.tenant_id === '') {
    throw new HttpsError('permission-denied', 'enterprise admin only')
  }
  if (tokenTenantId !== enterprise.tenant_id) {
    throw new HttpsError('permission-denied', 'enterprise admin only')
  }
  if (member == null || member.role !== 'admin' || !member.is_active) {
    throw new HttpsError('permission-denied', 'enterprise admin only')
  }
}

export function normalizeEnterpriseEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function emailDomainMatches(email: string, allowedDomains: string[]): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (domain == null || domain === '') return false
  return allowedDomains.some((d) => d.toLowerCase() === domain)
}

export function assertValidEnterpriseSubdomain(subdomain: string): void {
  const normalized = subdomain.toLowerCase()
  if (!ENTERPRISE_SUBDOMAIN_PATTERN.test(normalized)) {
    throw new HttpsError('invalid-argument', 'subdomain format is invalid')
  }
  if ((RESERVED_ENTERPRISE_SUBDOMAINS as readonly string[]).includes(normalized)) {
    throw new HttpsError('invalid-argument', 'subdomain is reserved')
  }
}

export function getClientIp(rawRequest: {
  headers?: Record<string, string | string[] | undefined>
}): string | undefined {
  const forwarded = rawRequest.headers?.['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim()
  if (Array.isArray(forwarded)) return forwarded[0]?.split(',')[0]?.trim()
  return undefined
}
