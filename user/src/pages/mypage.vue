<script setup lang="ts">
import { useStoreStoredUser } from '@/stores/storedUser'

const router = useRouter()

const storedUser = useStoreStoredUser().storedUser
if (storedUser) {
  router.replace(`/users/${storedUser?.userId}`)
} else {
  router.replace('/')
}
</script>

<template>
  <div></div>
</template>
<style lang="scss" scoped></style>
