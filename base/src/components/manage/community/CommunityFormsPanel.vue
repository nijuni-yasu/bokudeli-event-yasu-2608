<script setup lang="ts">
import { useAppCommunityStore } from '@shokujii/base/composable/useAppCommunityStore.js'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { archiveCommunityForm, duplicateCommunityForm, listCommunityForms } from '@shokujii/base/apis/form.js'
import type { CommunityFormSummary } from '@shokujii/common/apis/form.js'
import { convertToDatetime } from '@shokujii/common/utils/datetime.js'
import { getManageCommunityFormEditPath, getManageCommunityFormNewPath } from '@/router/utils'
import { mdiPlus } from '@mdi/js'

const { t: $t } = useI18n()
const router = useRouter()
const notification = useNotification()
const communityAccount = useRoute().params.communityAccount as string
const communityStore = useAppCommunityStore(communityAccount)
const communityId = computed(() => communityStore.community?.community_id ?? '')

const forms = ref<CommunityFormSummary[]>([])
const loading = ref(false)

const load = async () => {
  if (communityId.value === '') {
    return
  }
  loading.value = true
  try {
    const response = await listCommunityForms({ community_id: communityId.value })
    forms.value = response.data.forms
  } catch {
    notification.show($t('manage.forms.load_failed'), 'error')
  } finally {
    loading.value = false
  }
}

watch(
  communityId,
  () => {
    void load()
  },
  { immediate: true },
)

const goNew = () => {
  void router.push(getManageCommunityFormNewPath(communityAccount))
}

const goEdit = (formId: string) => {
  void router.push(getManageCommunityFormEditPath(communityAccount, formId))
}

const duplicate = async (formId: string) => {
  try {
    const response = await duplicateCommunityForm({ community_id: communityId.value, form_id: formId })
    notification.show($t('manage.forms.saved'), 'success')
    void router.push(getManageCommunityFormEditPath(communityAccount, response.data.form.form_id))
  } catch {
    notification.show($t('manage.forms.save_failed'), 'error')
  }
}

const toggleArchive = async (form: CommunityFormSummary) => {
  try {
    await archiveCommunityForm({
      community_id: communityId.value,
      form_id: form.form_id,
      archived: !form.archived,
    })
    await load()
  } catch {
    notification.show($t('manage.forms.save_failed'), 'error')
  }
}
</script>

<template>
  <v-container class="manage-container">
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="text-h6">{{ $t('manage.forms.title') }}</div>
      <v-btn color="primary" :prepend-icon="mdiPlus" @click="goNew">{{ $t('manage.forms.create') }}</v-btn>
    </div>
    <v-progress-linear v-if="loading" indeterminate />
    <v-alert v-else-if="forms.length === 0" type="info" variant="tonal">{{ $t('manage.forms.empty') }}</v-alert>
    <v-table v-else>
      <thead>
        <tr>
          <th>{{ $t('manage.forms.name') }}</th>
          <th>{{ $t('manage.forms.fields') }}</th>
          <th>{{ $t('manage.forms.updated_at') }}</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="form in forms" :key="form.form_id">
          <td>
            {{ form.name }}
            <v-chip v-if="form.archived" size="small" class="ml-2">{{ $t('manage.forms.archived') }}</v-chip>
          </td>
          <td>{{ form.field_count }}</td>
          <td>{{ convertToDatetime(form.updated_at) }}</td>
          <td class="text-right">
            <v-btn variant="text" size="small" @click="goEdit(form.form_id)">{{ $t('manage.forms.edit') }}</v-btn>
            <v-btn variant="text" size="small" @click="duplicate(form.form_id)">{{
              $t('manage.forms.duplicate')
            }}</v-btn>
            <v-btn variant="text" size="small" @click="toggleArchive(form)">
              {{ form.archived ? $t('manage.forms.unarchive') : $t('manage.forms.archive') }}
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-container>
</template>
