<script setup lang="ts">
import XIcon from '@shokujii/base/icons/x'
import FacebookIcon from '@shokujii/base/icons/facebook.vue'
import GoogleIcon from '@shokujii/base/icons/google.vue'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import { FirebaseError } from 'firebase/app'
import { useValidators } from '@shokujii/base/composable/validators.js'
import type { VForm } from 'vuetify/components'
import { mdiUpload } from '@mdi/js'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useNotification } from '@shokujii/base/composable/notification'
import { type ProviderIdType } from '@shokujii/base/utils/providerService'
import { User } from '@shokujii/common/schemas/User.js'
import { getRedirectPath } from '@shokujii/base/utils/redirect'
import { getPassCode } from '@/router/utils'
import { checkSoleManagerCommunity } from '@shokujii/base/stores/community.js'
import { deleteUserAccount } from '@shokujii/base/apis/user.js'
import { validateImageFile } from '@shokujii/base/utils/image'
import { ALLOWED_IMAGE_ACCEPT_ATTR } from '@shokujii/common/constants/imageMimeTypes.js'

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
const userImagePreview = ref<string | undefined>(undefined)

const isNewUser = history.state?.isNewUser ?? false

const isSoleManager = ref<boolean | null>(null)
const isOpenDeleteAccountDialog = ref(false)
const isOpenDeleteCompleteDialog = ref(false)
const isDeleteAccountLoading = ref(false)

const imageError = ref('')

const notification = useNotification()
const { t: $t } = useI18n()

// バリデーション関連 ここから
const { requiredValidator, emailValidator, urlValidator } = useValidators()

const validateImage = () => {
  if (!currentUser.value?.user_image_url && !userImage.value && !userImagePreview.value) {
    imageError.value = $t('profile.choice_profile_image')
    return false
  } else {
    imageError.value = ''
    return true
  }
}

watch(userImage, validateImage)
// バリデーション関連 ここまで

// uid 取得後に唯一管理者判定を再実行（Auth 初期化タイミングに依存しない）
watch(
  user,
  async (u) => {
    if (u?.id != null) {
      try {
        isSoleManager.value = await checkSoleManagerCommunity(u.id)
      } catch {
        isSoleManager.value = null
      }
    } else {
      isSoleManager.value = null
    }
  },
  { immediate: true },
)

// 画像ファイル選択処理
const triggerFileInput = (): void => {
  fileInput.value?.click()
}

const releaseUserImagePreview = () => {
  if (userImagePreview.value != null) {
    URL.revokeObjectURL(userImagePreview.value)
    userImagePreview.value = undefined
  }
}

