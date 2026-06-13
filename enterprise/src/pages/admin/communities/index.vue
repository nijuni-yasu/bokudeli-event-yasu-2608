<script setup lang="ts">
import { convertToDate } from '@shokujii/common/utils/datetime.js'
import { mdiUpload } from '@mdi/js'
import { getCommunityPath, getAdminCommunitiesImportPath } from '@/router/utils'
import { getEnterpriseCommunities } from '@/apis/enterprise'
import { getEnterpriseIdFromToken } from '@/composable/useEnterpriseAdmin'
import { useNotification } from '@shokujii/base/composable/notification'

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
    <div class="d-flex flex-wrap align-center justify-space-between mb-6 ga-3">
      <h1 class="text-h4">{{ $t('admin.communities.title') }}</h1>
      <v-btn variant="outlined" :prepend-icon="mdiUpload" @click="router.push(getAdminCommunitiesImportPath())">
        {{ $t('admin.communities.csv_import') }}
      </v-btn>
    </div>

    <v-card>
      <v-progress-linear v-if="loading" indeterminate />

      <div class="overflow-x-auto">
        <v-table density="comfortable">
          <thead>
            <tr>
              <th>{{ $t('admin.communities.col_name') }}</th>
              <th>{{ $t('admin.communities.col_account') }}</th>
              <th>{{ $t('admin.communities.col_managers') }}</th>
              <th>{{ $t('admin.communities.col_members') }}</th>
              <th>{{ $t('admin.communities.col_created') }}</th>
              <th>{{ $t('admin.communities.col_actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="community in communities" :key="community.community_id">
              <td>{{ community.community_name }}</td>
              <td>{{ community.community_account }}</td>
              <td>{{ community.manager_display_names?.join(', ') ?? '' }}</td>
              <td>{{ community.community_num_members }}</td>
              <td>{{ convertToDate(community.created_at) }}</td>
              <td>
                <v-btn size="small" variant="text" :to="getCommunityPath(community.community_account)" target="_blank">
                  {{ $t('admin.communities.view') }}
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
  </v-container>
</template>

<route lang="yaml">
meta:
  layout: admin
</route>
