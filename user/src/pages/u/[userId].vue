<script setup lang="ts">
import { useRoute } from 'vue-router'
import UserProfilePage from './UserProfilePage.vue'

const route = useRoute()
</script>

<template>
  <UserProfilePage :key="String(route.params.userId)" />
</template>
