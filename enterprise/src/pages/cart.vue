<script setup lang="ts">
import Cart from '@shokujii/base/components/pages/cart.vue'
import { enterpriseCartMonthlyUsageLoader } from '@/composable/enterpriseCartMonthlyUsage.js'
import { getOrdersPathAfterOrder } from '@/router/utils'
</script>

<template>
  <Cart
    :monthly-usage-loader="enterpriseCartMonthlyUsageLoader"
    :resolve-orders-path="getOrdersPathAfterOrder"
  />
</template>
