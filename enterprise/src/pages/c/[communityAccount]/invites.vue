<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import Invites from '@shokujii/base/components/pages/c/[communityAccount]/invites.vue'
import { getManageCommunityPath } from '@/router/utils'
import { acceptInvitationForEnterpriseCommunityManager } from '@/apis/enterprise'

const communityAccount = useRoute().params.communityAccount as string
const token = useRoute().query.t as string
const router = useRouter()

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
