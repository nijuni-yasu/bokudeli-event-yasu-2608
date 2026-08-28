<script setup lang="ts">
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import { useValidators } from '@shokujii/base/composable/validators.js'
import type { VForm } from 'vuetify/components'
import { mdiUpload } from '@mdi/js'
import { useNotification } from '@shokujii/base/composable/notification'
import { User } from '@shokujii/common/schemas/User.js'
import { getRedirectPath } from '@shokujii/base/utils/redirect'
import { validateImageFile } from '@shokujii/base/utils/image'
import { ALLOWED_IMAGE_ACCEPT_ATTR } from '@shokujii/common/constants/imageMimeTypes.js'
import UserProfileTagsEditSection from '@shokujii/base/components/profile/UserProfileTagsEditSection.vue'

const currentUserStore = useCurrentUserStore()
const { user } = storeToRefs(currentUserStore)
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

const router = useRouter()

const isProfileLoading = ref<boolean>(false)

const isValidProfile = ref<boolean>(false)

const form = ref<VForm | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const userImage = ref<File | undefined>(undefined)
const userImagePreview = ref<string | undefined>(undefined)

const isNewUser = history.state?.isNewUser ?? false

const imageError = ref('')

const notification = useNotification()
const { t: $t } = useI18n()

const { requiredValidator } = useValidators()

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
    queueMicrotask(() => {
      imageError.value = msg
    })
    return
  }
  imageError.value = ''
  userImage.value = file
  releaseUserImagePreview()
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

              <UserProfileTagsEditSection />
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
