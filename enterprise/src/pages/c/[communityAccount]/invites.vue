<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import Invites from '@shokujii/base/components/pages/c/[communityAccount]/invites.vue'
import { usePublicCommunityNotFoundRedirect } from '@shokujii/base/composable/usePublicCommunityNotFoundRedirect.js'
import { getManageCommunityPath } from '@/router/utils'
import { acceptInvitationForEnterpriseCommunityManager } from '@/apis/enterprise'
import { buildEnterpriseCommunityScope } from '@/composable/useEnterpriseCommunityStore'

const communityAccount = useRoute().params.communityAccount as string
const token = useRoute().query.t as string
const router = useRouter()

usePublicCommunityNotFoundRedirect(communityAccount, buildEnterpriseCommunityScope())

const done = () => {
  router.push(getManageCommunityPath(communityAccount))
}
</script>

<template>
  <Invites
    :community-account="communityAccount"
    :token="token"
    :accept-invitation="acceptInvitationForEnterpriseCommunityManager"
    @done="done"
  />
</template>
