import { storeToRefs } from 'pinia'
import { useEnterpriseStore } from '@/stores/enterprise'

/** 現在のテナント enterprise_id（resolveEnterprise 済みの画面でのみ利用） */
export function useEnterpriseId() {
  const enterpriseStore = useEnterpriseStore()
  const { enterprise } = storeToRefs(enterpriseStore)

  const enterpriseId = computed(() => enterprise.value?.enterprise_id ?? null)

  return { enterpriseId, enterpriseStore }
}
