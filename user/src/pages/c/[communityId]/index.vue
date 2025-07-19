<script setup lang="ts">
import { useRoute } from 'vue-router'
import CommunityDetails from '@shokujii/base/components/pages/c/[communityId]/index.vue'

const communityId = useRoute().params.communityId as string
</script>

<template>
  <CommunityDetails :community-id="communityId" />
</template>
