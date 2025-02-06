<script setup lang="ts">
/**
 * Deprecated
 * Use `src/components/CommunityEdit.vue` instead
 */
import { getCommunityPath } from '@/router/utils'
import { useCommunityStore, type CommunityStore } from '@/stores/community'
import { useCommunityListStore } from '@/stores/communityList'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import { useStoreStoredUser } from '@/stores/storedUser'
import CommunitySetupForm from '@/components/CommunitySetupForm.vue'

import { useI18n } from 'vue-i18n'
const { t: $t } = useI18n()

const router = useRouter()
const route = useRoute()

const communityAccount = ref<string | null>(route.query.id as string | null)

const isOpenConfirmDialog = ref(false)
const isOpenNewCommunityDialog = ref(false)

const communityListStore = useCommunityListStore()

const community = computed<BokudeliCommunity | null>({
  get: () => {
    if (communityAccount.value != null) {
      const communityStore = useCommunityStore(communityAccount.value) as CommunityStore
      return communityStore.community
    } else {
      return communityListStore.communityDraft
    }
  },
  set: (value) => {
    if (value == null) {
      return
    }
    if (communityAccount.value != null) {
      const communityStore = useCommunityStore(communityAccount.value) as CommunityStore
      communityStore.community = value
    } else {
      communityListStore.communityDraft = value
    }
  },
})

onMounted(async () => {
  if (communityAccount.value != null) {
    const communityStore = useCommunityStore(communityAccount.value) as CommunityStore
    const roles = await communityStore.getCurrentUserRoles()
    if (roles == null || !roles.includes('manager')) {
      window.alert('コミュニティ管理者ではありません')
      router.push(getCommunityPath(communityAccount.value))
    }
  } else {
    // 新規作成の場合にダイアログを表示
    isOpenNewCommunityDialog.value = true
  }
})

onUnmounted(() => {
  if (communityAccount.value != null) {
    const communityStore = useCommunityStore(communityAccount.value) as CommunityStore
    communityStore.$reset()
  } else {
    communityListStore.$reset()
  }
})

watch(
  () => useStoreStoredUser().storedUser,
  (storedUser) => {
    if (storedUser == null) {
      router.push('/')
    }
  },
  { immediate: true },
)

const coverImageFile = ref<File | null>(null)
const iconImageFile = ref<File | null>(null)

const submit = async () => {
  if (community.value == null) {
    console.warn('community is null')
    return
  }
  if (communityAccount.value != null) {
    const communityStore = useCommunityStore(communityAccount.value) as CommunityStore
    await communityStore.updateComunity(community.value)
    if (coverImageFile.value != null) {
      await communityStore.updateCoverImage(coverImageFile.value)
    }
    if (iconImageFile.value != null) {
      await communityStore.updateIconImage(iconImageFile.value)
    }
    window.alert('コミュニティ情報を更新しました')
  } else {
    const community = await communityListStore.createNewCommunityFromDraft()
    communityAccount.value = community.community_account
    const communityStore = useCommunityStore(communityAccount.value) as CommunityStore
    if (coverImageFile.value != null) {
      await communityStore.updateCoverImage(coverImageFile.value)
    }
    if (iconImageFile.value != null) {
      await communityStore.updateIconImage(iconImageFile.value)
    }
    window.alert('コミュニティを新規作成しました')
    // communityAccount を設定したので、communityListStore.$reset() は onUnmounted 内で実行されないことに注意
    communityListStore.$reset()
  }
  router.push(getCommunityPath(communityAccount.value))
}

const cancel = () => {
  if (community.value != null) {
    router.push(getCommunityPath(community.value.community_account))
  } else {
    router.push('/community')
  }
}
</script>

<template>
  <div>
    <v-row v-if="community != null" class="justify-center">
      <v-col cols="12" sm="12" md="9" class="px-0">
        <community-setup-form
          v-model="community"
          v-model:cover-image-file="coverImageFile"
          v-model:icon-image-file="iconImageFile"
          :community-account="communityAccount"
          :communityListStore="communityListStore"
          @openNewCommunityDialog="isOpenNewCommunityDialog = true"
          @openConfirmDialog="isOpenConfirmDialog = true"
          @submit="submit"
          @cancel="cancel"
        ></community-setup-form>
      </v-col>
    </v-row>
    <v-row v-else class="justify-center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-row>
    <confirm-dialog
      v-model="isOpenConfirmDialog"
      :is-confirm="true"
      :ok-text="$t('community_create_confirm.ok_text')"
      :ok-click="submit"
      max-width="650px"
    >
      <v-card-text class="text-center mt-5 text-h4">
        {{ $t('community_create_confirm.title') }}
      </v-card-text>
      <v-card-text class="text-subtitle mt-5" style="line-height: 1.8rem">
        <div v-html="$t('community_create_confirm.desc')" />
      </v-card-text>
    </confirm-dialog>
    <confirm-dialog v-model="isOpenNewCommunityDialog" :ok-text="'OK'" max-width="800px">
      <v-card-text class="text-center mt-10 text-h4">
        {{ $t('community_create_modal.community.title') }}
      </v-card-text>
      <v-card-text class="text-subtitle" style="line-height: 1.8rem">
        <div v-html="$t('community_create_modal.community.desc')" />
      </v-card-text>
      <v-card-text class="text-center mt-10 text-h4">
        {{ $t('community_create_modal.prohibited.title') }}
      </v-card-text>
      <v-card-text class="text-subtitle" style="line-height: 1.8rem">
        <div v-html="$t('community_create_modal.prohibited.desc')" />
      </v-card-text>
    </confirm-dialog>
  </div>
</template>

<style lang="scss" scoped>
.image-upload-container {
  .file-input {
    display: none;
  }

  position: relative;
  width: 100%;
  aspect-ratio: 1.91;
  max-width: 1200px;
  max-height: 630px;
  border: 1px solid rgba(118, 118, 118, 0.38);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon-upload-container {
  .file-input {
    display: none;
  }

  position: relative;
  width: 100%;
  aspect-ratio: 1;
  max-width: 250px;
  max-height: 250px;
  border: 1px solid rgba(118, 118, 118, 0.38);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.placeholder {
  text-align: center;
}
</style>
