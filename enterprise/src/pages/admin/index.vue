<script setup lang="ts">
import { getAdminSettingsPath } from '@/router/utils'

const router = useRouter()
router.replace(getAdminSettingsPath())
</script>

<template>
  <div />
</template>

<route lang="yaml">
redirect: /admin/settings
meta:
  layout: admin
</route>
