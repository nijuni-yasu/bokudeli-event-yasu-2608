import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GetEnterpriseByDomainResponse } from '@shokujii/common/apis/enterprise.js'
import { getEnterpriseByDomain } from '@/apis/enterprise'

export type EnterpriseResolveStatus = 'loading' | 'ready' | 'not_found' | 'error'

export const useEnterpriseStore = defineStore('enterprise', () => {
  const enterprise = ref<GetEnterpriseByDomainResponse | null>(null)
  const status = ref<EnterpriseResolveStatus>('loading')

  function resolveHostname(): string {
    const subdomain = import.meta.env.VITE_ENTERPRISE_SUBDOMAIN
    const baseDomain = import.meta.env.VITE_ENTERPRISE_BASE_DOMAIN
    if (subdomain != null && subdomain !== '' && baseDomain != null && baseDomain !== '') {
      return `${subdomain}.${baseDomain}`
    }
    return window.location.hostname
  }

  async function resolveEnterprise(): Promise<void> {
    status.value = 'loading'
    try {
      const hostname = resolveHostname()
      const result = await getEnterpriseByDomain({ hostname })
      enterprise.value = result.data
      status.value = 'ready'
    } catch (error: unknown) {
      enterprise.value = null
      const code =
        typeof error === 'object' &&
        error != null &&
        'code' in error &&
        typeof (error as { code: unknown }).code === 'string'
          ? (error as { code: string }).code
          : undefined
      status.value = code === 'functions/not-found' ? 'not_found' : 'error'
    }
  }

  return {
    enterprise,
    status,
    resolveEnterprise,
    resolveHostname,
  }
})
