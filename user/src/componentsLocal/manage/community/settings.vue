<script setup lang="ts">
import { useCommunityStore, type CommunityStore } from '@/stores/community'
import CommunityEdit from '@/components/CommunityEdit.vue'
import { useNotification } from '@/composable/notification'

const notification = useNotification()
const { t: $t } = useI18n()

const communityAccount = useRoute().params.communityAccount as string
const communityStore = useCommunityStore(communityAccount) as CommunityStore
const community = computed({
  get: () => communityStore.community,
  set: (value) => {
    communityStore.community = value
  },
})
const coverImageFile = ref<File | null>(null)
const iconImageFile = ref<File | null>(null)
const isLoading = ref(false)
const submit = async () => {
  isLoading.value = true
  try {
    await communityStore.updateComunity(community.value!)
    if (coverImageFile.value != null) {
      await communityStore.updateCoverImage(coverImageFile.value)
    }
    if (iconImageFile.value != null) {
      await communityStore.updateIconImage(iconImageFile.value)
    }
    notification.show($t('manage.settings.saved'), 'success')
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
          v-if="community != null"
          v-model="community"
          v-model:coverImageFile="coverImageFile"
          v-model:iconImageFile="iconImageFile"
        >
          <template #default="{ isValid }">
            <v-card-text class="text-center mt-10">
              <v-btn
                :disabled="!isValid"
                :loading="isLoading"
                color="primary"
                class="me-3 mt-3"
                size="large"
                @click="submit"
              >
                {{ $t('manage.settings.submit') }}
              </v-btn>
            </v-card-text>
          </template>
        </CommunityEdit>
      </v-col>
    </v-row>
  </v-container>
</template>
