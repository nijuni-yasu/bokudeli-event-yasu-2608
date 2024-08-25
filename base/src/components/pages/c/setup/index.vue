<script setup lang="ts">
import { getCommunityPath } from '@/router/utils'
import { useCommunityStore, useCommunitiesStore, type CommunityStore, type CommunitiesStore } from '@/stores/community'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import { useStoreStoredUser } from '@/stores/storedUser'
import CommunitySetupForm from '@/components/CommunitySetupForm.vue'

const router = useRouter()
const route = useRoute()

const communityAccount = ref<string | null>(route.query.id as string | null)

const isOpenConfirmDialog = ref(false)
const isOpenNewCommunityDialog = ref(false)

const communitiesStore = useCommunitiesStore() as CommunitiesStore

const community = computed<BokudeliCommunity | null>({
  get: () => {
    if (communityAccount.value != null) {
      const communityStore = useCommunityStore(communityAccount.value) as CommunityStore
      return communityStore.community
    } else {
      return communitiesStore.communityDraft
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
      communitiesStore.communityDraft = value
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
    communitiesStore.$reset()
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
    const community = await communitiesStore.createNewCommunityFromDraft()
    communityAccount.value = community.community_account
    const communityStore = useCommunityStore(communityAccount.value) as CommunityStore
    if (coverImageFile.value != null) {
      await communityStore.updateCoverImage(coverImageFile.value)
    }
    if (iconImageFile.value != null) {
      await communityStore.updateIconImage(iconImageFile.value)
    }
    window.alert('コミュニティ新規作成メールを送信しました。承認されるのをお待ちください。')
    // communityAccount を設定したので、communitiesStore.$reset() は onUnmounted 内で実行されないことに注意
    communitiesStore.$reset()
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
          :communities-store="communitiesStore"
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
      :ok-text="'コミュニティを新規作成する'"
      :ok-click="submit"
      max-width="650px"
    >
      <v-card-text class="text-center py-10 text-h6"> コミュニティを新規作成しますか？<br /> </v-card-text>
      <v-card-text class="text-subtitle pb-0" style="line-height: 1.8rem">
        ・コミュニティ作成後、運営チームにて内容確認させていただきます。<br />
        ・コミュニティ利用承認後、イベントページ作成などの機能が利用可能となります。<br />
        <br />
        ・詳しくは <a href="https://bit.ly/3S3L8Sv" target="_blank">コミュニティガイド</a> および
        <a href="https://nijuni.notion.site/shokujii-38ef325b1c5f446880bbe35bc4bbf41c" target="_blank">利用規約</a>
        をご確認ください。<br />
        ・ご不明点ありましたらサポートまで
        <a href="https://forms.gle/z9L88Dq7vDKwbvxMA" target="_blank">お問い合わせ</a> ください。<br />
      </v-card-text>
    </confirm-dialog>
    <confirm-dialog v-model="isOpenNewCommunityDialog" :ok-text="'OK'" max-width="800px">
      <v-card-text class="text-center mt-6 text-h6"> コミュニティの新規作成について </v-card-text>
      <v-card-text class="text-subtitle" style="line-height: 1.8rem">
        ・「アカウント」「コミュニティ名」「コミュニティ詳細」「カバー画像」「アイコン画像」など入力してください。<br />
        ・コミュニティの「運営者情報」「利用目的」などについては、コミュニティページには表示されません。<br />
        ・新規作成後、運営チームにて作成内容を確認させていただきます。<br />
        ・運営チームによる承認後、イベント作成などの機能が利用可能となります。<br />
      </v-card-text>
      <v-card-text class="text-center mt-6 text-h6"> 禁止事項について </v-card-text>
      <v-card-text class="text-subtitle" style="line-height: 1.8rem">
        ・マルチ商法、ネットワークビジネス、宗教活動等の勧誘、過度な営業行為は禁止です。<br />
        ・報告を受け次第、アカウント停止とさせていただきます。<br />
        ・また、反社会的勢力等であるか、反社会的勢力等との何らかの交流若しくは関与を行っていると当社が判断した場合もアカウント停止とさせていただきます。<br />
        ・健全なコミュニティ運営を目指し、ご理解とご協力をお願いいたします。<br />
        <br />
        ・詳しくは <a href="https://bit.ly/3S3L8Sv" target="_blank">コミュニティガイド</a> および
        <a href="https://nijuni.notion.site/shokujii-38ef325b1c5f446880bbe35bc4bbf41c" target="_blank">利用規約</a>
        をご確認ください。<br />
        ・ご不明点ありましたらサポートまで
        <a href="https://forms.gle/z9L88Dq7vDKwbvxMA" target="_blank">お問い合わせ</a> ください。<br />
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