const readImageFiles = (files: File | File[]) => {
  if (files instanceof File) files = [files]
  if (files.length === 0 || currentUser.value == null) {
    return
  }
  const file = files[0]
  const result = validateImageFile(file)
  if (!result.ok) {
    const msg = $t(result.messageKey)
    userImage.value = undefined
    releaseUserImagePreview()
    // watch(userImage) 内の validateImage が先に走り既存 user_image_url があると imageError を空にするため、無効形式メッセージはその後に確定させる
    queueMicrotask(() => {
      imageError.value = msg
    })
    return
  }
  imageError.value = ''
  userImage.value = file
  releaseUserImagePreview()
  // プレビュー用のBlob URLを生成（currentUser.user_image_urlは変更しない）
  userImagePreview.value = URL.createObjectURL(file)
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
        // プレビューをクリーンアップ
        if (userImagePreview.value) {
          URL.revokeObjectURL(userImagePreview.value)
          userImagePreview.value = undefined
        }
      } catch (err) {
        console.error(err)
        window.alert($t('profile.fail_image_upload'))
      }
    }

    notification.show($t('profile.update_profile'), 'success')

    // isNewUser の時だけリダイレクトする
    if (isNewUser) {
      const redirectPath = getRedirectPath() ?? '/'
      return await router.push(redirectPath)
    }
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
  const snsName = $t(`sns_name['${providerId}']`)
  try {
    isSnsLoading.value = providerId
    await currentUserStore.linkProvider(providerId)
    notification.show($t('profile.linkage_completed', { snsName }), 'success')
  } catch (error) {
    if (error instanceof FirebaseError) {
      if (error.code === 'auth/credential-already-in-use') {
        notification.show($t('user.exists_credential', { snsName }), 'error')
      } else if (error.code === 'auth/email-already-in-use') {
        notification.show($t('complete.exists_email'), 'error')
      } else {
        notification.show($t('profile.linkage_failed', { snsName }), 'error')
      }
    } else {
      console.error(error)
      notification.show($t('profile.linkage_failed', { snsName }), 'error')
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
  const snsName = $t(`sns_name['${providerId}']`)
  try {
    isSnsLoading.value = providerId
    await currentUserStore.unlinkProvider(providerId)
    notification.show($t('profile.unlink_completed', { snsName }), 'success')
  } catch (error) {
    console.error(error)
    notification.show($t('profile.unlink_failed', { snsName }), 'error')
  } finally {
    isSnsLoading.value = null
    isOpenUnLinkDialog.value = false
  }
}

const handleDeleteAccountClick = () => {
  isOpenDeleteAccountDialog.value = true
}

const confirmDeleteAccount = async () => {
  try {
    isDeleteAccountLoading.value = true
    await deleteUserAccount()
    isOpenDeleteAccountDialog.value = false
    isOpenDeleteCompleteDialog.value = true
  } catch (error) {
    console.error('Failed to delete user account', error)
    const message =
      error instanceof FirebaseError && error.code === 'functions/failed-precondition'
        ? $t('profile.account_delete_sole_manager_error')
        : $t('profile.account_delete_failed')
    notification.show(message, 'error')
    isOpenDeleteAccountDialog.value = false
  } finally {
    isDeleteAccountLoading.value = false
  }
}

const handleDeleteCompleteOk = async () => {
  try {
    await currentUserStore.signOut()
    await router.push('/')
  } catch (error) {
    console.error('Failed to sign out or redirect after account deletion', error)
    notification.show($t('profile.account_delete_failed'), 'error')
  }
}

const handleDeleteCompleteOkClick = async () => {
  isOpenDeleteCompleteDialog.value = false
  await handleDeleteCompleteOk()
}
</script>

<template>
  <v-container v-if="currentUser != null" class="px-3">
    <v-form ref="form" v-model="isValidProfile" @submit.prevent="profileSubmit">
      <v-row justify="center" class="mt-1 mt-md-16">
        <v-col lg="6" md="8" sm="10" cols="12" class="px-1">
          <v-sheet class="rounded-lg py-14 px-6 px-sm-16">
            <div class="text-center text-h3 font-weight-bold">{{ $t('profile.profile_settings') }}</div>

            <v-sheet class="d-flex justify-center mt-4 mb-12">
              <div style="position: relative">
                <UserAvatar :user="userImagePreview ?? currentUser" :size="140" @click="triggerFileInput" />
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
            <v-file-input
              class="d-none"
              :accept="ALLOWED_IMAGE_ACCEPT_ATTR"
              ref="fileInput"
              @update:model-value="readImageFiles"
            />

            <v-sheet class="d-flex flex-column ga-7 mb-12">
              <v-text-field
                :label="$t('profile.user_name')"
                v-model="currentUser.user_name"
                variant="outlined"
                :disabled="isProfileLoading"
                :rules="[requiredValidator]"
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
                :disabled="isProfileLoading"
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
      <v-col lg="6" md="8" sm="10" cols="12" class="px-1">
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
      <v-col lg="6" md="8" sm="10" cols="12" class="px-1">
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

    <v-row v-if="!isNewUser" justify="center" class="mt-8">
      <v-col lg="6" md="8" sm="10" cols="12" class="px-0">
        <v-sheet class="rounded-lg pa-6">
          <v-btn
            variant="outlined"
            color="error"
            size="small"
            class="text-body-2 my-3"
            :disabled="isSoleManager !== false"
            @click="handleDeleteAccountClick"
          >
            {{ $t('profile.account_delete') }}
          </v-btn>
          <div class="text-body-2 text-medium-emphasis" v-html="$t('profile.account_delete_description')" />
          <p v-if="isSoleManager" class="text-body-2 text-error mt-2 mb-2">
            {{ $t('profile.account_delete_sole_manager_error') }}
          </p>
        </v-sheet>
      </v-col>
    </v-row>

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

    <v-dialog v-model="isOpenDeleteAccountDialog" max-width="420px" persistent>
      <v-card class="pa-4">
        <v-card-title class="text-h5">{{ $t('profile.account_delete_confirm_title') }}</v-card-title>
        <v-card-text>
          <span class="d-block py-5 text-body-2" v-html="$t('profile.account_delete_confirm_body')" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" :disabled="isDeleteAccountLoading" @click="isOpenDeleteAccountDialog = false">
            {{ $t('cancel') }}
          </v-btn>
          <v-btn color="error" :loading="isDeleteAccountLoading" @click="confirmDeleteAccount">
            {{ $t('profile.account_delete_button') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isOpenDeleteCompleteDialog" max-width="380px" persistent>
      <v-card class="pa-4">
        <v-card-title class="text-h5">{{ $t('profile.account_delete_complete_title') }}</v-card-title>
        <v-card-text>
          <span class="text-body-2">{{ $t('profile.account_delete_complete_message') }}</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="flat" @click="handleDeleteCompleteOkClick">
            {{ $t('profile.account_delete_complete_ok') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
</style>
