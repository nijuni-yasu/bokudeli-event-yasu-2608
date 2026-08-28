<script setup lang="ts">
import TagImportHintDialog from '@shokujii/base/components/TagImportHintDialog.vue'
import { useProfileTagToggle } from '@shokujii/base/composable/useTagImportHint.js'

const { showDialog, confirmHint } = useProfileTagToggle()
</script>

<template>
  <TagImportHintDialog v-model="showDialog" @confirm="confirmHint" />
</template>
