<script setup lang="ts">
import Cart from '@shokujii/base/components/pages/cart.vue'
import { enterpriseCartMonthlyUsageLoader } from '@/composable/enterpriseCartMonthlyUsage.js'
</script>

<template>
  <Cart :monthly-usage-loader="enterpriseCartMonthlyUsageLoader" />
</template>
