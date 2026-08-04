<script setup lang="ts">
import Cart from '@shokujii/base/components/pages/cart.vue'
import { enterpriseCartSubsidyBudgetLoader } from '@/composable/enterpriseCartSubsidyBudget.js'
import { getOrdersPathAfterOrder } from '@/router/utils'
</script>

<template>
  <Cart
    :enterprise-subsidy-budget-loader="enterpriseCartSubsidyBudgetLoader"
    :resolve-orders-path="getOrdersPathAfterOrder"
  />
</template>
