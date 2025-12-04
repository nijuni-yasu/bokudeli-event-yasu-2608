<script setup lang="ts">
import XIcon from '@shokujii/base/icons/x.js'
import FacebookIcon from '@shokujii/base/icons/facebook.vue'
import GoogleIcon from '@shokujii/base/icons/google.vue'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import { FirebaseError } from 'firebase/app'
import { useValidators } from '@shokujii/base/composable/validators.js'
import type { VForm } from 'vuetify/components'
import { db } from '@shokujii/base/firebase.js'
import { getDocs, query, collection, where } from 'firebase/firestore'
import { mdiUpload } from '@mdi/js'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useNotification } from '@shokujii/base/composable/notification'
import { type ProviderIdType } from '@shokujii/base/utils/providerService'
import { User } from '@shokujii/common/schemas/User.js'
import { getRedirectPath } from '@shokujii/base/utils/redirect'
import { getPassCode } from '@/router/utils'

const currentUserStore = useCurrentUserStore()
const { providerData, user, personalInformation: currentUserPersonalInformation } = storeToRefs(currentUserStore)
const currentUser = ref(new User('', {}))
watch(
  user,
  (u) => {
    if (u != null) {
      currentUser.value = new User(u.id, u)
    }
  },
  { immediate: true },
)

const _email = ref<string | null>(null)
const email = computed({
  get() {
    return _email.value ?? currentUserPersonalInformation.value?.user_email
  },
  set(value) {
    _email.value = value ?? null
  },
})

const linkedGogleAccount = computed(() => {
  return providerData.value?.find((pd) => pd.providerId === 'google.com')?.email ?? null
})

const linkedFacebookAccount = computed(() => {
  return providerData.value?.find((pd) => pd.providerId === 'facebook.com')?.displayName ?? null
})

const linkedTwitterAccount = computed(() => {
  return providerData.value?.find((pd) => pd.providerId === 'twitter.com')?.displayName ?? null
})

const router = useRouter()

const isProfileLoading = ref<boolean>(false)
const isEmailLoading = ref<boolean>(false)
const isSnsLoading = ref<ProviderIdType | null>(null)

const isValidProfile = ref<boolean>(false)
const isValidEmail = ref<boolean>(false)

const isOpenTwitterLinkDialog = ref<boolean>(false)
const targetUnLinkProvider = ref<ProviderIdType | null>(null)
const isOpenUnLinkDialog = computed<boolean>({
  get() {
    return targetUnLinkProvider.value != null
  },
  set(value) {
    if (!value) {
      targetUnLinkProvider.value = null
    }
  },
})

const form = ref<VForm | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const userImage = ref<File | undefined>(undefined)

const isNewUser = history.state?.isNewUser ?? false

const imageError = ref('')

const notification = useNotification()
const { t: $t } = useI18n()

// バリデーション関連 ここから
const { requiredValidator, emailValidator, urlValidator, accountValidator } = useValidators()

const accountFieldRef = ref()
const isCheckingAccount = ref(false)
const isValidSameAccount = ref<true | string>(true)

const validateAccount = async (userAccount: string): Promise<boolean> => {
  // TODO store で処理できるように
  const duplicatedUserAccount = await getDocs(query(collection(db, 'users'), where('user_account', '==', userAccount)))
  if (userAccount === currentUser.value?.user_account || userAccount === '') {
    return true
  }
  return duplicatedUserAccount.empty
}

const checkAccountExists = async (value: string) => {
  isCheckingAccount.value = true
  try {
    isValidSameAccount.value = (await validateAccount(value)) || $t('profile.validator_account_exists')
    await nextTick(() => {
      accountFieldRef.value.validate()
    })
  } finally {
    isCheckingAccount.value = false
  }
}

const validateImage = () => {
  if (!currentUser.value?.user_image_url && !userImage.value) {
    imageError.value = $t('profile.choice_profile_image')
    return false
  } else {
    imageError.value = ''
    return true
  }
}

watch(userImage, validateImage)
// バリデーション関連 ここまで

// 画像ファイル選択処理
const triggerFileInput = (): void => {
  fileInput.value?.click()
}

const readImageFiles = (files: File | File[]) => {
  if (files instanceof File) files = [files]
  if (files.length === 0 || currentUser.value == null) {
    return
  }
  const file = files[0]
  userImage.value = file
  currentUser.value.user_image_url = URL.createObjectURL(file)
}

