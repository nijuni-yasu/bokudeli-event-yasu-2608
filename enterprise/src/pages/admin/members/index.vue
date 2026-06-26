<script setup lang="ts">
import type { EnterpriseMemberListItem } from '@shokujii/common/apis/enterprise.js'
import type { EnterpriseMemberRoleType } from '@shokujii/common/schemas/Enterprise.js'
import { useNotification } from '@shokujii/base/composable/notification'
import { convertToDate } from '@shokujii/common/utils/datetime.js'
import { mdiAccountPlus, mdiUpload } from '@mdi/js'
import {
  createEnterpriseMembers,
  disableEnterpriseMember,
  enableEnterpriseMember,
  getEnterpriseMembers,
  updateEnterpriseMember,
  updateEnterpriseRole,
} from '@/apis/enterprise'
import { getEnterpriseIdFromToken } from '@/composable/useEnterpriseAdmin'
import { getAdminMembersImportPath } from '@/router/utils'

const { t } = useI18n()
const notification = useNotification()
const router = useRouter()

const loading = ref(false)
const enterpriseId = ref<string>()
const members = ref<EnterpriseMemberListItem[]>([])
const totalCount = ref(0)
const page = ref(1)
const pageSize = 50
const search = ref('')
const roleFilter = ref<EnterpriseMemberRoleType | 'all'>('all')
const activeFilter = ref<boolean | 'all'>('all')
const sortBy = ref<'display_name' | 'department' | 'role' | 'is_active' | 'created_at' | 'monthly_usage'>('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')

const showAddDialog = ref(false)
const showEditDialog = ref(false)
const addForm = reactive({ email: '', display_name: '', department: '', role: 'member' as EnterpriseMemberRoleType })
const editForm = reactive({ user_id: '', display_name: '', department: '' })
const confirmDialog = reactive({ open: false, title: '', message: '', action: async () => {} })
const submitting = ref(false)

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))

const loadMembers = async () => {
  if (enterpriseId.value == null) return
  loading.value = true
  try {
    const result = await getEnterpriseMembers({
      enterprise_id: enterpriseId.value,
      search: search.value.trim() !== '' ? search.value.trim() : undefined,
      role: roleFilter.value,
      is_active: activeFilter.value === 'all' ? undefined : activeFilter.value,
      sort_by: sortBy.value,
      sort_order: sortOrder.value,
      page: page.value,
      page_size: pageSize,
    })
    members.value = result.data.members
    totalCount.value = result.data.total_count
  } catch {
    notification.show(t('admin.members.load_failed'), 'error')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  enterpriseId.value = await getEnterpriseIdFromToken()
  await loadMembers()
})

watch([page, roleFilter, activeFilter, sortBy, sortOrder], () => {
  loadMembers()
})

const applySearch = () => {
  page.value = 1
  loadMembers()
}

const toggleSort = (column: typeof sortBy.value) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = 'asc'
  }
}

const openAddDialog = () => {
  addForm.email = ''
  addForm.display_name = ''
  addForm.department = ''
  addForm.role = 'member'
  showAddDialog.value = true
}

const submitAdd = async () => {
  if (enterpriseId.value == null) return
  submitting.value = true
  try {
    const result = await createEnterpriseMembers({
      enterprise_id: enterpriseId.value,
      members: [
        {
          email: addForm.email,
          display_name: addForm.display_name,
          department: addForm.department || undefined,
          role: addForm.role,
        },
      ],
    })
    const row = result.data.results[0]
    if (row?.status === 'success') {
      notification.show(t('admin.members.add_success'), 'success')
      showAddDialog.value = false
      await loadMembers()
    } else {
      notification.show(row?.error_message ?? t('admin.members.add_failed'), 'error')
    }
  } catch {
    notification.show(t('admin.members.add_failed'), 'error')
  } finally {
    submitting.value = false
  }
}

const openEditDialog = (member: EnterpriseMemberListItem) => {
  editForm.user_id = member.user_id
  editForm.display_name = member.display_name
  editForm.department = member.department ?? ''
  showEditDialog.value = true
}

