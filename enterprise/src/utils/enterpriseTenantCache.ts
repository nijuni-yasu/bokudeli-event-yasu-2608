import type { GetEnterpriseByDomainResponse } from '@shokujii/common/apis/enterprise.js'
import { resolveTenantHost } from '@/utils/tenantHost'

const CACHE_KEY_PREFIX = 'shokujii:enterprise:tenant:v1:'

export type EnterpriseTenantCacheEntry = {
  tenant_id: string
  enterprise_id: string
  cached_at: number
}

function cacheStorageKey(hostname: string): string {
  return `${CACHE_KEY_PREFIX}${hostname}`
}

function isValidEntry(value: unknown): value is EnterpriseTenantCacheEntry {
  if (typeof value !== 'object' || value == null) {
    return false
  }
  const record = value as Record<string, unknown>
  return (
    typeof record.tenant_id === 'string' &&
    record.tenant_id !== '' &&
    typeof record.enterprise_id === 'string' &&
    record.enterprise_id !== '' &&
    typeof record.cached_at === 'number'
  )
}

function readValidatedEntry(): EnterpriseTenantCacheEntry | null {
  if (typeof localStorage === 'undefined') {
    return null
  }
  const hostname = resolveTenantHost()
  try {
    const raw = localStorage.getItem(cacheStorageKey(hostname))
    if (raw == null || raw === '') {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isValidEntry(parsed)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

/** 現在ホストに紐づくキャッシュ tenant_id（Auth 復元前の同期 bootstrap 用） */
export function readCachedEnterpriseTenantId(): string | null {
  return readValidatedEntry()?.tenant_id ?? null
}

export function readCachedEnterpriseTenantEntry(): EnterpriseTenantCacheEntry | null {
  return readValidatedEntry()
}

export function writeEnterpriseTenantCache(
  enterprise: Pick<GetEnterpriseByDomainResponse, 'tenant_id' | 'enterprise_id'>,
): void {
  if (typeof localStorage === 'undefined') {
    return
  }
  if (enterprise.tenant_id === '' || enterprise.enterprise_id === '') {
    return
  }
  const hostname = resolveTenantHost()
  const entry: EnterpriseTenantCacheEntry = {
    tenant_id: enterprise.tenant_id,
    enterprise_id: enterprise.enterprise_id,
    cached_at: Date.now(),
  }
  try {
    localStorage.setItem(cacheStorageKey(hostname), JSON.stringify(entry))
  } catch {
    // quota / private mode — bootstrap は Callable 解決にフォールバック
  }
}
