<script setup lang="ts">
import { getAuth, signInWithCustomToken } from 'firebase/auth'
import logo from '@/assets/images/shokujii/shokujii_logo.png'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useNotification } from '@shokujii/base/composable/notification'
import { getRedirectPath } from '@shokujii/base/utils/redirect'
import { confirmEnterpriseEmailLogin, requestEnterpriseEmailLogin } from '@/apis/enterprise'
import { useEnterpriseStore } from '@/stores/enterprise'
import { setEnterpriseAuthTenantId } from '@/utils/enterpriseAuth'
import { getHomePath, getLogin } from '@/router/utils'

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

const logoUrl = computed(() => enterpriseStore.enterprise?.company_logo_url || logo)

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
  <v-container>
    <v-row justify="center" class="mt-16">
      <v-col lg="5" md="6" sm="10" cols="12" class="pa-0">
        <v-sheet class="rounded-lg py-14 px-md-10 px-5">
          <v-container>
            <v-row justify="center">
              <v-img max-width="120" :src="logoUrl" />
            </v-row>
            <v-row justify="center">
              <h1 class="my-3 text-h4 font-weight-bold">{{ t('enterprise.pass_code.title') }}</h1>
            </v-row>
            <v-row justify="center">
              <p class="text-center">{{ t('enterprise.pass_code.description') }}</p>
            </v-row>
            <v-row justify="center">
              <p class="text-body-2 text-medium-emphasis">{{ email }}</p>
            </v-row>
          </v-container>

          <v-otp-input v-model="passCode" autofocus :disabled="isValidating" :loading="isValidating" />

          <v-btn
            size="large"
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
            size="large"
            color="grey-900"
            variant="text"
            block
            :disabled="isValidating"
            @click="router.push(getLogin())"
          >
            {{ t('passcode.back') }}
          </v-btn>
        </v-sheet>
      </v-col>
    </v-row>

    <confirm-dialog v-model="isOpenUnMatchPassCodeDialog" :is-confirm="false">
      <v-card-text class="text-center py-10 text-h5">
        {{ t('enterprise.pass_code.invalid') }}
      </v-card-text>
    </confirm-dialog>
  </v-container>
</template>
