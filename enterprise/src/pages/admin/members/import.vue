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

const parseRole = (rawRole: string): EnterpriseMemberRoleType | null => {
  const trimmed = rawRole.trim()
  if (trimmed === '') {
    return 'member'
  }
  return ENTERPRISE_MEMBER_ROLE_VALUES.find((value) => value === trimmed) ?? null
}

const handleExecute = async (rows: string[][]) => {
  if (enterpriseId.value == null) {
    notification.show(t('admin.members.import_failed'), 'error')
    return
  }
  loading.value = true
  try {
    const clientErrors: Array<{
      row: number
      label: string
      status: 'error'
      error_message: string
    }> = []
    const membersToSend: Array<{
      row: number
      member: {
        email: string
        display_name: string
        department?: string
        role: EnterpriseMemberRoleType
      }
    }> = []

    rows.forEach((cells, index) => {
      const rowNum = index + 1
      const role = parseRole(cells[3] ?? '')
      if (role == null) {
        clientErrors.push({
          row: rowNum,
          label: cells[0] ?? '',
          status: 'error',
          error_message: 'ロールが不正です',
        })
        return
      }
      membersToSend.push({
        row: rowNum,
        member: {
          email: cells[0] ?? '',
          display_name: cells[1] ?? '',
          department: cells[2] || undefined,
          role,
        },
      })
    })

    const apiResults: Array<{
      row: number
      label: string
      status: string
      error_message?: string
    }> = []

    if (membersToSend.length > 0) {
      const result = await createEnterpriseMembers({
        enterprise_id: enterpriseId.value,
        members: membersToSend.map((item) => item.member),
      })

      apiResults.push(
        ...result.data.results.map((item) => {
          const sentIndex = item.row - 1
          const originalRow = membersToSend[sentIndex]?.row ?? item.row
          return {
            row: originalRow,
            label: item.email,
            status: item.status,
            error_message: item.error_message,
          }
        }),
      )

      const errorCount = clientErrors.length + result.data.error_count
      const successCount = result.data.success_count
      notification.show(
        t('admin.csv.result_summary', {
          success: successCount,
          error: errorCount,
        }),
        errorCount === 0 ? 'success' : 'warning',
      )
    } else {
      notification.show(
        t('admin.csv.result_summary', {
          success: 0,
          error: clientErrors.length,
        }),
        'warning',
      )
    }

    panelRef.value?.showResults([...clientErrors, ...apiResults])
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
