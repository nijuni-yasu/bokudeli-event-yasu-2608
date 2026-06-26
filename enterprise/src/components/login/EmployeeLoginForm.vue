<script setup lang="ts">
import { useValidators } from '@shokujii/base/composable/validators.js'
import { useNotification } from '@shokujii/base/composable/notification'
import { requestEnterpriseEmailLogin } from '@/apis/enterprise'
import { useEnterpriseStore } from '@/stores/enterprise'
import { getPassCode } from '@/router/utils'

const router = useRouter()
const notification = useNotification()
const { t } = useI18n()
const { requiredValidator, emailValidator } = useValidators()
const enterpriseStore = useEnterpriseStore()

const isLoading = ref(false)
const isValid = ref(false)
const email = ref('')
const domainError = ref(false)

function emailDomainAllowed(value: string, allowedDomains: string[]): boolean {
  const at = value.lastIndexOf('@')
  if (at < 0) {
    return false
  }
  const domain = value
    .slice(at + 1)
    .trim()
    .toLowerCase()
  return allowedDomains.some((allowed) => allowed.toLowerCase() === domain)
}

const domainValidator = (value: string) => {
  const enterprise = enterpriseStore.enterprise
  if (enterprise == null) {
    return true
  }
  if (!emailDomainAllowed(value, enterprise.allowed_email_domains)) {
    domainError.value = true
    return t('enterprise.login.domain_error')
  }
  domainError.value = false
  return true
}

function mapRequestError(error: unknown): string {
  const code =
    typeof error === 'object' &&
    error != null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code
      : undefined
  const message =
    typeof error === 'object' &&
    error != null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
      ? (error as { message: string }).message
      : ''

  if (code === 'functions/not-found') {
    return t('enterprise.login.not_registered')
  }
  if (code === 'functions/permission-denied') {
    if (message.includes('email domain')) {
      return t('enterprise.login.domain_error')
    }
    return t('enterprise.login.disabled')
  }
  return t('enterprise.login.send_failed')
}

const submit = async () => {
  const enterprise = enterpriseStore.enterprise
  if (enterprise == null) {
    return
  }

  isLoading.value = true
  try {
    await requestEnterpriseEmailLogin({
      enterprise_id: enterprise.enterprise_id,
      email: email.value.trim(),
    })
    await router.push(getPassCode(email.value.trim()))
  } catch (error) {
    console.error(error)
    notification.show(mapRequestError(error), 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <v-form v-model="isValid" @submit.prevent="submit">
    <v-container class="mb-4 pa-0">
      <label class="field-label" style="font-size: 12px; font-weight: bold">{{
        t('enterprise.login.email_label')
      }}</label>
      <v-text-field
        v-model="email"
        :placeholder="t('enterprise.login.email_placeholder')"
        :rules="[requiredValidator, emailValidator, domainValidator]"
        autocomplete="email"
      />
    </v-container>

    <v-btn size="large" color="primary" block :loading="isLoading" :disabled="!isValid || isLoading" type="submit">
      {{ t('enterprise.login.submit') }}
    </v-btn>
  </v-form>
</template>
