import { defineString } from 'firebase-functions/params'
import type { Enterprise } from '@shokujii/common/schemas/Enterprise.js'
import { getEnterpriseByCustomDomain, getEnterpriseBySubdomain } from '../stores/enterprise.js'

const ENTERPRISE_BASE_DOMAIN = defineString('ENTERPRISE_BASE_DOMAIN', { default: '' })

export function getEnterpriseBaseDomain(): string {
  return ENTERPRISE_BASE_DOMAIN.value().trim().toLowerCase()
}

/** エンタープライズ subdomain からテナントホスト名を構築する（例: acme.example.com） */
export function getEnterpriseSubdomainHost(subdomain: string): string | undefined {
  const baseDomain = getEnterpriseBaseDomain()
  if (baseDomain === '' || subdomain.trim() === '') {
    return undefined
  }
  return `${subdomain.trim().toLowerCase()}.${baseDomain}`
}

/**
 * メール・招待 URL 等のアプリ host（hostname のみ）を解決する。
 * custom_domain > subdomain.base（communityManager.resolveEnterpriseHost と同一優先順）。
 */
export function resolveEnterpriseAppHost(
  enterprise: Pick<Enterprise, 'subdomain' | 'custom_domain'>,
): string | undefined {
  const customDomain = enterprise.custom_domain?.trim().toLowerCase()
  if (customDomain != null && customDomain !== '') {
    return customDomain
  }
  return getEnterpriseSubdomainHost(enterprise.subdomain)
}

/** 企業に紐づく許可ホスト一覧（subdomain ホスト + custom_domain） */
export function getAllowedEnterpriseHosts(enterprise: Pick<Enterprise, 'subdomain' | 'custom_domain'>): string[] {
  const hosts: string[] = []
  const subdomainHost = getEnterpriseSubdomainHost(enterprise.subdomain)
  if (subdomainHost != null) {
    hosts.push(subdomainHost)
  }
  const customDomain = enterprise.custom_domain?.trim().toLowerCase()
  if (customDomain != null && customDomain !== '') {
    hosts.push(customDomain)
  }
  return hosts
}

/**
 * Stripe Checkout 等の戻り先オリジンを解決する。
 * origin が許可ホストと一致すれば採用し、不一致・未指定時は正規 subdomain ホストへフォールバックする。
 */
export function resolveEnterpriseCheckoutOrigin(
  enterprise: Pick<Enterprise, 'subdomain' | 'custom_domain'>,
  origin?: string,
): string {
  const allowedHosts = getAllowedEnterpriseHosts(enterprise)
  const defaultHost = allowedHosts[0]
  if (defaultHost == null) {
    throw new Error('enterprise has no resolvable host')
  }

  if (origin != null && origin.trim() !== '') {
    try {
      const parsed = new URL(origin.trim())
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        const hostname = parsed.hostname.toLowerCase()
        if (allowedHosts.includes(hostname)) {
          return parsed.origin
        }
      }
    } catch {
      // fall through to default
    }
  }

  return `https://${defaultHost}`
}

export async function resolveEnterpriseByHostname(hostname: string): Promise<Enterprise | undefined> {
  const host = hostname.toLowerCase()
  const baseDomain = getEnterpriseBaseDomain()

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
