<script setup lang="ts">
import type { Notification } from '@/types'

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
  <v-snackbar v-model="isNotificationShown" :color="notification.color">
    {{ notification.message }}
  </v-snackbar>
</template>
