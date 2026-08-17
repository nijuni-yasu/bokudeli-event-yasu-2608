import type { Response } from 'express'
import { getEnterpriseById } from '../stores/enterprise.js'
import { isOriginAllowedForEnterprise } from './enterpriseBaseDomain.js'

export function parseStaticCorsOrigins(): string[] {
  const raw = process.env.CORS
  if (raw == null || raw === '') {
    return []
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function applyEnterpriseBillInvoiceCorsHeaders(res: Response, allowedOrigin: string | undefined): void {
  if (allowedOrigin == null) {
    return
  }
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Vary', 'Origin')
}

export async function resolveEnterpriseBillInvoiceCorsOrigin(
  origin: string | undefined,
  enterpriseId: string,
): Promise<string | undefined> {
  if (origin == null || origin === '') {
    return undefined
  }

  const trimmedOrigin = origin.trim()
  if (trimmedOrigin === '') {
    return undefined
  }

  const staticOrigins = parseStaticCorsOrigins()
  if (staticOrigins.includes(trimmedOrigin)) {
    return trimmedOrigin
  }

  const enterprise = await getEnterpriseById(enterpriseId)
  if (enterprise == null) {
    return undefined
  }
  if (!isOriginAllowedForEnterprise(trimmedOrigin, enterprise)) {
    return undefined
  }

  return new URL(trimmedOrigin).origin
}

export type EnterpriseBillInvoiceCorsRequest = {
  method?: string
  headers: Record<string, string | string[] | undefined>
}

/** 動的 CORS を適用。OPTIONS はここで完結。許可外 Origin の GET 等は 403。 */
export async function handleEnterpriseBillInvoiceCors(
  req: EnterpriseBillInvoiceCorsRequest,
  res: Response,
  enterpriseId: string,
): Promise<'continue' | 'handled'> {
  const rawOrigin = req.headers.origin
  const origin = typeof rawOrigin === 'string' ? rawOrigin : undefined
  const allowedOrigin = await resolveEnterpriseBillInvoiceCorsOrigin(origin, enterpriseId)
  applyEnterpriseBillInvoiceCorsHeaders(res, allowedOrigin)

  if (req.method === 'OPTIONS') {
    res.status(allowedOrigin != null ? 204 : 403).send('')
    return 'handled'
  }

  if (origin != null && allowedOrigin == null) {
    res.status(403).send('Forbidden')
    return 'handled'
  }

  return 'continue'
}
