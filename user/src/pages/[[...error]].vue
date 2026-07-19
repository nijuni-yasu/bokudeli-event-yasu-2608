<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import Error from '@shokujii/base/components/Error.vue'

const route = useRoute()
const error = route.params.error as string
const errorCode = /^\d{3}$/.test(error) ? error : '404'

let robotsMetaEl: HTMLMetaElement | null = null

onMounted(() => {
  robotsMetaEl = document.createElement('meta')
  robotsMetaEl.name = 'robots'
  robotsMetaEl.content = 'noindex'
  document.head.appendChild(robotsMetaEl)
})

onUnmounted(() => {
  robotsMetaEl?.remove()
  robotsMetaEl = null
})
</script>

<template>
  <Error :code="errorCode" />
</template>

<route lang="yaml">
meta:
  layout: blank
</route>
