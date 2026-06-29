<script setup lang="ts">
import CsvImportPanel from '@/components/admin/CsvImportPanel.vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import { createEnterpriseCommunities } from '@/apis/enterprise'
import { getEnterpriseIdFromToken } from '@/composable/useEnterpriseAdmin'
import { useNotification } from '@shokujii/base/composable/notification'

const { t } = useI18n()
const notification = useNotification()

const templateHeaders = ['community_name', 'community_account', 'description', 'manager_email']
const panelRef = ref<InstanceType<typeof CsvImportPanel> | null>(null)
const loading = ref(false)
const enterpriseId = ref<string>()

onMounted(async () => {
  enterpriseId.value = await getEnterpriseIdFromToken()
})

const handleExecute = async (rows: string[][]) => {
  if (enterpriseId.value == null) return
  loading.value = true
  try {
    const communities = rows.map((cells) => ({
      community_name: cells[0] ?? '',
      community_account: cells[1] ?? '',
      description: cells[2] || undefined,
      manager_email: cells[3] ?? '',
    }))

    const result = await createEnterpriseCommunities({
      enterprise_id: enterpriseId.value,
      communities,
    })

    panelRef.value?.showResults(
      result.data.results.map((item) => ({
        row: item.row,
        label: item.community_name,
        status: item.status,
        error_message: item.error_message,
      })),
    )

    notification.show(
      t('admin.csv.result_summary', {
        success: result.data.success_count,
        error: result.data.error_count,
      }),
      result.data.error_count === 0 ? 'success' : 'warning',
    )
  } catch {
    notification.show(t('admin.communities.import_failed'), 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container>
    <AdminPageHeader
      :title="$t('admin.communities.import_title')"
      :description="$t('admin.communities.import_description')"
    />

    <CsvImportPanel
      ref="panelRef"
      :description="$t('admin.communities.import_format')"
      template-filename="enterprise_communities_template.csv"
      :template-headers="templateHeaders"
      :preview-headers="templateHeaders"
      :result-headers="[
        { title: $t('admin.csv.row'), key: 'row' },
        { title: $t('admin.communities.col_name'), key: 'label' },
        { title: $t('admin.csv.status'), key: 'status' },
        { title: $t('admin.csv.message'), key: 'message' },
      ]"
      :loading="loading"
      @execute="handleExecute"
    />
  </v-container>
</template>

<route lang="yaml">
meta:
  layout: admin
</route>
