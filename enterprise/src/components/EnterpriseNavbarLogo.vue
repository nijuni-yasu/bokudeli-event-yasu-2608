<script setup lang="ts">
import { useEnterpriseBranding } from '@/composable/useEnterpriseBranding'

const { headerLogoSrc, headerLogoAlt } = useEnterpriseBranding()
</script>

<template>
  <img :src="headerLogoSrc" class="logo" :alt="headerLogoAlt" />
</template>
