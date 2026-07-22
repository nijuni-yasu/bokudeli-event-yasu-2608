<script setup lang="ts">
import { getAdminSettingsPath } from '@/router/utils'

const router = useRouter()

onMounted(() => {
  router.replace(getAdminSettingsPath())
})
</script>

<template>
  <div />
</template>

<route lang="yaml">
meta:
  layout: admin
</route>
