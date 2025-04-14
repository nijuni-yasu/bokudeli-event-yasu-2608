<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useValidators } from '@/composable/validators'
import ImageInput from '@/components/ImageInput.vue'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import {
  mdiListBoxOutline,
  mdiWeb,
  mdiAccountOutline,
  mdiAccountCreditCardOutline,
  mdiHelp,
} from '@mdi/js'
import SnsTextField from './SnsTextField.vue'
import { trimHashTag } from '@/utils/hashTag'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const { requiredValidator, postalCodeValidator, phoneValidator, emailValidator, accountValidator } = useValidators()

const { t: $t } = useI18n()

const community = defineModel<BokudeliCommunity>({ required: true })
const coverImageFile = defineModel<File | null>('coverImageFile', { required: true })
const iconImageFile = defineModel<File | null>('iconImageFile', { required: true })
const props = defineProps<{
  /**
   * 新規コミュニティURLのバリデーション関数
   * この関数が設定されていない場合、編集モードとして扱われ community_account は readonly になります
   */
  validateNewAccount?: (account: string) => Promise<boolean>
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
</script>

<template>
  <v-form v-model="isValid">
    <v-card flat class="mt-2 pa-10">
      <v-card-title class="px-5 text-h3 font-weight-bold" v-if="isNew">
        <v-row class="pa-3 align-center">
          {{ $t('community_edit.create') }}
          <v-btn class="ml-2" variant="outlined" size="x-small" :icon="mdiHelp" @click="isOpenNewCommunityDialog = true" />
        </v-row>
      </v-card-title>
      <v-card-title class="px-5" v-else>
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
              :url="community.community_cover_image_url ?? undefined"
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
              :url="community.community_icon_image_url ?? undefined"
              :rules="[requiredValidator]"
              style="width: auto; max-width: min(100%, 200px); aspect-ratio: 1/1"
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

    <v-card flat class="mt-10 pa-10" v-if="!isNew">
      <v-card-title class="pt-10 px-5">
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
      <v-card-title class="pt-10 pl-5">
        <v-icon size="50" class="text--primary me-3" :icon="mdiAccountOutline" />
        {{ $t('community_edit.manager_info') }}
      </v-card-title>
      <v-card-text class="px-5 pb-10">
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
              :label="$t('community_edit.company_name')"
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
              :label="$t('postal_code')"
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
              :label="$t('address')"
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
              :label="$t('phone_number')"
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
              :label="$t('email')"
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
              :label="$t('community_edit.use_purpose')"
              :rules="[requiredValidator]"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <!-- 請求書情報 -->
      <v-card-title class="pt-10 pl-5">
        <v-icon size="50" class="text--primary me-3" :icon="mdiAccountCreditCardOutline" />
        {{ $t('community_edit.bill_info') }}
      </v-card-title>
      <v-card-text class="px-5 pb-10 text-body-2">
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
