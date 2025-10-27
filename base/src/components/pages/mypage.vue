<script setup lang="ts">
import { useRouter } from 'vue-router'
import { getUserPath } from '@/router/utils'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser'

const router = useRouter()

const currentUser = useCurrentUserStore().firebaseUser
if (currentUser != null) {
  router.replace(getUserPath(currentUser.uid))
} else {
  router.replace('/')
}
</script>

<template>
  <div></div>
</template>
<style lang="scss" scoped></style>
