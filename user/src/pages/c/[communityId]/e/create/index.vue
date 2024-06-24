<script setup lang="ts">
import { useRoute } from 'vue-router'
import EventCreate from '@/components/pages/c/[communityId]/e/create/index.vue'

const communityId = useRoute().params.communityId as string
</script>

<template>
  <EventCreate :community-id="communityId" />
</template>