const profileSubmit = async () => {
  if (!isValidProfile.value || !validateImage()) {
    validateImage()
    form.value?.validate()
    return
  }

  try {
    isProfileLoading.value = true

    const image = userImage.value

    await currentUserStore.updateUser(toRaw(currentUser.value!))
    if (image != undefined) {
      try {
        await currentUserStore.uploadUserImage(image)
        userImage.value = undefined
      } catch (err) {
        console.error(err)
        window.alert($t('profile.fail_image_upload'))
      }
    }

    notification.show($t('profile.update_profile'), 'success')

    const redirectPath = getRedirectPath() ?? '/'
    return await router.push(redirectPath)
  } catch (error) {
    console.warn('Error profile submit:', error)
  } finally {
    isProfileLoading.value = false
  }
}

const emailSubmit = async () => {
  if (currentUser.value == null || currentUserPersonalInformation.value == null) {
    throw new Error('User is not logged in')
  }
  try {
    isEmailLoading.value = true

    const newUserEmail = email.value as string

    if (currentUserPersonalInformation.value?.user_email === newUserEmail) {
      notification.show($t('profile.not_changed_email'), 'warning')
      return
    }

    await currentUserStore.requestEmailChange(newUserEmail)

    return await router.push(getPassCode(newUserEmail))
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'functions/already-exists') {
      notification.show($t('profile.exist_email'), 'warning')
    }
    console.warn('Error email submit:', error)
  } finally {
    isEmailLoading.value = false
  }
}

const handleProviderLink = async (providerId: ProviderIdType) => {
  try {
    isSnsLoading.value = providerId
    await currentUserStore.linkProvider(providerId)
  } catch (error) {
    if (error instanceof FirebaseError) {
      if (error.code === 'auth/credential-already-in-use') {
        notification.show($t('user.exists_credential', { snsName: providerId }), 'error')
      }
      if (error.code === 'auth/email-already-in-use') {
        notification.show($t('complete.exists_email'), 'error')
      }
    } else {
      console.error(error)
    }
  } finally {
    isSnsLoading.value = null
  }
}

const handleUnLink = async (providerId: ProviderIdType) => {
  isOpenUnLinkDialog.value = true
  targetUnLinkProvider.value = providerId as ProviderIdType
}

const confirmUnLink = async (providerId: ProviderIdType) => {
  try {
    isSnsLoading.value = providerId
    await currentUserStore.unlinkProvider(providerId)
  } finally {
    isSnsLoading.value = null
  }
}
</script>

