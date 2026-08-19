<script setup lang="ts">
import type { EnterpriseMemberListItem } from '@shokujii/common/apis/enterprise.js'
import type { EnterpriseMemberRoleType } from '@shokujii/common/schemas/Enterprise.js'
import { FirebaseError } from 'firebase/app'
import { useNotification } from '@shokujii/base/composable/notification'
import { convertToDate } from '@shokujii/common/utils/datetime.js'
import { mdiAccountPlus, mdiArrowDown, mdiArrowUp, mdiDotsVertical, mdiUpload } from '@mdi/js'
import {
  createEnterpriseMembers,
  disableEnterpriseMember,
  enableEnterpriseMember,
  getEnterpriseMembers,
  updateEnterpriseMember,
  updateEnterpriseRole,
} from '@/apis/enterprise'
import AdminEmptyState from '@/components/admin/AdminEmptyState.vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
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
const sortBy = ref<'display_name' | 'department' | 'role' | 'is_active' | 'created_at'>('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')

const showAddDialog = ref(false)
const showEditDialog = ref(false)
const addForm = reactive({ email: '', display_name: '', department: '', role: 'member' as EnterpriseMemberRoleType })
const editForm = reactive({ user_id: '', display_name: '', department: '' })
const confirmDialog = reactive({ open: false, title: '', message: '', action: async () => {} })
const submitting = ref(false)

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))

const paginationRangeText = computed(() => {
  if (totalCount.value === 0) {
    return t('admin.common.pagination_empty')
  }
  const start = (page.value - 1) * pageSize + 1
  const end = Math.min(page.value * pageSize, totalCount.value)
  return t('admin.common.pagination_range', { total: totalCount.value, start, end })
})

const hasActiveFilters = computed(
  () => search.value.trim() !== '' || roleFilter.value !== 'all' || activeFilter.value !== 'all',
)

const roleLabel = (role: EnterpriseMemberRoleType) =>
  role === 'admin' ? t('admin.members.role_admin') : t('admin.members.role_member')

/** 業務エラー（最低 1 人の管理者が必要 等）はサーバー文言をそのまま出し、それ以外は既定文言にフォールバックする */
const resolveCallableErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof FirebaseError && error.code === 'functions/failed-precondition' ? error.message : fallback

const sortIcon = (column: typeof sortBy.value) => {
  if (sortBy.value !== column) return undefined
  return sortOrder.value === 'asc' ? mdiArrowUp : mdiArrowDown
}

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
  try {
    enterpriseId.value = await getEnterpriseIdFromToken()
  } catch {
    notification.show(t('admin.members.load_failed'), 'error')
  }
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
    try {
      await disableEnterpriseMember({ enterprise_id: enterpriseId.value, user_id: member.user_id })
      notification.show(t('admin.members.disable_success'), 'success')
      await loadMembers()
    } catch (error: unknown) {
      notification.show(resolveCallableErrorMessage(error, t('admin.members.disable_failed')), 'error')
    }
  }
  confirmDialog.open = true
}

const confirmEnable = (member: EnterpriseMemberListItem) => {
  confirmDialog.title = t('admin.members.enable_title')
  confirmDialog.message = t('admin.members.enable_message', { name: member.display_name })
  confirmDialog.action = async () => {
    if (enterpriseId.value == null) return
    try {
      await enableEnterpriseMember({ enterprise_id: enterpriseId.value, user_id: member.user_id })
      notification.show(t('admin.members.enable_success'), 'success')
      await loadMembers()
    } catch (error: unknown) {
      notification.show(resolveCallableErrorMessage(error, t('admin.members.enable_failed')), 'error')
    }
  }
  confirmDialog.open = true
}

const confirmRoleChange = (member: EnterpriseMemberListItem, role: EnterpriseMemberRoleType) => {
  if (member.role === role) return
  confirmDialog.title = t('admin.members.role_change_title')
  confirmDialog.message = t('admin.members.role_change_message', { name: member.display_name, role: roleLabel(role) })
  confirmDialog.action = async () => {
    if (enterpriseId.value == null) return
    try {
      await updateEnterpriseRole({ enterprise_id: enterpriseId.value, user_id: member.user_id, role })
      notification.show(t('admin.members.role_success'), 'success')
      await loadMembers()
    } catch (error: unknown) {
      notification.show(resolveCallableErrorMessage(error, t('admin.members.role_failed')), 'error')
    }
  }
  confirmDialog.open = true
}
</script>

