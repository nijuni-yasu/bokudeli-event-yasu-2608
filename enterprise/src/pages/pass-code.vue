<script setup lang="ts">
import { getAuth, signInWithCustomToken } from 'firebase/auth'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useNotification } from '@shokujii/base/composable/notification'
import { getRedirectPath } from '@shokujii/base/utils/redirect'
import { confirmEnterpriseEmailLogin, requestEnterpriseEmailLogin } from '@/apis/enterprise'
import { useEnterpriseStore } from '@/stores/enterprise'
import { setEnterpriseAuthTenantId } from '@/utils/enterpriseAuth'
import { getHomePath, getLogin } from '@/router/utils'
import LoginBrandingHeader from '@/components/login/LoginBrandingHeader.vue'
import LoginBackgroundLayout from '@/components/login/LoginBackgroundLayout.vue'

const router = useRouter()
const notification = useNotification()
const { t } = useI18n()
const enterpriseStore = useEnterpriseStore()

const isLoading = ref(false)
const isValidating = ref(false)
const passCode = ref('')
const isOpenUnMatchPassCodeDialog = ref(false)

const email = history.state?.email as string | undefined
if (email == null) {
  await router.replace(getLogin())
}

watch(passCode, async (newValue) => {
  if (newValue.length === 6) {
    await submit(newValue)
  }
})

const reSendPassCode = async () => {
  const enterprise = enterpriseStore.enterprise
  if (enterprise == null || email == null) {
    return
  }

  isLoading.value = true
  try {
    await requestEnterpriseEmailLogin({
      enterprise_id: enterprise.enterprise_id,
      email,
    })
    notification.show(t('enterprise.pass_code.resend_success'), 'success')
  } catch (error) {
    console.warn('Error resending pass code:', error)
    notification.show(t('enterprise.login.send_failed'), 'error')
  } finally {
    isLoading.value = false
  }
}

const submit = async (code: string) => {
  const enterprise = enterpriseStore.enterprise
  if (enterprise == null || email == null) {
    return
  }

  isValidating.value = true
  try {
    const result = await confirmEnterpriseEmailLogin({
      enterprise_id: enterprise.enterprise_id,
      email,
      pass_code: code,
    })
    if (enterprise.tenant_id != null && enterprise.tenant_id !== '') {
      setEnterpriseAuthTenantId(enterprise.tenant_id)
    }
    await signInWithCustomToken(getAuth(), result.data.token)
    const redirectPath = getRedirectPath() ?? getHomePath()
    await router.push(redirectPath)
  } catch (error) {
    console.warn('Error confirming pass code:', error)
    passCode.value = ''
    isOpenUnMatchPassCodeDialog.value = true
  } finally {
    isValidating.value = false
  }
}
</script>

<template>
  <LoginBackgroundLayout>
    <LoginBrandingHeader :title="t('enterprise.pass_code.title')">
      <div class="pass-code-intro text-center">
        <p class="text-body-1 text-medium-emphasis mb-2">{{ t('enterprise.pass_code.description') }}</p>
        <p class="text-body-1 font-weight-medium text-high-emphasis text-break mb-0">{{ email }}</p>
      </div>

      <div class="pass-code-otp my-8">
        <v-otp-input v-model="passCode" autofocus :disabled="isValidating" :loading="isValidating" />
      </div>

      <div class="pass-code-actions d-flex flex-column ga-1">
        <v-btn
          size="default"
          color="primary"
          variant="text"
          block
          :disabled="isValidating"
          :loading="isLoading"
          @click="reSendPassCode"
        >
          {{ t('enterprise.pass_code.resend') }}
        </v-btn>
        <v-btn
          size="default"
          color="grey-900"
          variant="text"
          block
          :disabled="isValidating"
          @click="router.push(getLogin())"
        >
          {{ t('passcode.back') }}
        </v-btn>
      </div>
    </LoginBrandingHeader>
  </LoginBackgroundLayout>

  <confirm-dialog v-model="isOpenUnMatchPassCodeDialog" :is-confirm="false">
    <v-card-text class="text-center py-10 text-h5">
      {{ t('enterprise.pass_code.invalid') }}
    </v-card-text>
  </confirm-dialog>
</template>

<style scoped lang="scss">
.pass-code-intro {
  max-width: 22rem;
  margin-inline: auto;
}

.pass-code-otp :deep(.v-otp-input__content) {
  gap: 0.5rem;
}

.pass-code-otp :deep(.v-field) {
  --v-field-border-opacity: 0.38;
}
</style>

<route lang="yaml">
meta:
  layout: blank
</route>
