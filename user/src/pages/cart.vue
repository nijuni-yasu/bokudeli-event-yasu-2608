<script setup lang="ts">
import Cart from '@shokujii/base/components/pages/cart.vue'
import { getCartFormPath, getOrdersPathAfterOrder } from '@/router/utils'
</script>

<template>
  <Cart
    :resolve-orders-path="getOrdersPathAfterOrder"
    :resolve-form-answer-path="({ communityAccount, eventId }) => getCartFormPath(communityAccount, eventId)"
  />
</template>
