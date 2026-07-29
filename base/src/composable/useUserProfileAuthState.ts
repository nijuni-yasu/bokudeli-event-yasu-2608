import { computed, type ComputedRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@shokujii/base/stores/user.js'
import { useUserProfilePreviewStore } from '@shokujii/base/stores/userProfilePreview.js'
import { User } from '@shokujii/common/schemas/User.js'
import type { GetUserProfilePreviewResponse } from '@shokujii/common/apis/userProfile.js'

export type UserProfileAuthMode = 'pf-firestore' | 'enterprise-callable-gate'

export type UserProfileAuthState = {
  displayUser: ComputedRef<User | null>
  department: ComputedRef<string | null>
  isProfileLoading: ComputedRef<boolean>
  isProfileGateLoading: ComputedRef<boolean>
  isProfileAccessDenied: ComputedRef<boolean>
  isInvalidProfile: ComputedRef<boolean>
  isProfileReady: ComputedRef<boolean>
  isPreviewAccessGranted: ComputedRef<boolean>
  canInitTabStores: ComputedRef<boolean>
  previewStore: ReturnType<typeof useUserProfilePreviewStore>
  previewData: ComputedRef<GetUserProfilePreviewResponse | null>
  previewLoading: ComputedRef<boolean>
  previewError: ComputedRef<unknown>
}

export const useUserProfileAuthState = (profileUserId: string, authMode: UserProfileAuthMode): UserProfileAuthState => {
  const isEnterpriseMode = authMode === 'enterprise-callable-gate'

  const previewStore = useUserProfilePreviewStore(profileUserId)
  const {
    data: previewData,
    loading: previewLoading,
    error: previewError,
    notFound: previewNotFound,
    accessDenied: previewAccessDenied,
  } = storeToRefs(previewStore)

  const { user, exists } = storeToRefs(
    useUserStore(profileUserId, { autoSubscribe: !isEnterpriseMode }),
  )

  const displayUser = computed((): User | null => {
    if (isEnterpriseMode) {
      const profile = previewData.value?.user_profile
      if (profile == null) {
        return null
      }
      return new User(profile.user_id, profile)
    }
    return user.value
  })

  const department = computed((): string | null => {
    if (!isEnterpriseMode) {
      return null
    }
    return previewData.value?.department ?? null
  })

  const isProfileLoading = computed(() => !isEnterpriseMode && profileUserId !== '' && exists.value === null)

  const isProfileGateLoading = computed(
    () =>
      isEnterpriseMode &&
      profileUserId !== '' &&
      previewLoading.value &&
      previewData.value == null &&
      !previewNotFound.value &&
      !previewAccessDenied.value,
  )

  const isProfileAccessDenied = computed(() => isEnterpriseMode && previewAccessDenied.value)

  const isInvalidProfile = computed(() => {
    if (isEnterpriseMode) {
      return previewNotFound.value
    }
    return exists.value === false || (user.value != null && user.value.is_deleted)
  })

  const isProfileReady = computed(() => {
    if (isEnterpriseMode) {
      return previewData.value != null && displayUser.value != null
    }
    return displayUser.value != null
  })

  const isPreviewAccessGranted = computed(() => {
    if (isEnterpriseMode) {
      return profileUserId !== '' && !previewNotFound.value && !previewAccessDenied.value && previewData.value != null
    }
    if (profileUserId === '') {
      return false
    }
    if (exists.value === null) {
      return false
    }
    if (exists.value === false || (user.value != null && user.value.is_deleted)) {
      return false
    }
    return true
  })

  const canInitTabStores = isPreviewAccessGranted

  return {
    displayUser,
    department,
    isProfileLoading,
    isProfileGateLoading,
    isProfileAccessDenied,
    isInvalidProfile,
    isProfileReady,
    isPreviewAccessGranted,
    canInitTabStores,
    previewStore,
    previewData,
    previewLoading,
    previewError,
  }
}
