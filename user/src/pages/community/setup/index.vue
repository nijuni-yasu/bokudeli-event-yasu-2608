<script setup lang="ts">
import { getCommunityPath } from '@/router/utils'
import { useCommunityStore, useCommunitiesStore, type CommunityStore, type CommunitiesStore } from '@/stores/community'
import { requiredValidator, postalCodeValidator, phoneValidator, emailValidator } from '@/utils/validators'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'

const router = useRouter()
const route = useRoute()

const communityAccount = ref<string | null>(route.query.id as string | null)

const isValid = ref(false)
const isOpenConfirmDialog = ref(false)

const communitiesStore = useCommunitiesStore() as CommunitiesStore

const community = computed<BokudeliCommunity| null>({
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
  }
})

onMounted(async () => {
  if (communityAccount.value != null) {
    const communityStore = useCommunityStore(communityAccount.value) as CommunityStore
    const roles = await communityStore.getCurrentUserRoles()
    if (roles == null || !roles.includes('manager')) {
      window.alert('コミュニティ管理者ではありません')
      router.push(getCommunityPath(communityAccount.value))
    }
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

const coverImageFile = ref<File[] | null>(null)
const iconImageFile = ref<File[] | null>(null)
const coverImageUrl = computed(() => {
  const ci = coverImageFile.value?.[0]
  if (ci != null) {
    return URL.createObjectURL(ci)
  } else {
    return community.value?.community_cover_image_url ?? null
  }
})
const iconImageUrl = computed(() => {
  const ii = iconImageFile.value?.[0]
  if (ii != null) {
    return URL.createObjectURL(ii)
  } else {
    return community.value?.community_icon_image_url ?? null
  }
})

const iconFileInputRef = ref<HTMLInputElement>()
const coverFileInputRef = ref<HTMLInputElement>()
const onIconTriggerUpload = () => {
  iconFileInputRef.value?.click()
}
const onCoverTriggerUpload = () => {
  coverFileInputRef.value?.click()
}

const submit = async () => {
  if (community.value == null) {
    console.warn('community is null')
    return
  }
  if (communityAccount.value != null) {
    const communityStore = useCommunityStore(communityAccount.value) as CommunityStore
    await communityStore.updateComunity(community.value)
    if (coverImageFile.value?.[0] != null) {
      await communityStore.updateCoverImage(coverImageFile.value?.[0])
    }
    if (iconImageFile.value?.[0] != null) {
      await communityStore.updateIconImage(iconImageFile.value?.[0])
    }
    window.alert('コミュニティ情報を更新しました')
  } else {
    const community = await communitiesStore.createNewCommunityFromDraft()
    communityAccount.value = community.community_account
    const communityStore = useCommunityStore(communityAccount.value) as CommunityStore
    if (coverImageFile.value?.[0] != null) {
      await communityStore.updateCoverImage(coverImageFile.value?.[0])
    }
    if (iconImageFile.value?.[0] != null) {
      await communityStore.updateIconImage(iconImageFile.value?.[0])
    }
    window.alert('コミュニティ申請メールを送信しました')
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

const accountFieldRef = ref();
const isCheckingAccount = ref(false)
const isValidAccount = ref<true | string>(true)
const checkAccountExists = async (event: Event) => {
  isCheckingAccount.value = true
  try {
    const target = event.target as HTMLInputElement
    const community = await communitiesStore.getCommunityData(target.value)
    isValidAccount.value = community == null || 'このアカウント名は既に使用されています'
    nextTick(() => {
      accountFieldRef.value.validate()
    })
  } finally {
    isCheckingAccount.value = false
  }
}
</script>

<template>
  <div>
    <v-row v-if="community != null" class="justify-center">
      <v-col cols="12" sm="12" md="9" class="px-0">
        <v-card flat class="mt-2">
          <v-form v-model="isValid" class="multi-col-validation">
            <v-card-title class="pt-10 px-5">
              <v-icon size="50" class="text--primary me-3" icon="mdi-list-box-outline" />
              <span>コミュニティ設定</span>
            </v-card-title>

            <v-card-text class="pt-5">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-if="communityAccount != null"
                    v-model="community.community_account"
                    outlined
                    dense
                    readonly
                    label="アカウント(ReadOnly)" />
                  <v-text-field
                    v-else
                    ref="accountFieldRef"
                    v-model="community.community_account"
                    outlined
                    dense
                    :loading="isCheckingAccount"
                    :rules="[requiredValidator, isValidAccount]"
                    label="アカウント"
                    @blur="checkAccountExists" />
                </v-col>
              </v-row>
            </v-card-text>            

            <v-card-text class="pt-5">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="community.community_name"
                    outlined
                    dense
                    label="コミュニティ名"
                    :rules="[requiredValidator]"
                  />
                </v-col>
              </v-row>
            </v-card-text>
            <v-card-text class="pt-5">
              <v-row>
                <v-col cols="12">
                  <v-textarea
                    v-model="community.community_desc"
                    outlined
                    rows="10"
                    label="コミュニティ説明文"
                  />
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-title class="pt-10 px-5">
              <v-icon size="50" class="text--primary me-3" icon="mdi-image" />
              <span>画像設定</span>
            </v-card-title>
            <v-card-text class="pt-5">
              <v-row>
                <v-col cols="12">
                  <div class="v-field icon-upload-container" @click="onIconTriggerUpload">
                    <v-file-input ref="iconFileInputRef" v-model="iconImageFile" class="file-input"  />
                    <v-img
                      v-if="iconImageUrl != null"
                      :src="iconImageUrl"
                      cover
                      aspect-ratio="1" />
                    <div v-else class="placeholder">アイコンをアップロード<br />300px X 300px</div>
                  </div>
                </v-col>
              </v-row>
              <span>※コミュニティのアイコン画像を設定してください（推奨サイズ：300x300px）</span>
            </v-card-text>

            <v-card-text class="pt-5">
              <v-row>
                <v-col cols="12">
                  <div class="v-field image-upload-container" @click="onCoverTriggerUpload">
                    <v-file-input ref="coverFileInputRef" v-model="coverImageFile" class="file-input" />
                    <v-img
                      v-if="coverImageUrl != null"
                      :src="coverImageUrl"
                      cover
                      aspect-ratio="1.91" />
                    <div v-else class="placeholder">カバー画像をアップロード<br />1200px X 630px</div>
                  </div>
                </v-col>
              </v-row>
              <span>※コミュニティのカバー画像を設定してください（推奨サイズ：1200x630px）</span>
            </v-card-text>

            <v-card-title class="pt-10 px-5">
              <v-icon size="50" class="text--primary me-3" icon="mdi-web" />
              <span>SNS設定</span>
            </v-card-title>

            <v-card-text class="pt-5">
              <v-row>
                <v-col cols="12">
                  <v-text-field v-model="community.community_sns_facebook" outlined dense label="facebook"></v-text-field>
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-text class="pt-5">
              <v-row>
                <v-col cols="12">
                  <v-text-field v-model="community.community_sns_twitter" outlined dense label="X(Twitter)"></v-text-field>
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-text class="pt-5">
              <v-row>
                <v-col cols="12">
                  <v-text-field v-model="community.community_sns_instagram" outlined dense label="Instagram"></v-text-field>
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-text class="pt-5">
              <v-row>
                <v-col cols="12">
                  <v-text-field v-model="community.community_sns_officialsite" outlined dense label="公式サイト"></v-text-field>
                </v-col>
              </v-row>
            </v-card-text>

            <!-- Activity -->
            <v-card-title v-if="communityAccount != null" class="pt-10 px-5">
              <v-icon size="50" class="text--primary me-3" icon="mdi-lightbulb-on-outline" />
              <span>公開設定</span>
            </v-card-title>
            <v-card-text v-if="communityAccount != null">
              <v-switch v-model="community.is_public" hide-details class="mt-0">
                <template #label> 公開コミュニティ </template>
              </v-switch>
            </v-card-text>
            <v-card-title class="pt-10 pl-5">
              <v-icon size="50" class="text--primary me-3" icon="mdi-account-outline" />
              <span>運営者情報</span>
            </v-card-title>
            <v-card-text class="px-5 pb-10">
              <span>※運営者情報は、コミュニティページに表示されません</span>
            </v-card-text>

            <v-card-text class="pt-5">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="community.community_manager_fullname"
                    outlined
                    dense
                    label="運営者氏名"
                    :rules="[requiredValidator]"
                  />
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-text class="pt-5">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="community.community_company"
                    outlined
                    dense
                    label="会社名・団体名"
                    :rules="[requiredValidator]"
                  />
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-text class="pt-5">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="community.community_postalcode"
                    outlined
                    dense
                    label="郵便番号"
                    :rules="[requiredValidator, postalCodeValidator]"
                  />
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-text class="pt-5">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="community.community_address"
                    outlined
                    dense
                    label="住所"
                    :rules="[requiredValidator]"
                  />
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-text class="pt-5">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="community.community_phone"
                    outlined
                    dense
                    label="電話番号"
                    :rules="[requiredValidator, phoneValidator]"
                  />
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-text class="pt-5">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="community.community_email"
                    outlined
                    dense
                    label="メールアドレス"
                    :rules="[requiredValidator, emailValidator]"
                  />
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-text class="pt-5">
              <v-row>
                <v-col cols="12">
                  <v-textarea
                    v-model="community.community_use_purpose"
                    outlined rows="4"
                    label="利用目的"
                    :rules="[requiredValidator]"
                  />
                </v-col>
              </v-row>
            </v-card-text>
            <v-card-text v-if="communityAccount != null" class="text-center mt-10">
              <v-btn color="primary" class="me-3 mt-3" size="large" variant="outlined" @click="cancel">キャンセル</v-btn>
              <v-btn :disabled="!isValid" color="primary" class="me-3 mt-3" size="large" @click="submit">設定</v-btn>
            </v-card-text>

            <v-card-text v-else class="text-center mx-0 px-0">
              <v-btn
                :disabled="!isValid"
                color="grey-900"
                class="mt-3"
                size="x-large"
                prepend-icon="mdi-email"
                @click="isOpenConfirmDialog = true"
              >
                コミュニティ利用を申請する
              </v-btn>
            </v-card-text>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-else class="justify-center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-row>

    <confirm-dialog v-model="isOpenConfirmDialog" :is-confirm="true" :ok-text="'申請メールを送信する'" :ok-click="submit" max-width="650px">
      <v-card-text class="text-center py-10 text-h6">
        新規コミュニティ申請メールを送信しますか？<br>
      </v-card-text>
      <v-card-text class="text-subtitle pb-0" style="line-height: 1.5rem">
        ・コミュニティ利用申請後、運営チームにて内容確認させていただきます。<br>
        ・コミュニティ利用承認後、イベントページ作成などの機能が利用可能となります。<br>
        <br>
        ・詳しくは <a href="https://bit.ly/3S3L8Sv" target="_blank">コミュニティマニュアル</a> をご確認ください。<br>
        ・ご不明点ありましたらサポートまで <a href="https://forms.gle/z9L88Dq7vDKwbvxMA" target="_blank">お問い合わせ</a> ください。<br>
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
