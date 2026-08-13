<script setup lang="ts">
import Cart from '@shokujii/base/components/pages/cart.vue'
import { getOrdersPathAfterOrder } from '@/router/utils'
</script>

<template>
  <Cart :resolve-orders-path="getOrdersPathAfterOrder" />
</template>
