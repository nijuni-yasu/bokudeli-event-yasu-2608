<script setup lang="ts">
import { db } from '@/firebase'
import { setDoc, getDoc, doc, Timestamp } from 'firebase/firestore'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import { uploadCommunityImage } from '@/composable/uploadImage'
import { getCommunityPath } from '@/router/utils'
import { useCommunityStore, type CommunityStore } from '@/stores/community'

const route = useRoute()
const router = useRouter()

const communityAccount = route.query.id as string | null

const state = reactive({
  coverImageFile: null as File | null,
  iconImageFile: null as File | null,
})

let community: Ref<BokudeliCommunity>;
let isLoading: Ref<boolean>;
if (communityAccount != null) {
  const communityStore = useCommunityStore(communityAccount) as CommunityStore
  community = computed(() => communityStore.community ?? {} as BokudeliCommunity)
  isLoading = computed(() => communityStore.community == null)
} else {
  community = ref({communitySns:{}} as BokudeliCommunity)
  isLoading = ref(false)
}

// onMounted(async () => {
//   const roles = await communityStore.getCurrentUserRoles()
//   if (roles == null || !roles.includes('manager')) {
//     window.alert('コミュニティ管理者ではありません')
//     router.push(getCommunityPath(communityAccount))
//   }
// })

const iconFileInputRef = ref<HTMLInputElement | null>(null)
const coverFileInputRef = ref<HTMLInputElement | null>(null)

const onIconTriggerUpload = () => {
  iconFileInputRef.value?.click()
}
const onCoverTriggerUpload = () => {
  coverFileInputRef.value?.click()
}
// TODO:onFileChange関数を共通化したい
const onCoverFileChange = (event: Event) => {
  const eventTarget = event.target as HTMLInputElement
  if (!eventTarget?.files || eventTarget?.files.length === 0) {
    return
  }
  const file = eventTarget.files[0]
  state.coverImageFile = file
  community.value.communityCoverImageUrl = URL.createObjectURL(file)
}
const onIconFileChange = (event: Event) => {
  const eventTarget = event.target as HTMLInputElement
  if (!eventTarget?.files || eventTarget?.files.length === 0) {
    return
  }
  const file = eventTarget.files[0]
  state.iconImageFile = file
  community.value.communityIconImageUrl = URL.createObjectURL(file)
}

const submit = async () => {
  const docRef = doc(db, 'communities', community.value.communityId)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    // カバー画像を追加
    if (state.coverImageFile) {
      const communityCoverUrl = await uploadCommunityImage(community.value.communityId, state.coverImageFile)
      await setDoc(docRef, { community_cover_image_url: communityCoverUrl }, { merge: true })
    }
    // アイコン画像を追加
    if (state.iconImageFile) {
      const communityIconUrl = await uploadCommunityImage(community.value.communityId, state.iconImageFile)
      await setDoc(docRef, { community_icon_image_url: communityIconUrl }, { merge: true })
    }
    // その他項目を追加
    await setDoc(
      docRef,
      {
        community_name: community.value.communityName,
        community_desc: community.value.communityDescription,
        community_sns_facebook: community.value.communitySns.facebook,
        community_sns_twitter: community.value.communitySns.twitter,
        community_sns_instagram: community.value.communitySns.instagram,
        community_sns_officialsite: community.value.communitySns.officialsite,
        is_public: community.value.isPublic,
        updated_at: Timestamp.now(),
      },
      { merge: true },
    )
  } else {
    console.error('コミュニティが存在しません')
  }
  window.alert('コミュニティ情報を更新しました')
  router.push(getCommunityPath(community.value.communityAccount))
}

const cancel = () => {
  router.push(getCommunityPath(community.value.communityAccount))
}
</script>

<template>
  <v-row v-if="!isLoading" class="justify-center">
    <v-col cols="12" sm="12" md="9" class="px-0">
      <v-card flat class="mt-2">
        <v-form class="multi-col-validation">
          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-list-box-outline" />
            <span>コミュニティ設定</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="community.communityAccount"
                  outlined
                  dense
                  readonly
                  label="アカウント(ReadOnly)"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="community.communityName"
                  outlined
                  dense
                  label="コミュニティ名"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="community.communityDescription"
                  outlined
                  rows="10"
                  label="コミュニティ説明文"
                ></v-textarea>
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
                  <input ref="iconFileInputRef" class="file-input" type="file" @change="onIconFileChange" />
                  <v-img
                    v-if="community.communityIconImageUrl"
                    :src="community.communityIconImageUrl"
                    cover
                    aspect-ratio="1"
                  ></v-img>
                  <div v-else class="placeholder">アイコンをアップロード<br />300px X 300px</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <div class="v-field image-upload-container" @click="onCoverTriggerUpload">
                  <input ref="coverFileInputRef" class="file-input" type="file" @change="onCoverFileChange" />
                  <v-img
                    v-if="community.communityCoverImageUrl"
                    :src="community.communityCoverImageUrl"
                    cover
                    aspect-ratio="1.91"
                  ></v-img>
                  <div v-else class="placeholder">カバー画像をアップロード<br />1200px X 630px</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-web" />
            <span>SNS設定</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="community.communitySns.facebook"
                  outlined
                  dense
                  label="facebook"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="community.communitySns.twitter"
                  outlined
                  dense
                  label="X(Twitter)"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="community.communitySns.instagram"
                  outlined
                  dense
                  label="Instagram"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="community.communitySns.officialsite"
                  outlined
                  dense
                  label="公式サイト"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <!-- Activity -->
          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-lightbulb-on-outline" />
            <span>公開設定</span>
          </v-card-title>
          <v-card-text>
            <v-switch v-model="community.isPublic" hide-details class="mt-0">
              <template #label> 公開コミュニティ </template>
            </v-switch>
          </v-card-text>
          <v-card-text class="text-center mt-10">
            <v-btn color="primary" class="me-3 mt-3" size="large" variant="outlined" @click="cancel">キャンセル</v-btn>
            <v-btn color="primary" class="me-3 mt-3" size="large" @click="submit">設定</v-btn>
          </v-card-text>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
  <v-row v-else class="justify-center">
    <v-progress-circular indeterminate color="primary"></v-progress-circular>
  </v-row>
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
