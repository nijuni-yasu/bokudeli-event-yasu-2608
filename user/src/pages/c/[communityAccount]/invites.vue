<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import Invites from '@shokujii/base/components/pages/c/[communityAccount]/invites.vue'
import { usePublicCommunityNotFoundRedirect } from '@shokujii/base/composable/usePublicCommunityNotFoundRedirect.js'
import { getManageCommunityPath } from '@/router/utils'

const communityAccount = useRoute().params.communityAccount as string
const token = useRoute().query.t as string
const router = useRouter()

usePublicCommunityNotFoundRedirect(communityAccount)

const done = () => {
  router.push(getManageCommunityPath(communityAccount))
}
</script>

<template>
  <Invites :communityAccount="communityAccount" :token="token" @done="done" />
</template>
