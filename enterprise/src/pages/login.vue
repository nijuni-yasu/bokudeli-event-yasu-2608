<script setup lang="ts">
import { onMounted } from 'vue'
import { useNotification } from '@shokujii/base/composable/notification'
import { SESSION_TIMEOUT_FLAG_KEY } from '@/constants/sessionTimeout'
import EmployeeLoginForm from '@/components/login/EmployeeLoginForm.vue'
import LoginBrandingHeader from '@/components/login/LoginBrandingHeader.vue'
import LoginBackgroundLayout from '@/components/login/LoginBackgroundLayout.vue'

const notification = useNotification()
const { t } = useI18n()

onMounted(() => {
  if (sessionStorage.getItem(SESSION_TIMEOUT_FLAG_KEY) === '1') {
    sessionStorage.removeItem(SESSION_TIMEOUT_FLAG_KEY)
    notification.show(t('enterprise.session.timeout'), 'warning')
  }
})
</script>

<template>
  <LoginBackgroundLayout>
    <LoginBrandingHeader :title="t('enterprise.login.title')">
      <EmployeeLoginForm />
    </LoginBrandingHeader>
  </LoginBackgroundLayout>
</template>

<route lang="yaml">
meta:
  layout: blank
</route>
