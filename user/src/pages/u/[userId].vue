<script setup lang="ts">
import { useRoute } from 'vue-router'
import UserProfilePage from '@/components/profile/UserProfilePage.vue'

const route = useRoute()
const userId = computed(() => String(route.params.userId ?? ''))
</script>

<template>
  <UserProfilePage :key="userId" :user-id="userId" />
</template>
