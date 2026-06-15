import type { Ref } from 'vue'
import { useEnterpriseId } from '@/composable/useEnterpriseId'

type EnterpriseIdRef = Ref<string | null | undefined>

/**
 * 読み込み済みドキュメントの enterprise_id が現在テナントと一致するか検証する。
 * 不一致時は 404 相当の UI を表示する用途。
 */
export function useEnterpriseTenantGuard(documentEnterpriseIds: EnterpriseIdRef[]) {
  const { enterpriseId } = useEnterpriseId()

  const isTenantMismatch = computed(() => {
    const current = enterpriseId.value
    if (current == null) {
      return false
    }
    return documentEnterpriseIds.some((ref) => {
      const docEnterpriseId = ref.value
      return docEnterpriseId != null && docEnterpriseId !== '' && docEnterpriseId !== current
    })
  })

  return { isTenantMismatch, enterpriseId }
}
