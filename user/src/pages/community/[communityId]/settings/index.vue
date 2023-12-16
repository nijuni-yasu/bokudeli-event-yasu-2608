<script setup lang="ts">
import { db } from '@/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import { checkCommunityManager } from '@/composable/checkCommunityManager'
import { convertDocumentDataToCommunity } from '@/schemes/converter'

const props = defineProps<{
  communityId: string
}>()

const state = reactive({
  community: {} as BokudeliCommunity,
  isLoading: true,
  isCommunityManager: false,
  links: [] as string[],
})

const communityDb = query(collection(db, 'communities'), where('community_account', '==', props.communityId))

onMounted(async () => {
  const communitiesSnapshot = await getDocs(communityDb)
  const communitySnapshot = communitiesSnapshot.docs.shift()
  if (communitySnapshot) {
    const communityData = communitySnapshot.data()
    console.log(communityData)
    // state.community = communityData
    const community = convertDocumentDataToCommunity(communityData)
    state.community = community
    state.isCommunityManager = await checkCommunityManager(communitySnapshot.ref)
  }
  state.isLoading = false
})

const fileInputRef = ref<HTMLInputElement | null>(null)

const onTriggerUpload = () => {
  fileInputRef.value?.click()
}

// TODO:onFileChange関数を共通化したい
const onFileChangeCover = (event: Event) => {
  const eventTarget = event.target as HTMLInputElement
  if (!eventTarget?.files || eventTarget?.files.length === 0) {
    return
  }
  const file = eventTarget.files[0]
  state.community.communityCoverImageUrl = URL.createObjectURL(file)
  console.log(state.community.communityCoverImageUrl)
}
const onFileChangeIcon = (event: Event) => {
  const eventTarget = event.target as HTMLInputElement
  if (!eventTarget?.files || eventTarget?.files.length === 0) {
    return
  }
  const file = eventTarget.files[0]
  state.community.communityIconImageUrl = URL.createObjectURL(file)
  console.log(state.community.communityIconImageUrl)
}

const submit = () => {

}



</script>

<template>
  <v-row v-if="!state.isLoading" class="justify-center">
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
                <v-text-field v-model="state.community.communityAccount" outlined dense readonly label="アカウント(ReadOnly)"></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="state.community.communityName" outlined dense label="コミュニティ名"></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-textarea v-model="state.community.communityDescription" outlined rows="10" label="コミュニティ説明文"></v-textarea>
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
                <div class="v-field icon-upload-container" @click="onTriggerUpload">
                  <input ref="fileInputRef" class="file-input" type="file" @change="onFileChangeCover" />
                  <v-img v-if="state.community.communityIconImageUrl" :src="state.community.communityIconImageUrl" cover aspect-ratio="1"></v-img>
                  <div v-else class="placeholder">アイコンをアップロード<br />300px X 300px</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <div class="v-field image-upload-container" @click="onTriggerUpload">
                  <input ref="fileInputRef" class="file-input" type="file" @change="onFileChangeIcon" />
                  <v-img v-if="state.community.communityCoverImageUrl" :src="state.community.communityCoverImageUrl" cover aspect-ratio="1.91"></v-img>
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
                <v-text-field v-model="state.community.communitySns.facebook" outlined dense label="facebook"></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="state.community.communitySns.twitter" outlined dense label="X(Twitter)"></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="state.community.communitySns.instagram" outlined dense label="Instagram"></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="state.community.communitySns.officialsite" outlined dense label="公式サイト"></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>



          <!-- Activity -->
          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-lightbulb-on-outline" />
            <span>公開設定</span>
          </v-card-title>
          <v-card-text>
            <v-switch v-model="state.community.isPublic" hide-details class="mt-0">
              <template #label> 公開コミュニティ </template>
            </v-switch>
          </v-card-text>
          <v-card-text class="text-center mt-10">
            <v-btn color="primary" class="me-3 mt-3" size="large" variant="outlined" @click="">キャンセル</v-btn>
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
