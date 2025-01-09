<script setup lang="ts">
const route = useRoute()
const router = useRouter()
router.replace(`/manage/event/${route.params.eventId}/overview`)
</script>

<template>{{}}</template>
