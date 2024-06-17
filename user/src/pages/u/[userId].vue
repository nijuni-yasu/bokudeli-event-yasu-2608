<script setup lang="ts">
import { useRoute } from 'vue-router'
import UserDetails from '@/components/pages/u/[userId].vue'

const userId = useRoute().params.userId as string
</script>

<template>
  <UserDetails :user-id="userId" />
</template>
