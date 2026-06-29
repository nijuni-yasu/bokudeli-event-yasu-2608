<script setup lang="ts">
import { convertToDate } from '@shokujii/common/utils/datetime.js'
import { mdiOpenInNew, mdiUpload } from '@mdi/js'
import { getCommunityPath, getAdminCommunitiesImportPath, getManageCommunityPath } from '@/router/utils'
import { getEnterpriseCommunities } from '@/apis/enterprise'
import { getEnterpriseIdFromToken } from '@/composable/useEnterpriseAdmin'
import { useNotification } from '@shokujii/base/composable/notification'
import AdminEmptyState from '@/components/admin/AdminEmptyState.vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'

const { t } = useI18n()
const notification = useNotification()
const router = useRouter()

const loading = ref(false)
const enterpriseId = ref<string>()
const communities = ref<
  {
    community_id: string
    community_name: string
    community_account: string
    community_num_members: number
    created_at: number
    manager_display_names?: string[]
  }[]
>([])
const totalCount = ref(0)
const page = ref(1)
const pageSize = 50

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))

const paginationRangeText = computed(() => {
  if (totalCount.value === 0) {
    return t('admin.common.pagination_empty')
  }
  const start = (page.value - 1) * pageSize + 1
  const end = Math.min(page.value * pageSize, totalCount.value)
  return t('admin.common.pagination_range', { total: totalCount.value, start, end })
})

const managersDisplay = (community: (typeof communities.value)[number]) =>
  community.manager_display_names?.join(', ') ?? ''

const loadCommunities = async () => {
  if (enterpriseId.value == null) return
  loading.value = true
  try {
    const result = await getEnterpriseCommunities({
      enterprise_id: enterpriseId.value,
      page: page.value,
      page_size: pageSize,
    })
    communities.value = result.data.communities
    totalCount.value = result.data.total_count
  } catch {
    notification.show(t('admin.communities.load_failed'), 'error')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  enterpriseId.value = await getEnterpriseIdFromToken()
  await loadCommunities()
})

watch(page, loadCommunities)
</script>

<template>
  <v-container>
    <AdminPageHeader :title="$t('admin.communities.title')">
      <template #actions>
        <v-btn variant="outlined" :prepend-icon="mdiUpload" @click="router.push(getAdminCommunitiesImportPath())">
          {{ $t('admin.communities.csv_import') }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <v-card>
      <v-progress-linear v-if="loading" indeterminate />

      <AdminEmptyState v-else-if="communities.length === 0" :message="$t('admin.communities.empty')">
        <template #actions>
          <v-btn variant="outlined" :prepend-icon="mdiUpload" @click="router.push(getAdminCommunitiesImportPath())">
            {{ $t('admin.communities.csv_import') }}
          </v-btn>
        </template>
      </AdminEmptyState>

      <template v-else>
        <div class="overflow-x-auto">
          <v-table density="comfortable">
            <thead>
              <tr>
                <th>{{ $t('admin.communities.col_name') }}</th>
                <th>{{ $t('admin.communities.col_account') }}</th>
                <th>{{ $t('admin.communities.col_managers') }}</th>
                <th class="text-right admin-tabular-nums">{{ $t('admin.communities.col_members') }}</th>
                <th>{{ $t('admin.communities.col_created') }}</th>
                <th>{{ $t('admin.communities.col_actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="community in communities" :key="community.community_id">
                <td>{{ community.community_name }}</td>
                <td>{{ community.community_account }}</td>
                <td class="text-truncate managers-cell">
                  <v-tooltip v-if="managersDisplay(community) !== ''" :text="managersDisplay(community)" location="top">
                    <template #activator="{ props: tooltipProps }">
                      <span v-bind="tooltipProps">{{ managersDisplay(community) }}</span>
                    </template>
                  </v-tooltip>
                </td>
                <td class="text-right admin-tabular-nums">{{ community.community_num_members }}</td>
                <td>{{ convertToDate(community.created_at) }}</td>
                <td class="text-no-wrap">
                  <v-btn
                    size="small"
                    variant="text"
                    :to="getCommunityPath(community.community_account)"
                    target="_blank"
                    :append-icon="mdiOpenInNew"
                  >
                    {{ $t('admin.communities.view_public') }}
                  </v-btn>
                  <v-btn size="small" variant="text" :to="getManageCommunityPath(community.community_account)">
                    {{ $t('admin.communities.view_manage') }}
                  </v-btn>
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
  </v-container>
</template>

<style scoped>
.managers-cell {
  max-width: 12rem;
}
</style>

<route lang="yaml">
meta:
  layout: admin
</route>
