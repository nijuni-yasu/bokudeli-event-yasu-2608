<script setup lang="ts">
import CommunityEdit from '@shokujii/base/components/CommunityEdit.vue'
import { getManageCommunityPath } from '@/router/utils'
import { BokudeliCommunity, createNewCommunity } from '@shokujii/base/stores/community.js'
import { useCommunityListStore } from '@shokujii/base/stores/communityList.js'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { getCommunityDefaultImages } from '@shokujii/base/utils/defaultImage.js'
import { useEnterpriseStore } from '@/stores/enterprise'

const notification = useNotification()
const { t: $t } = useI18n()
const enterpriseStore = useEnterpriseStore()

const communityListStore = useCommunityListStore()

const { coverFile, iconFile } = await getCommunityDefaultImages()
const coverImageFile = ref<File>(coverFile)
const iconImageFile = ref<File>(iconFile)
const community = ref(
  new BokudeliCommunity(null, {
    enterprise_id: enterpriseStore.enterprise?.enterprise_id,
  }),
)
const isLoading = ref(false)

const validateNewAccount = async (value: string) => {
  const enterpriseId = enterpriseStore.enterprise?.enterprise_id
  if (enterpriseId == null || enterpriseId === '') {
    return false
  }
  const existing = await communityListStore.getCommunityData(value, { enterpriseId })
  return existing == null
}

const submit = async () => {
  const enterpriseId = enterpriseStore.enterprise?.enterprise_id
  if (enterpriseId == null || enterpriseId === '') {
    notification.show($t('manage.newcommunity.enterprise_not_ready'), 'error')
    return
  }
  community.value.enterprise_id = enterpriseId

  isLoading.value = true
  try {
    const newCommunityStore = await createNewCommunity(
      toRaw(community.value),
      coverImageFile.value,
      iconImageFile.value,
    )
    const newCommunity = await new Promise<BokudeliCommunity>((resolve) => {
      watch(
        () => [newCommunityStore.community, newCommunityStore.members],
        () => {
          if (
            newCommunityStore.community != null &&
            (newCommunityStore.members?.length ?? 0) > 0 // 自分が admin 登録されるまで待つ必要がある
          ) {
            resolve(newCommunityStore.community)
          }
        },
        { immediate: true },
      )
    })
    notification.show($t('manage.newcommunity.created'), 'success')
    // このタイミングでのリロードでは invisible になっているモジュールに反映されない
    // とりあえず再読込することで対応する
    // communityListStore.reload()
    // router.push(getManageCommunityPath(newCommunity.community_account))
    window.location.href = getManageCommunityPath(newCommunity.community_account)
  } catch (err) {
    console.error(err)
    notification.show($t('manage.newcommunity.error'), 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <v-container class="manage-container">
    <v-row class="justify-center">
      <v-col md="10" sm="10" cols="12">
        <CommunityEdit
          v-model="community"
          v-model:coverImageFile="coverImageFile"
          v-model:iconImageFile="iconImageFile"
          :validateNewAccount="validateNewAccount"
          :auto-open-help-dialog="true"
        >
          <template #default="{ isValid }">
            <v-card-text class="text-center mx-0 px-0">
              <v-btn color="primary" size="large" :disabled="!isValid" :loading="isLoading" @click="submit">
                {{ $t('manage.newcommunity.submit') }}
              </v-btn>
            </v-card-text>
          </template>
        </CommunityEdit>
      </v-col>
    </v-row>
  </v-container>
</template>

<route lang="yaml">
meta:
  layout: manage
</route>
