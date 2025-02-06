<script setup lang="ts">
import CommunityEdit from '@/components/CommunityEdit.vue'
import { getManageCommunityPath } from '@/router/utils'
import { useCommunityStore, type CommunityStore } from '@/stores/community'
import { useCommunityListStore, type CommunityListStore } from '@/stores/communityList'

const router = useRouter()
const notification = inject('notification') as Notification
const { t: $t } = useI18n()

const communityListStore = useCommunityListStore() as CommunityListStore

const coverImageFile = ref<File | null>(null)
const iconImageFile = ref<File | null>(null)
const community = communityListStore.communityDraft
const isLoading = ref(false)

const validateNewAccount = async (value: string) => {
  const community = await communityListStore.getCommunityData(value)
  return community == null
}

const submit = async () => {
  isLoading.value = true
  try {
    const community = await communityListStore.createNewCommunityFromDraft()
    const communityStore = useCommunityStore(community.community_account) as CommunityStore
    if (coverImageFile.value != null) {
      await communityStore.updateCoverImage(coverImageFile.value)
    }
    if (iconImageFile.value != null) {
      await communityStore.updateIconImage(iconImageFile.value)
    }
    Object.assign(notification, { message: $t('manage.newcommunity.added'), color: 'success' })
    communityListStore.reload()
    router.push(getManageCommunityPath(community.community_account))
  } catch (err) {
    console.error(err)
    Object.assign(notification, { message: $t('manage.newcommunity.error'), color: 'error' })
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
              <v-btn color="primary" :disabled="!isValid" :loading="isLoading" @click="submit">
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
