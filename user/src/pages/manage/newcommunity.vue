<script setup lang="ts">
import CommunityEdit from '@shokujii/base/components/CommunityEdit.vue'
import { getManageCommunityPath } from '@/router/utils'
import { BokudeliCommunity, createNewCommunity } from '@shokujii/base/stores/community.js'
import { useCommunityListStore } from '@shokujii/base/stores/communityList.js'
import { useNotification } from '@shokujii/base/composable/notification.js'

const notification = useNotification()
const { t: $t } = useI18n()

const communityListStore = useCommunityListStore()

const coverImageFile = ref<File | null>(null)
const iconImageFile = ref<File | null>(null)
const community = ref(new BokudeliCommunity(null, {}))
const isLoading = ref(false)

const validateNewAccount = async (value: string) => {
  const community = await communityListStore.getCommunityData(value)
  return community == null
}

const submit = async () => {
  isLoading.value = true
  try {
    if (coverImageFile.value == null || iconImageFile.value == null) {
      throw new Error()
    }
    await createNewCommunity(toRaw(community.value), coverImageFile.value, iconImageFile.value)
    notification.show($t('manage.newcommunity.created'), 'success')
    // communityListStore.reload()
    // router.push(getManageCommunityPath(community.community_account))
    window.location.href = getManageCommunityPath(community.value.community_account)
  } catch (err) {
    console.error(err)
    notification.show($t('manage.newcommunity.error'), 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <v-container>
    <v-row class="justify-center">
      <v-col md="10" sm="10" cols="12">
        <CommunityEdit
          v-model="community"
          v-model:coverImageFile="coverImageFile"
          v-model:iconImageFile="iconImageFile"
          :validateNewAccount="validateNewAccount"
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
