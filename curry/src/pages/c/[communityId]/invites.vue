<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import Invites from '@shokujii/base/components/pages/c/[communityId]/invites.vue'
import { getManageCommunityPath } from '@/router/utils'

// communityId は間違いで、渡されるのは communityAccount
const communityAccount = useRoute().params.communityId as string
const token = useRoute().query.t as string
const router = useRouter()

const done = () => {
  router.push(getManageCommunityPath(communityAccount))
}
</script>

<template>
  <Invites :communityAccount="communityAccount" :token="token" @done="done" />
</template>
