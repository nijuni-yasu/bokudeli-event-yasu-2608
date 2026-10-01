<script setup lang="ts">
import CartFormAnswer from '@shokujii/base/components/forms/CartFormAnswer.vue'
import { getCartPath, getOrdersPathAfterOrder } from '@/router/utils'

const eventId = useRoute().params.eventId as string
</script>

<template>
  <CartFormAnswer :event-id="eventId" :resolve-orders-path="getOrdersPathAfterOrder" :resolve-cart-path="getCartPath" />
</template>
