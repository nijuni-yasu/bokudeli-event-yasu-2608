<script setup lang="ts">
import { useRoute } from 'vue-router'
import Invites from '@shokujii/base/components/pages/c/[communityId]/invites.vue'

// communityId は間違いで、渡されるのは communityAccount
const communityAccount = useRoute().params.communityId as string
</script>

<template>
  <Invites :communityAccount="communityAccount" />
</template>
