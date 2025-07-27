<script setup lang="ts">
import { useRoute } from 'vue-router'
import Invites from '@shokujii/base/components/pages/c/[communityId]/invites.vue'

const communityId = useRoute().params.communityId as string
</script>

<template>
  <Invites :community-id="communityId" />
</template>
