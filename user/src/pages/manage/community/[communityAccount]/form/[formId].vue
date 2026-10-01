<script setup lang="ts">
import CommunityFormEditor from '@shokujii/base/components/manage/community/CommunityFormEditor.vue'

const formId = useRoute().params.formId as string
</script>

<template>
  <CommunityFormEditor :form-id="formId" />
</template>

<route lang="yaml">
meta:
  layout: manage
</route>
