<script setup lang="ts">
import { useRoute } from 'vue-router'
import Error from '@/components/Error.vue'

const route = useRoute()
const error = route.params.error as string
const errorCode = /^\d{3}$/.test(error) ? error : '404'
</script>

<template>
  <Error :code="errorCode" />
</template>

<route lang="yaml">
meta:
  layout: blank
</route>
