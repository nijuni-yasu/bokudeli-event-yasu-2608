<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import Error from '@shokujii/base/components/Error.vue'
import { parseErrorCodeFromRoute } from '@/router/documentTitleHelpers.js'

const route = useRoute()
const errorCode = computed(() => parseErrorCodeFromRoute(route.path, route.params.error) ?? '404')

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
