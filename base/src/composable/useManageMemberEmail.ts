import { useNotification } from '@shokujii/base/composable/notification.js'
import type { ManageCommunitySettingsPathResolver } from '@shokujii/base/composable/managePathResolvers.js'
import type { User } from '@shokujii/common/schemas/User.js'
import { computed, ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

type UseManageMemberEmailOptions = {
  communityAccount: Ref<string> | (() => string)
  communityEmail: Ref<string | undefined> | (() => string | undefined)
  getManageCommunitySettingsPath: ManageCommunitySettingsPathResolver
}

export const useManageMemberEmail = (options: UseManageMemberEmailOptions) => {
  const notification = useNotification()
  const router = useRouter()
  const { t: $t } = useI18n()

  const resolveCommunityAccount = () =>
    typeof options.communityAccount === 'function' ? options.communityAccount() : options.communityAccount.value

  const resolveCommunityEmail = () =>
    typeof options.communityEmail === 'function' ? options.communityEmail() : options.communityEmail.value

  const canSendEmail = computed(() => {
    const email = resolveCommunityEmail()
    return email != null && email !== ''
  })

  const targetMember = ref<User | null>(null)
  const isEmailDialogOpen = computed({
    get: () => targetMember.value != null,
    set: (val) => {
      if (!val) {
        targetMember.value = null
      }
    },
  })
  const isOpenEmailSetupDialog = ref(false)

  const clickEmailButton = (member: User) => {
    if (!canSendEmail.value) {
      isOpenEmailSetupDialog.value = true
      return
    }
    targetMember.value = member
  }

  const goToCommunitySettings = () => {
    const account = resolveCommunityAccount()
    if (account === '') {
      return
    }
    router.push(options.getManageCommunitySettingsPath(account))
  }

  const onEmailSent = () => {
    notification.show($t('email_dialog.sent'), 'success')
  }

  const onEmailFailed = () => {
    // エラー通知は EmailDialog 内で表示
  }

  return {
    canSendEmail,
    targetMember,
    isEmailDialogOpen,
    isOpenEmailSetupDialog,
    clickEmailButton,
    goToCommunitySettings,
    onEmailSent,
    onEmailFailed,
  }
}
