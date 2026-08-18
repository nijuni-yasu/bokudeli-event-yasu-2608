<script setup lang="ts">
import { ENTERPRISE_MEMBER_ROLE_VALUES, type EnterpriseMemberRoleType } from '@shokujii/common/schemas/Enterprise.js'
import CsvImportPanel from '@/components/admin/CsvImportPanel.vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import { createEnterpriseMembers } from '@/apis/enterprise'
import { getEnterpriseIdFromToken } from '@/composable/useEnterpriseAdmin'
import { useNotification } from '@shokujii/base/composable/notification'

const { t } = useI18n()
const notification = useNotification()

const templateHeaders = ['email', 'display_name', 'department', 'role']
const panelRef = ref<InstanceType<typeof CsvImportPanel> | null>(null)
const loading = ref(false)
const enterpriseId = ref<string>()

onMounted(async () => {
  try {
    enterpriseId.value = await getEnterpriseIdFromToken()
  } catch {
    notification.show(t('admin.members.import_failed'), 'error')
  }
})

const resolveRole = (rawRole: string): EnterpriseMemberRoleType => {
  const role = ENTERPRISE_MEMBER_ROLE_VALUES.find((value) => value === rawRole)
  return role ?? 'member'
}

const handleExecute = async (rows: string[][]) => {
  if (enterpriseId.value == null) {
    notification.show(t('admin.members.import_failed'), 'error')
    return
  }
  loading.value = true
  try {
    const members = rows.map((cells) => ({
      email: cells[0] ?? '',
      display_name: cells[1] ?? '',
      department: cells[2] || undefined,
      role: resolveRole(cells[3]?.trim() ?? ''),
    }))

    const result = await createEnterpriseMembers({
      enterprise_id: enterpriseId.value,
      members,
    })

    panelRef.value?.showResults(
      result.data.results.map((item) => ({
        row: item.row,
        label: item.email,
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
    notification.show(t('admin.members.import_failed'), 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container>
    <AdminPageHeader :title="$t('admin.members.import_title')" :description="$t('admin.members.import_description')" />

    <CsvImportPanel
      ref="panelRef"
      :description="$t('admin.members.import_format')"
      template-filename="enterprise_members_template.csv"
      :template-headers="templateHeaders"
      :preview-headers="templateHeaders"
      :result-headers="[
        { title: $t('admin.csv.row'), key: 'row' },
        { title: $t('admin.members.col_email'), key: 'label' },
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
