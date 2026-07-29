import { h, ref, type Ref } from 'vue'
import type { GetEnterpriseByDomainResponse } from '@shokujii/common/apis/enterprise.js'
import { layoutConfig as layoutsConfig } from '@layouts'
import { themeConfig } from '@themeConfig'
import defaultHeaderLogo from '@/assets/images/shokujii/shokujii_logo_wide.png'
import { withEnterpriseLogoCacheBust } from '@/utils/enterpriseLogoUrl'

const headerLogoSrc = ref<string>(defaultHeaderLogo)
const headerLogoAlt = ref<string>('shokujii')

export function useEnterpriseBranding(): {
  syncHeaderLogo: (enterprise: GetEnterpriseByDomainResponse | null) => void
  headerLogoSrc: Ref<string>
  headerLogoAlt: Ref<string>
} {
  function syncHeaderLogo(enterprise: GetEnterpriseByDomainResponse | null): void {
    const url = enterprise?.company_logo_url
    const baseSrc = url != null && url !== '' ? url : defaultHeaderLogo
    const src = withEnterpriseLogoCacheBust(baseSrc, enterprise?.updated_at ?? 0)
    const alt = enterprise?.company_name ?? 'shokujii'

    headerLogoSrc.value = src
    headerLogoAlt.value = alt

    const logo = h('img', {
      src,
      class: 'logo',
      alt,
    })

    themeConfig.app.logo = logo
    layoutsConfig.app.logo = logo
  }

  return { syncHeaderLogo, headerLogoSrc, headerLogoAlt }
}
