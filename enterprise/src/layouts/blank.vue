<script setup lang="ts">
import type { Notification } from '@shokujii/base/types/index.js'

const notification = reactive<Notification>({
  message: undefined,
  color: undefined,
})
provide('notification', notification)

const isNotificationShown = computed({
  get: () => notification.message !== undefined,
  set: (value: boolean) => {
    if (!value) {
      notification.message = undefined
      notification.color = undefined
    }
  },
})
</script>

<template>
  <div class="layout-wrapper layout-blank">
    <RouterView #="{ Component }">
      <Suspense :timeout="0">
        <Component :is="Component" />
      </Suspense>
    </RouterView>
  </div>
  <v-snackbar v-model="isNotificationShown" :color="notification.color" location="top">
    {{ notification.message }}
  </v-snackbar>
</template>