const submitEdit = async () => {
  if (enterpriseId.value == null) return
  submitting.value = true
  try {
    await updateEnterpriseMember({
      enterprise_id: enterpriseId.value,
      user_id: editForm.user_id,
      display_name: editForm.display_name,
      department: editForm.department || undefined,
    })
    notification.show(t('admin.members.edit_success'), 'success')
    showEditDialog.value = false
    await loadMembers()
  } catch {
    notification.show(t('admin.members.edit_failed'), 'error')
  } finally {
    submitting.value = false
  }
}

const confirmDisable = (member: EnterpriseMemberListItem) => {
  confirmDialog.title = t('admin.members.disable_title')
  confirmDialog.message = t('admin.members.disable_message', { name: member.display_name })
  confirmDialog.action = async () => {
    if (enterpriseId.value == null) return
    await disableEnterpriseMember({ enterprise_id: enterpriseId.value, user_id: member.user_id })
    notification.show(t('admin.members.disable_success'), 'success')
    await loadMembers()
  }
  confirmDialog.open = true
}

const confirmEnable = (member: EnterpriseMemberListItem) => {
  confirmDialog.title = t('admin.members.enable_title')
  confirmDialog.message = t('admin.members.enable_message', { name: member.display_name })
  confirmDialog.action = async () => {
    if (enterpriseId.value == null) return
    await enableEnterpriseMember({ enterprise_id: enterpriseId.value, user_id: member.user_id })
    notification.show(t('admin.members.enable_success'), 'success')
    await loadMembers()
  }
  confirmDialog.open = true
}

const changeRole = async (member: EnterpriseMemberListItem, role: EnterpriseMemberRoleType) => {
  if (enterpriseId.value == null || member.role === role) return
  try {
    await updateEnterpriseRole({ enterprise_id: enterpriseId.value, user_id: member.user_id, role })
    notification.show(t('admin.members.role_success'), 'success')
    await loadMembers()
  } catch (error: unknown) {
    const message =
      typeof error === 'object' && error != null && 'message' in error
        ? String((error as { message: unknown }).message)
        : t('admin.members.role_failed')
    notification.show(message, 'error')
  }
}
</script>

