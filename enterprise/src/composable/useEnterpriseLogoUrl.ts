import { computed, type ComputedRef } from 'vue'
import type { GetEnterpriseByDomainResponse } from '@shokujii/common/apis/enterprise.js'
import { useEnterpriseStore } from '@/stores/enterprise'
import { withEnterpriseLogoCacheBust } from '@/utils/enterpriseLogoUrl'
import defaultLoginLogo from '@/assets/images/shokujii/shokujii_logo.png'

export function resolveEnterpriseLoginLogoUrl(enterprise: GetEnterpriseByDomainResponse | null): string {
  const url = enterprise?.company_logo_url
  if (url != null && url !== '') {
    return url
  }
  return defaultLoginLogo
}

export function useEnterpriseLogoUrl(): { logoUrl: ComputedRef<string>; companyName: ComputedRef<string> } {
  const enterpriseStore = useEnterpriseStore()

  const logoUrl = computed(() => {
    const base = resolveEnterpriseLoginLogoUrl(enterpriseStore.enterprise)
    return withEnterpriseLogoCacheBust(base, enterpriseStore.logoRenderGeneration)
  })
  const companyName = computed(() => enterpriseStore.enterprise?.company_name ?? '')

  return { logoUrl, companyName }
}
