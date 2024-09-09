<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useValidators } from '@/composable/validators'
import ImageInput from '@/components/ImageInput.vue'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import { mdiListBoxOutline, mdiImage, mdiWeb, mdiLightbulbOnOutline, mdiAccountOutline } from '@mdi/js'

const { requiredValidator, postalCodeValidator, phoneValidator, emailValidator, accountValidator } = useValidators()

const { t: $t } = useI18n()

const community = defineModel<BokudeliCommunity>({ required: true })
const coverImageFile = defineModel<File | null>('coverImageFile', { required: true })
const iconImageFile = defineModel<File | null>('iconImageFile', { required: true })
const props = defineProps<{
  /**
   * 新規アカウントのバリデーション関数
   * この関数が設定されていない場合、編集モードとして扱われ community_account は readonly になります
   */
  validateNewAccount?: (account: string) => Promise<boolean>
}>()
const isNew = computed(() => props.validateNewAccount != null)

const isValid = ref(false)

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
</script>

<template>
  <v-form v-model="isValid">
    <v-card flat class="mt-2">
      <!-- <v-row>
              <v-col cols="12" class="text-right">
                <v-btn
                  color="primary"
                  class="me-3 mt-3"
                  :icon="mdiHelpCircleOutline"
                  size="x-large"
                  density="compact"
                  variant="text"
                  @click="isOpenNewCommunityDialog = true"
                />
              </v-col>
            </v-row> -->
      <v-card-title class="px-5">
        <v-icon size="50" class="text--primary me-3" :icon="mdiListBoxOutline" />
        {{ $t('community_edit.title') }}
      </v-card-title>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field
              ref="accountFieldRef"
              v-model="community.community_account"
              outlined
              dense
              :readonly="!isNew"
              :label="$t(isNew ? 'community_edit.account' : 'community_edit.account_readonly')"
              :loading="isCheckingAccount"
              :rules="[requiredValidator, isValidSameAccount, accountValidator]"
              @update:modelValue="checkAccountExists"
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
              rows="10"
              :label="$t('community_edit.community_description')"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-title class="pt-10 px-5">
        <v-icon size="50" class="text--primary me-3" :icon="mdiImage" />
        {{ $t('community_edit.image_setting') }}
      </v-card-title>
      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <ImageInput
              :url="community.community_icon_image_url ?? undefined"
              :rules="[requiredValidator]"
              style="width: auto; max-width: min(100%, 300px); aspect-ratio: 1/1"
              :cover="true"
              @fileSelected="(f) => (iconImageFile = f)"
            />
            {{ $t('community_edit.community_icon_image_hint') }}
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
              @fileSelected="(f) => (coverImageFile = f)"
            />
            {{ $t('community_edit.community_cover_image_hint') }}
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-title class="pt-10 px-5">
        <v-icon size="50" class="text--primary me-3" :icon="mdiWeb" />
        {{ $t('community_edit.sns_setting') }}
      </v-card-title>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="community.community_sns_facebook"
              outlined
              dense
              :label="$t('community_edit.facebook')"
              prefix="https://www.facebook.com/"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="community.community_sns_twitter"
              outlined
              dense
              :label="$t('community_edit.twitter')"
              prefix="https://x.com/"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="community.community_sns_instagram"
              outlined
              dense
              :label="$t('community_edit.instagram')"
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
              :label="$t('community_edit.officialsite')"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- Activity -->
      <v-card-title class="pt-10 px-5">
        <v-icon size="50" class="text--primary me-3" :icon="mdiLightbulbOnOutline" />
        {{ $t('community_edit.public_setting') }}
      </v-card-title>
      <v-card-text>
        <v-switch v-model="community.is_public" hide-details class="mt-0">
          <template #label> {{ $t('community_edit.public') }} </template>
        </v-switch>
      </v-card-text>
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
      <slot :isValid="isValid" />
    </v-card>
  </v-form>
</template>