<template>
  <v-container>
    <AdminPageHeader :title="$t('admin.members.title')">
      <template #actions>
        <v-btn variant="outlined" :prepend-icon="mdiUpload" @click="router.push(getAdminMembersImportPath())">
          {{ $t('admin.members.csv_import') }}
        </v-btn>
        <v-btn color="primary" :prepend-icon="mdiAccountPlus" @click="openAddDialog">
          {{ $t('admin.members.add') }}
        </v-btn>
      </template>
    </AdminPageHeader>

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

      <AdminEmptyState
        v-else-if="members.length === 0"
        :message="hasActiveFilters ? $t('admin.members.empty_filtered') : $t('admin.members.empty')"
      >
        <template v-if="!hasActiveFilters" #actions>
          <v-btn variant="outlined" :prepend-icon="mdiUpload" @click="router.push(getAdminMembersImportPath())">
            {{ $t('admin.members.csv_import') }}
          </v-btn>
          <v-btn color="primary" :prepend-icon="mdiAccountPlus" @click="openAddDialog">
            {{ $t('admin.members.add') }}
          </v-btn>
        </template>
      </AdminEmptyState>

      <template v-else>
        <div class="overflow-x-auto">
          <v-table density="comfortable">
            <thead>
              <tr>
                <th class="admin-sortable-th" @click="toggleSort('display_name')">
                  {{ $t('admin.members.col_name') }}
                  <v-icon v-if="sortIcon('display_name') != null" :icon="sortIcon('display_name')" size="small" />
                </th>
                <th>{{ $t('admin.members.col_email') }}</th>
                <th class="admin-sortable-th" @click="toggleSort('department')">
                  {{ $t('admin.members.col_department') }}
                  <v-icon v-if="sortIcon('department') != null" :icon="sortIcon('department')" size="small" />
                </th>
                <th class="admin-sortable-th" @click="toggleSort('role')">
                  {{ $t('admin.members.col_role') }}
                  <v-icon v-if="sortIcon('role') != null" :icon="sortIcon('role')" size="small" />
                </th>
                <th class="admin-sortable-th" @click="toggleSort('is_active')">
                  {{ $t('admin.members.col_status') }}
                  <v-icon v-if="sortIcon('is_active') != null" :icon="sortIcon('is_active')" size="small" />
                </th>
                <th class="admin-sortable-th" @click="toggleSort('created_at')">
                  {{ $t('admin.members.col_created') }}
                  <v-icon v-if="sortIcon('created_at') != null" :icon="sortIcon('created_at')" size="small" />
                </th>
                <th>{{ $t('admin.members.col_actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in members" :key="member.user_id">
                <td>{{ member.display_name }}</td>
                <td>{{ member.email }}</td>
                <td>{{ member.department ?? '' }}</td>
                <td>
                  <v-chip size="small" :color="member.role === 'admin' ? 'primary' : undefined" variant="tonal">
                    {{ roleLabel(member.role) }}
                  </v-chip>
                </td>
                <td>
                  <v-chip :color="member.is_active ? 'success' : 'error'" size="small">
                    {{ member.is_active ? $t('admin.members.status_active') : $t('admin.members.status_inactive') }}
                  </v-chip>
                </td>
                <td>{{ convertToDate(member.created_at) }}</td>
                <td>
                  <v-menu location="bottom end">
                    <template #activator="{ props: menuProps }">
                      <v-btn
                        size="small"
                        variant="text"
                        icon
                        v-bind="menuProps"
                        :aria-label="$t('admin.members.col_actions')"
                      >
                        <v-icon :icon="mdiDotsVertical" />
                      </v-btn>
                    </template>
                    <v-list density="compact" min-width="180">
                      <v-list-item :title="$t('admin.members.edit')" @click="openEditDialog(member)" />
                      <v-list-item
                        v-if="member.role !== 'admin'"
                        :title="$t('admin.members.role_admin')"
                        @click="confirmRoleChange(member, 'admin')"
                      />
                      <v-list-item
                        v-if="member.role !== 'member'"
                        :title="$t('admin.members.role_member')"
                        @click="confirmRoleChange(member, 'member')"
                      />
                      <v-divider />
                      <v-list-item
                        v-if="member.is_active"
                        :title="$t('admin.members.disable')"
                        base-color="error"
                        @click="confirmDisable(member)"
                      />
                      <v-list-item v-else :title="$t('admin.members.enable')" @click="confirmEnable(member)" />
                    </v-list>
                  </v-menu>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <v-card-actions class="justify-center py-2 flex-wrap ga-2">
          <v-btn :disabled="page <= 1" @click="page -= 1">{{ $t('admin.members.prev_page') }}</v-btn>
          <span>{{ paginationRangeText }}</span>
          <v-btn :disabled="page >= totalPages" @click="page += 1">{{ $t('admin.members.next_page') }}</v-btn>
        </v-card-actions>
      </template>
    </v-card>

    <v-dialog v-model="showAddDialog" max-width="520">
      <v-card>
        <v-card-title>{{ $t('admin.members.add_title') }}</v-card-title>
        <v-card-text>
          <div class="d-flex flex-column ga-4">
            <v-text-field v-model="addForm.email" type="email" :label="$t('admin.members.col_email')" />
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

<route lang="yaml">
meta:
  layout: admin
</route>
