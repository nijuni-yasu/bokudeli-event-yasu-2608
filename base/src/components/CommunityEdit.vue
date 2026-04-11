<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useValidators } from '@shokujii/base/composable/validators'
import { fetchLocationByPostalcode } from '@shokujii/base/composable/fetchLocation'
import ImageInput from '@shokujii/base/components/ImageInput.vue'
import { type BokudeliCommunity } from '@shokujii/base/stores/community.js'
import {
  mdiListBoxOutline,
  mdiWeb,
  mdiAccountOutline,
  mdiAccountCreditCardOutline,
  mdiHelp,
  mdiEmailOutline,
} from '@mdi/js'
import SnsTextField from './SnsTextField.vue'
import { trimHashTag } from '@shokujii/base/utils/hashTag'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'

const { requiredValidator, postalCodeValidator, phoneValidator, emailValidator, accountValidator } = useValidators()

const { t: $t } = useI18n()

const community = defineModel<BokudeliCommunity>({ required: true })
const coverImageFile = defineModel<File | null>('coverImageFile', { required: true })
const iconImageFile = defineModel<File | null>('iconImageFile', { required: true })

const coverImagePreviewUrl = ref<string | undefined>(undefined)
watch(
  coverImageFile,
  (newFile) => {
    if (coverImagePreviewUrl.value?.startsWith('blob:')) {
      URL.revokeObjectURL(coverImagePreviewUrl.value)
    }
    if (newFile != null) {
      const url = URL.createObjectURL(newFile)
      coverImagePreviewUrl.value = url
    } else {
      coverImagePreviewUrl.value = community.value.community_cover_image_url
    }
  },
  { immediate: true },
)

const iconImagePreviewUrl = ref<string | undefined>(undefined)
watch(
  iconImageFile,
  (newFile) => {
    if (iconImagePreviewUrl.value?.startsWith('blob:')) {
      URL.revokeObjectURL(iconImagePreviewUrl.value)
    }
    if (newFile != null) {
      const url = URL.createObjectURL(newFile)
      iconImagePreviewUrl.value = url
    } else {
      iconImagePreviewUrl.value = community.value.community_icon_image_url
    }
  },
  { immediate: true },
)

const props = defineProps<{
  /**
   * 新規コミュニティURLのバリデーション関数
   * この関数が設定されていない場合、編集モードとして扱われ community_account は readonly になります
   */
  // 関数宣言なのに no-unused-vars が出てしまう。恐らく ESLint のバグ。
  // eslint-disable-next-line no-unused-vars
  validateNewAccount?: (account: string) => Promise<boolean>
  /**
   * マウント後、ヘルプダイアログを自動表示する
   */
  autoOpenHelpDialog?: boolean
}>()
const isNew = computed(() => props.validateNewAccount != null)

const isValid = ref(false)

// ハッシュタグの値を監視してトリムする
const community_sns_hash_tag = computed({
  get: () => community.value.community_sns_hash_tag,
  set: (value) => {
    community.value.community_sns_hash_tag = trimHashTag(value)
  },
})

watch(
  () => community.value.community_postalcode,
  async (postalcode) => {
    if (postalCodeValidator(postalcode) !== true) {
      community.value.community_address_base = ''
      return
    }
    const requestedPostalcode = postalcode as string
    let location: Awaited<ReturnType<typeof fetchLocationByPostalcode>>
    try {
      location = await fetchLocationByPostalcode(requestedPostalcode)
    } catch {
      // 失敗時のレース対策: 郵便番号が変わっていたら古い失敗でクリアしない
      if (community.value.community_postalcode !== requestedPostalcode) {
        return
      }
      community.value.community_address_base = ''
      return
    }
    // レース対策: 古いリクエストの結果で上書きしない
    if (community.value.community_postalcode !== requestedPostalcode) {
      return
    }
    if (location?.address == null) return

    community.value.community_address_base = location.address
  },
  { immediate: true },
)

