<script setup lang="ts">
import { useValidators } from '@/composable/validators'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import { type CommunitiesStore } from '@/stores/community'
import ImageInput from '@/components/ImageInput.vue'
import {
  mdiPlus,
  mdiHelpCircleOutline,
  mdiListBoxOutline,
  mdiImage,
  mdiWeb,
  mdiLightbulbOnOutline,
  mdiAccountOutline,
} from '@mdi/js'

const { requiredValidator, postalCodeValidator, phoneValidator, emailValidator, accountValidator } = useValidators()

const community = defineModel<BokudeliCommunity>({ required: true })
const coverImageFile = defineModel<File | null>('coverImageFile', { required: true })
const iconImageFile = defineModel<File | null>('iconImageFile', { required: true })

const props = defineProps<{
  communityAccount: string | null
  communitiesStore: CommunitiesStore
}>()

const emit = defineEmits<{
  (e: 'openNewCommunityDialog'): void
  (e: 'openConfirmDialog'): void
  (e: 'cancel'): void
  (e: 'submit'): void
}>()

const isValid = ref(false)

const accountFieldRef = ref()
const isCheckingAccount = ref(false)
const isValidSameAccount = ref<true | string>(true)
const checkAccountExists = async (event: Event) => {
  isCheckingAccount.value = true
  try {
    const target = event.target as HTMLInputElement
    const community = await props.communitiesStore.getCommunityData(target.value)
    isValidSameAccount.value = community == null || 'このアカウント名は既に使用されています'
    nextTick(() => {
      accountFieldRef.value.validate()
    })
  } finally {
    isCheckingAccount.value = false
  }
}

const trimInputtedId = (id: string | undefined, urlPattern: RegExp) => {
  if (!id) return ''
  return id.trim().replace(/\/+$/, '').replace(urlPattern, '')
}

const trimHashTag = (hashTag: string | undefined) => {
  if (!hashTag) return ''
  return hashTag.trim().replace(/^#/, '')
}

const twitterId = computed({
  get: () => community.value?.community_sns_twitter,
  set: (val) => {
    if (community.value == null) return
    community.value.community_sns_twitter = trimInputtedId(val, /^https:\/\/(mobile.)?(x|twitter)\.com\//)
  },
})
const facebookId = computed({
  get: () => community.value?.community_sns_facebook,
  set: (val) => {
    if (community.value == null) return
    community.value.community_sns_facebook = trimInputtedId(val, /^https:\/\/www\.facebook\.com\//)
  },
})
const instagramId = computed({
  get: () => community.value?.community_sns_instagram,
  set: (val) => {
    if (community.value == null) return
    community.value.community_sns_instagram = trimInputtedId(val, /^https:\/\/www\.instagram\.com\//)
  },
})

const hashTag = computed({
  get: () => community.value?.community_sns_hash_tag,
  set: (val) => {
    if (community.value == null) return
    community.value.community_sns_hash_tag = trimHashTag(val)
  },
})
</script>

<template>
  <v-card flat class="mt-2">
    <v-form v-model="isValid" class="multi-col-validation">
      <v-row>
        <v-col cols="12" class="text-right">
          <v-btn
            color="primary"
            class="me-3 mt-3"
            :icon="mdiHelpCircleOutline"
            size="x-large"
            density="compact"
            variant="text"
            @click="emit('openNewCommunityDialog')"
          />
        </v-col>
      </v-row>
      <v-card-title class="px-5">
        <v-icon size="50" class="text--primary me-3" :icon="mdiListBoxOutline" />
        <span>コミュニティ設定</span>
      </v-card-title>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-if="props.communityAccount != null"
              v-model="community.community_account"
              outlined
              dense
              readonly
              label="アカウント(ReadOnly)"
            />
            <v-text-field
              v-else
              ref="accountFieldRef"
              v-model="community.community_account"
              outlined
              dense
              :loading="isCheckingAccount"
              :rules="[requiredValidator, isValidSameAccount, accountValidator]"
              label="アカウント"
              @blur="checkAccountExists"
            />
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
            <v-textarea v-model="community.community_desc" outlined rows="10" label="コミュニティ説明文" />
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-title class="pt-10 px-5">
        <v-icon size="50" class="text--primary me-3" :icon="mdiImage" />
        <span>画像設定</span>
      </v-card-title>
      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <ImageInput
              :url="community.community_icon_image_url ?? undefined"
              :rules="[requiredValidator]"
              :cover="true"
              style="width: auto; max-width: min(100%, 300px); aspect-ratio: 1/1"
              @file-selected="(f: File | null) => (iconImageFile = f)"
            />
            ※アイコン画像を設定してください（推奨サイズ：300x300px）
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <ImageInput
              :url="community.community_cover_image_url ?? undefined"
              :rules="[requiredValidator]"
              style="width: 100%; aspect-ratio: 120/63"
              :cover="true"
              @fileSelected="(f: File | null) => (coverImageFile = f)"
            />
            ※カバー画像を設定してください（推奨サイズ：1200x630px）
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-title class="pt-10 px-5">
        <v-icon size="50" class="text--primary me-3" :icon="mdiWeb" />
        <span>SNS設定</span>
      </v-card-title>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="facebookId"
              outlined
              dense
              label="facebook"
              prefix="https://www.facebook.com/"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="twitterId"
              outlined
              dense
              label="X(Twitter)"
              prefix="https://x.com/"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="instagramId"
              outlined
              dense
              label="Instagram"
              prefix="https://www.instagram.com/"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="community.community_sns_officialsite"
              outlined
              dense
              label="公式サイト"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field v-model="hashTag" outlined dense label="ハッシュタグ" prefix="#"></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- Activity -->
      <v-card-title v-if="communityAccount != null" class="pt-10 px-5">
        <v-icon size="50" class="text--primary me-3" :icon="mdiLightbulbOnOutline" />
        <span>公開設定</span>
      </v-card-title>
      <v-card-text v-if="communityAccount != null">
        <v-switch v-model="community.is_public" hide-details class="mt-0">
          <template #label> 公開コミュニティ </template>
        </v-switch>
      </v-card-text>
      <v-card-title class="pt-10 pl-5">
        <v-icon size="50" class="text--primary me-3" :icon="mdiAccountOutline" />
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
              outlined
              rows="4"
              label="利用目的"
              :rules="[requiredValidator]"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-text v-if="communityAccount != null" class="text-center mt-10">
        <v-btn color="primary" class="me-3 mt-3" size="large" variant="outlined" @click="emit('cancel')"
          >キャンセル</v-btn
        >
        <v-btn :disabled="!isValid" color="primary" class="me-3 mt-3" size="large" @click="emit('submit')"
          >設定</v-btn
        >
      </v-card-text>

      <v-card-text v-else class="text-center mx-0 px-0">
        <v-btn
          :disabled="!isValid"
          color="grey-900"
          class="mt-3"
          size="x-large"
          :prepend-icon="mdiPlus"
          @click="emit('openConfirmDialog')"
        >
          コミュニティを新規作成する
        </v-btn>
      </v-card-text>
    </v-form>
  </v-card>
</template>

<style lang="scss" scoped></style>