<template>
  <v-container v-if="currentUser != null" class="px-1">
    <v-form ref="form" v-model="isValidProfile" @submit.prevent="profileSubmit">
      <v-row justify="center" class="mt-1 mt-md-16 px-1">
        <v-col lg="6" md="8" sm="10" cols="12" class="px-1">
          <v-sheet class="rounded-lg py-14 px-5 px-sm-16">
            <div class="text-center text-h3 font-weight-bold">{{ $t('profile.profile_settings') }}</div>

            <v-sheet class="d-flex justify-center mt-4 mb-12">
              <div style="position: relative">
                <UserAvatar :user="currentUser" :size="140" @click="triggerFileInput" />
                <v-btn
                  :icon="mdiUpload"
                  size="small"
                  variant="flat"
                  class="edit-text"
                  @click="triggerFileInput"
                ></v-btn>
              </div>
            </v-sheet>
            <p v-if="imageError !== ''" class="text-center text-error font-weight-bold">{{ imageError }}</p>

            <!-- ファイル選択 -->
            <v-file-input class="d-none" accept="image/*" ref="fileInput" @update:model-value="readImageFiles" />

            <v-sheet class="d-flex flex-column ga-7 mb-12">
              <v-text-field
                :label="$t('profile.user_name')"
                v-model="currentUser.user_name"
                variant="outlined"
                :disabled="isProfileLoading"
                :rules="[requiredValidator]"
              />

              <v-text-field
                :label="$t('profile.user_account')"
                v-model="currentUser.user_account"
                prefix="shokujii.jp/u/"
                variant="outlined"
                :disabled="isProfileLoading"
                :rules="[isValidSameAccount, accountValidator]"
                ref="accountFieldRef"
                @update:modelValue="checkAccountExists"
              />

              <v-textarea
                :label="$t('profile.user_description')"
                v-model="currentUser.user_description"
                rows="5"
                variant="outlined"
                :disabled="isProfileLoading"
                :rules="[requiredValidator]"
              />
            </v-sheet>
            <v-row justify="center">
              <v-btn class="rounded-xl" color="primary" :loading="isProfileLoading" type="submit">{{
                $t('profile.change_settings')
              }}</v-btn>
            </v-row>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row v-if="!isNewUser" justify="center" class="mt-8">
        <v-col lg="6" md="8" sm="10" cols="12" class="px-1">
          <v-sheet class="rounded-lg py-14 px-5 px-sm-16">
            <div class="text-center text-h3 font-weight-bold mb-4">{{ $t('profile.social_link') }}</div>
            <div class="text-subtitle-1 mt-3 mb-10" v-html="$t('profile.social_link_description')" />

            <v-sheet class="d-flex flex-column ga-7 mb-12">
              <v-text-field
                :label="$t('profile.user_sns_twitter')"
                v-model="currentUser.user_sns_twitter"
                prefix="x.com/"
                variant="outlined"
                hide-details
                :disabled="!!currentUser.user_sns_twitter"
                readonly
                @click="() => (isOpenTwitterLinkDialog = true)"
              />

              <v-text-field
                :label="$t('profile.user_sns_facebook')"
                v-model="currentUser.user_sns_facebook"
                prefix="facebook.com/"
                variant="outlined"
                hide-details
                :disabled="isProfileLoading"
              />

              <v-text-field
                :label="$t('profile.user_sns_instagram')"
                v-model="currentUser.user_sns_instagram"
                prefix="instagram.com/"
                variant="outlined"
                hide-details
                :disabled="isProfileLoading"
              />

              <v-text-field
                :label="$t('profile.user_sns_website')"
                v-model="currentUser.user_sns_website"
                variant="outlined"
                :disabled="isProfileLoading"
                :rules="[urlValidator]"
              />
            </v-sheet>
            <v-row justify="center">
              <v-btn class="rounded-xl" color="primary" :loading="isProfileLoading" type="submit">{{
                $t('profile.change_settings')
              }}</v-btn>
            </v-row>
          </v-sheet>
        </v-col>
      </v-row>
    </v-form>

    <v-row v-if="!isNewUser" justify="center" class="mt-8">
      <v-col lg="6" md="8" sm="10" cols="12" class="px-0">
        <v-sheet class="rounded-lg py-14 px-5 px-sm-16">
          <div class="text-center text-h3 font-weight-bold">{{ $t('profile.email') }}</div>

          <div>
            <div class="text-subtitle-1 mt-3 mb-10">{{ $t('profile.email_description') }}</div>
            <v-form v-model="isValidEmail" @submit.prevent="emailSubmit">
              <v-text-field
                class="my-12"
                :label="$t('profile.change_settings')"
                v-model="email"
                variant="outlined"
                :disabled="isEmailLoading"
                :rules="[requiredValidator, emailValidator]"
              />
              <v-row justify="center">
                <v-btn
                  class="rounded-xl"
                  color="primary"
                  :disabled="!isValidEmail"
                  :loading="isEmailLoading"
                  type="submit"
                  >{{ $t('profile.change_settings') }}</v-btn
                >
              </v-row>
            </v-form>
          </div>
        </v-sheet>
      </v-col>
    </v-row>

    <v-row v-if="!isNewUser" justify="center" class="mt-8">
      <v-col lg="6" md="8" sm="10" cols="12" class="px-0">
        <v-sheet class="rounded-lg py-14 px-5 px-sm-16">
          <div class="text-center text-h3 font-weight-bold">{{ $t('profile.account_linkage') }}</div>
          <div class="text-subtitle-1 mt-3 mb-10">{{ $t('profile.account_linkage_description') }}</div>

          <div class="d-flex flex-column flex-md-row justify-space-between align-center my-8">
            <div class="d-flex flex-column">
              <label class="align-center">
                <v-icon :icon="GoogleIcon" size="x-large" class="me-3" />{{ $t('profile.google') }}
              </label>
              <label v-if="linkedGogleAccount != null" class="ml-11 font-weight-bold">
                {{ linkedGogleAccount }}
              </label>
              <label v-else class="ml-11 re-link">
                <div v-html="$t('profile.re_link')"></div>
              </label>
            </div>

            <div class="mt-6 mt-md-0">
              <v-btn
                v-if="linkedGogleAccount == null"
                variant="outlined"
                color="grey-500"
                width="100"
                :loading="isSnsLoading === 'google.com'"
                :disabled="isSnsLoading !== null && isSnsLoading !== 'google.com'"
                @click="handleProviderLink('google.com')"
              >
                {{ $t('profile.linkage') }}
              </v-btn>
              <v-btn
                v-else
                color="grey-900"
                width="100"
                :loading="isSnsLoading === 'google.com'"
                :disabled="isSnsLoading !== null && isSnsLoading !== 'google.com'"
                @click="() => handleUnLink('google.com')"
              >
                {{ $t('profile.linked') }}
              </v-btn>
            </div>
          </div>

          <hr />

          <div class="d-flex flex-column flex-md-row justify-space-between align-center my-8">
            <div class="d-flex flex-column">
              <label class="align-center">
                <v-icon :icon="FacebookIcon" size="x-large" class="me-3" />{{ $t('profile.facebook') }}
              </label>
              <label v-if="linkedFacebookAccount != null" class="ml-11 font-weight-bold">
                {{ linkedFacebookAccount }}
              </label>
              <label v-else class="ml-11 re-link">
                <div v-html="$t('profile.re_link')"></div>
              </label>
            </div>

            <div class="mt-6 mt-md-0">
              <v-btn
                v-if="linkedFacebookAccount == null"
                variant="outlined"
                color="grey-500"
                width="100"
                :loading="isSnsLoading === 'facebook.com'"
                :disabled="isSnsLoading !== null && isSnsLoading !== 'facebook.com'"
                @click="handleProviderLink('facebook.com')"
                >{{ $t('profile.linkage') }}</v-btn
              >
              <v-btn
                v-else
                color="grey-900"
                width="100"
                :loading="isSnsLoading === 'facebook.com'"
                :disabled="isSnsLoading !== null && isSnsLoading !== 'facebook.com'"
                @click="() => handleUnLink('facebook.com')"
                >{{ $t('profile.linked') }}</v-btn
              >
            </div>
          </div>

          <hr />

          <div class="d-flex flex-column flex-md-row justify-space-between align-center my-8">
            <div class="d-flex flex-column">
              <label class="align-center">
                <v-icon :icon="XIcon" size="x-large" class="me-3" />{{ $t('profile.twitter') }}
              </label>
              <label v-if="linkedTwitterAccount != null" class="ml-11 font-weight-bold">
                {{ linkedTwitterAccount }}
              </label>
              <label v-else class="ml-11 re-link">
                <div v-html="$t('profile.re_link')"></div>
              </label>
            </div>

            <div class="mt-6 mt-md-0">
              <v-btn
                v-if="linkedTwitterAccount == null"
                variant="outlined"
                color="grey-500"
                width="100"
                :loading="isSnsLoading === 'twitter.com'"
                :disabled="isSnsLoading !== null && isSnsLoading !== 'twitter.com'"
                @click="handleProviderLink('twitter.com')"
              >
                {{ $t('profile.linkage') }}
              </v-btn>
              <v-btn
                v-else
                color="grey-900"
                width="100"
                :loading="isSnsLoading === 'twitter.com'"
                :disabled="isSnsLoading !== null && isSnsLoading !== 'twitter.com'"
                @click="() => handleUnLink('twitter.com')"
              >
                {{ $t('profile.linked') }}
              </v-btn>
            </div>
          </div>
        </v-sheet>
      </v-col>
    </v-row>

    <confirm-dialog
      v-model="isOpenTwitterLinkDialog"
      :is-confirm="true"
      :ok-text="$t('profile.linkage')"
      :ok-click="() => handleProviderLink('twitter.com')"
    >
      <v-card-text class="text-center py-10 text-h4">
        {{ $t('profile.twitter_link_modal_title') }}
      </v-card-text>
      <v-card-text class="text-center py-5">{{ $t('profile.twitter_link_modal_description') }} </v-card-text>
    </confirm-dialog>
    <confirm-dialog
      v-model="isOpenUnLinkDialog"
      :is-confirm="true"
      :ok-text="$t('profile.unlink')"
      :ok-click="() => confirmUnLink(targetUnLinkProvider!)"
    >
      <v-card-text class="text-center py-10 text-h4">
        {{ $t('profile.unlink_modal_title') }}
      </v-card-text>
    </confirm-dialog>
  </v-container>
</template>

<style scoped lang="scss">
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.edit-text {
  position: absolute;
  bottom: -5px;
  right: 0;
  text-decoration: underline;
  cursor: pointer;
}

.cursor-none {
  cursor: none;
}
.re-link {
  font-size: 11px;
  color: #2e263d8c;
  padding: 5px;
}
</style>