<template>
  <v-container>
    <div class="d-flex flex-wrap align-center justify-space-between mb-6 ga-3">
      <h1 class="text-h4">{{ $t('admin.members.title') }}</h1>
      <div class="d-flex ga-2">
        <v-btn variant="outlined" :prepend-icon="mdiUpload" @click="router.push(getAdminMembersImportPath())">
          {{ $t('admin.members.csv_import') }}
        </v-btn>
        <v-btn color="primary" :prepend-icon="mdiAccountPlus" @click="openAddDialog">
          {{ $t('admin.members.add') }}
        </v-btn>
      </div>
    </div>

    <v-card>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              :label="$t('admin.members.search')"
              hide-details
              @keyup.enter="applySearch"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="roleFilter"
              :items="[
                { title: $t('admin.members.role_all'), value: 'all' },
                { title: $t('admin.members.role_admin'), value: 'admin' },
                { title: $t('admin.members.role_member'), value: 'member' },
              ]"
              item-title="title"
              item-value="value"
              :label="$t('admin.members.role_filter')"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="activeFilter"
              :items="[
                { title: $t('admin.members.status_all'), value: 'all' },
                { title: $t('admin.members.status_active'), value: true },
                { title: $t('admin.members.status_inactive'), value: false },
              ]"
              item-title="title"
              item-value="value"
              :label="$t('admin.members.status_filter')"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="2" class="d-flex align-center">
            <v-btn block @click="applySearch">{{ $t('admin.members.search_button') }}</v-btn>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <v-progress-linear v-if="loading" indeterminate />

      <div class="overflow-x-auto">
        <v-table density="comfortable">
          <thead>
            <tr>
              <th class="cursor-pointer" @click="toggleSort('display_name')">{{ $t('admin.members.col_name') }}</th>
              <th>{{ $t('admin.members.col_email') }}</th>
              <th class="cursor-pointer" @click="toggleSort('department')">{{ $t('admin.members.col_department') }}</th>
              <th class="cursor-pointer" @click="toggleSort('role')">{{ $t('admin.members.col_role') }}</th>
              <th class="cursor-pointer" @click="toggleSort('is_active')">{{ $t('admin.members.col_status') }}</th>
              <th class="cursor-pointer" @click="toggleSort('created_at')">{{ $t('admin.members.col_created') }}</th>
              <th>{{ $t('admin.members.col_actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in members" :key="member.user_id">
              <td>{{ member.display_name }}</td>
              <td>{{ member.email }}</td>
              <td>{{ member.department ?? '' }}</td>
              <td>
                <v-select
                  :model-value="member.role"
                  :items="[
                    { title: $t('admin.members.role_admin'), value: 'admin' },
                    { title: $t('admin.members.role_member'), value: 'member' },
                  ]"
                  item-title="title"
                  item-value="value"
                  density="compact"
                  hide-details
                  variant="outlined"
                  @update:model-value="(value) => changeRole(member, value as EnterpriseMemberRoleType)"
                />
              </td>
              <td>
                <v-chip :color="member.is_active ? 'success' : 'error'" size="small">
                  {{ member.is_active ? $t('admin.members.status_active') : $t('admin.members.status_inactive') }}
                </v-chip>
              </td>
              <td>{{ convertToDate(member.created_at) }}</td>
              <td>
                <v-btn size="small" variant="text" @click="openEditDialog(member)">{{
                  $t('admin.members.edit')
                }}</v-btn>
                <v-btn
                  v-if="member.is_active"
                  size="small"
                  variant="text"
                  color="error"
                  @click="confirmDisable(member)"
                >
                  {{ $t('admin.members.disable') }}
                </v-btn>
                <v-btn v-else size="small" variant="text" color="primary" @click="confirmEnable(member)">
                  {{ $t('admin.members.enable') }}
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <v-card-actions class="justify-center py-2">
        <v-btn :disabled="page <= 1" @click="page -= 1">{{ $t('admin.members.prev_page') }}</v-btn>
        <span>{{ page }} / {{ totalPages }} ({{ totalCount }})</span>
        <v-btn :disabled="page >= totalPages" @click="page += 1">{{ $t('admin.members.next_page') }}</v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="showAddDialog" max-width="520">
      <v-card>
        <v-card-title>{{ $t('admin.members.add_title') }}</v-card-title>
        <v-card-text>
          <div class="d-flex flex-column ga-4">
            <v-text-field v-model="addForm.email" :label="$t('admin.members.col_email')" />
            <v-text-field v-model="addForm.display_name" :label="$t('admin.members.col_name')" />
            <v-text-field v-model="addForm.department" :label="$t('admin.members.col_department')" />
            <v-select
              v-model="addForm.role"
              :items="[
                { title: $t('admin.members.role_member'), value: 'member' },
                { title: $t('admin.members.role_admin'), value: 'admin' },
              ]"
              item-title="title"
              item-value="value"
              :label="$t('admin.members.col_role')"
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showAddDialog = false">{{ $t('admin.common.cancel') }}</v-btn>
          <v-btn color="primary" :loading="submitting" @click="submitAdd">{{ $t('admin.members.add_submit') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showEditDialog" max-width="520">
      <v-card>
        <v-card-title>{{ $t('admin.members.edit_title') }}</v-card-title>
        <v-card-text>
          <div class="d-flex flex-column ga-4">
            <v-text-field v-model="editForm.display_name" :label="$t('admin.members.col_name')" />
            <v-text-field v-model="editForm.department" :label="$t('admin.members.col_department')" />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showEditDialog = false">{{ $t('admin.common.cancel') }}</v-btn>
          <v-btn color="primary" :loading="submitting" @click="submitEdit">{{ $t('admin.settings.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <confirm-dialog v-model="confirmDialog.open" :is-confirm="true" :ok-click="confirmDialog.action">
      <v-card-title>{{ confirmDialog.title }}</v-card-title>
      <v-card-text>{{ confirmDialog.message }}</v-card-text>
    </confirm-dialog>
  </v-container>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>

<route lang="yaml">
meta:
  layout: admin
</route>
