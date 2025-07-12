<script setup lang="ts">
import { getUserPath } from '@/router/utils'
import { useStoreStoredUser } from '@/stores/storedUser'

const router = useRouter()

const storedUser = useStoreStoredUser().storedUser
if (storedUser) {
  router.replace(getUserPath(storedUser.userAccount || storedUser.userId))
} else {
  router.replace('/')
}
</script>

<template>
  <div></div>
</template>
<style lang="scss" scoped></style>