const accountFieldRef = ref()
const isCheckingAccount = ref(false)
const isValidSameAccount = ref<true | string>(true)
const checkAccountExists = async (value: string) => {
  isCheckingAccount.value = true
  try {
    isValidSameAccount.value =
      (await props.validateNewAccount?.(value)) || $t('community_edit.validator_account_exists')
    nextTick(() => {
      accountFieldRef.value.validate()
    })
  } finally {
    isCheckingAccount.value = false
  }
}
const isOpenNewCommunityDialog = ref(false)

let autoOpenTimer: ReturnType<typeof setTimeout> | null = null
onMounted(() => {
  if (props.autoOpenHelpDialog === true) {
    autoOpenTimer = window.setTimeout(() => {
      isOpenNewCommunityDialog.value = true
    }, 2000)
  }
})
onUnmounted(() => {
  if (autoOpenTimer != null) {
    window.clearTimeout(autoOpenTimer)
  }
  if (coverImagePreviewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(coverImagePreviewUrl.value)
  }
  if (iconImagePreviewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(iconImagePreviewUrl.value)
  }
})
</script>

<template>
  <v-form v-model="isValid">
    <v-card flat class="mt-2 pa-3 pa-md-10">
      <v-card-title class="px-2 px-md-5 text-h3 font-weight-bold" v-if="isNew">
        <v-row class="pa-1 pa-md-3 align-center">
          {{ $t('community_edit.create') }}
          <v-btn
            class="ml-2"
            variant="outlined"
            size="x-small"
            :icon="mdiHelp"
            @click="isOpenNewCommunityDialog = true"
          />
        </v-row>
      </v-card-title>
      <v-card-title class="px-2 px-md-5" v-else>
        <v-icon size="50" class="text--primary me-3" :icon="mdiListBoxOutline" />
        {{ $t('community_edit.title') }}
      </v-card-title>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <span class="font-weight-bold">
              {{ $t('community_edit.community_cover_image') }}
            </span>
            <span class="text-subtitle-2 ml-2">
              {{ $t('community_edit.community_cover_image_hint') }}
            </span>
            <ImageInput
              :url="coverImagePreviewUrl"
              :rules="[requiredValidator]"
              style="width: 100%; aspect-ratio: 120/63"
              :cover="true"
              @fileSelected="(f) => (coverImageFile = f)"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <span class="font-weight-bold">
              {{ $t('community_edit.community_icon_image') }}
            </span>
            <span class="text-subtitle-2 ml-2">
              {{ $t('community_edit.community_icon_image_hint') }}
            </span>
            <ImageInput
              :url="iconImagePreviewUrl"
              :rules="[requiredValidator]"
              style="width: auto; max-width: min(100%, 150px); aspect-ratio: 1/1"
              :cover="true"
              @fileSelected="(f) => (iconImageFile = f)"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text class="mt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="community.community_name"
              outlined
              dense
              :hint="$t('community_edit.community_name_hint')"
              :label="$t('community_edit.community_name')"
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
              rows="6"
              :hint="$t('community_edit.community_desc_hint')"
              :label="$t('community_edit.community_desc')"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text class="mt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field
              ref="accountFieldRef"
              v-model="community.community_account"
              prefix="shokujii.jp/c/"
              outlined
              dense
              :hint="$t('validator.account')"
              :readonly="!isNew"
              :label="$t(isNew ? 'community_edit.account' : 'community_edit.account_readonly')"
              :loading="isCheckingAccount"
              :rules="[requiredValidator, isValidSameAccount, accountValidator]"
              @update:modelValue="checkAccountExists"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-text class="my-5">
        <v-switch v-model="community.is_public" hide-details>
          <template #label>
            <span v-if="community.is_public">{{ $t('community_edit.public') }}</span>
            <span v-else>{{ $t('community_edit.private') }}</span>
          </template>
        </v-switch>
        <div class="text-subtitle-2">
          <span v-if="community.is_public">
            <div v-html="$t('community_edit.public_desc')" />
          </span>
          <span v-else>
            <div v-html="$t('community_edit.private_desc')" />
          </span>
        </div>
      </v-card-text>
      <v-card-text class="text-center mt-10" v-if="isNew">
        <div v-html="$t('community_edit.community_create_next')" />
      </v-card-text>

      <slot :isValid="isValid" />
    </v-card>

    <v-card flat class="mt-6 mt-md-10 pa-3 pa-md-10" v-if="!isNew">
      <v-card-title class="pt-6 pt-md-10 px-2 px-md-5">
        <v-icon size="50" class="text--primary me-3" :icon="mdiEmailOutline" />
        {{ $t('community_edit.email_setting') }}
      </v-card-title>
      <v-card-text class="px-2 px-md-5 pb-5 text-body-2">
        {{ $t('community_edit.email_hint') }}
      </v-card-text>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="community.community_email"
              outlined
              dense
              :label="$t('email')"
              :rules="[emailValidator]"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-title class="pt-6 pt-md-10 px-2 px-md-5">
        <v-icon size="50" class="text--primary me-3" :icon="mdiWeb" />
        {{ $t('community_edit.sns_setting') }}
      </v-card-title>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="community.community_sns_officialsite"
              outlined
              dense
              :label="$t('community_edit.officialsite')"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <SnsTextField
              v-model="community.community_sns_twitter"
              outlined
              dense
              :label="$t('community_edit.twitter')"
              prefix="https://x.com/"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <SnsTextField
              v-model="community.community_sns_facebook"
              outlined
              dense
              :label="$t('community_edit.facebook')"
              prefix="https://www.facebook.com/"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <SnsTextField
              v-model="community.community_sns_instagram"
              outlined
              dense
              :label="$t('community_edit.instagram')"
              prefix="https://www.instagram.com/"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="community_sns_hash_tag"
              outlined
              dense
              :label="$t('community_edit.hash_tag')"
              prefix="#"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- Activity -->
      <v-card-title class="pt-6 pt-md-10 pl-2 pl-md-5">
        <v-icon size="50" class="text--primary me-3" :icon="mdiAccountOutline" />
        {{ $t('community_edit.manager_info') }}
      </v-card-title>
      <v-card-text class="px-2 px-md-5 pb-6 pb-md-10 text-body-2">
        {{ $t('community_edit.manager_info_hint') }}
      </v-card-text>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="community.community_manager_fullname"
              outlined
              dense
              :label="$t('community_edit.manager_name')"
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
              :label="$t('community_edit.company_name')"
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
              :label="$t('postal_code')"
              :rules="[postalCodeValidator]"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="community.community_address_base"
              outlined
              dense
              readonly
              :label="$t('address')"
              :hint="$t('address_hint')"
              persistent-hint
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="community.community_address_detail"
              outlined
              dense
              :label="$t('detail_address')"
              :hint="$t('detail_address_hint')"
              persistent-hint
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
              :label="$t('phone_number')"
              :rules="[phoneValidator]"
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
              :label="$t('community_edit.use_purpose')"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <!-- 請求書情報 -->
      <v-card-title class="pt-6 pt-md-10 pl-2 pl-md-5">
        <v-icon size="50" class="text--primary me-3" :icon="mdiAccountCreditCardOutline" />
        {{ $t('community_edit.bill_info') }}
      </v-card-title>
      <v-card-text class="px-2 px-md-5 pb-6 pb-md-10 text-body-2">
        <div v-html="$t('community_edit.bill_info_hint')" />
      </v-card-text>
      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="community.community_bill_fullname"
              outlined
              dense
              :label="$t('community_edit.bill_fullname')"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="community.community_bill_email"
              outlined
              dense
              :label="$t('community_edit.bill_email')"
              :rules="[emailValidator]"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <slot :isValid="isValid" />
    </v-card>
  </v-form>
  <div>
    <confirm-dialog v-model="isOpenNewCommunityDialog" :ok-text="'OK'" max-width="800px">
      <v-card-text class="text-center my-2 text-h4">
        {{ $t('community_new_modal.community.title') }}
      </v-card-text>
      <v-card-text class="text-subtitle" style="line-height: 1.6rem">
        <div v-html="$t('community_new_modal.community.desc')" />
      </v-card-text>
    </confirm-dialog>
  </div>
</template>
