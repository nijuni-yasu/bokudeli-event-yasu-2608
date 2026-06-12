<script setup lang="ts">
const route = useRoute()
const router = useRouter()
router.replace(`/manage/community/${route.params.communityAccount}/events`)
</script>

<template>{{}}</template>
