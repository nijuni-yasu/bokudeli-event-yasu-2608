<script setup lang="ts">
const props = defineProps<{ content: string; style?: string }>()
</script>
<template>
  <div v-html="props.content" :class="$style['tiny-mce-viewer']" />
</template>
<style module>
.tiny-mce-viewer {
  h3 {
    margin-top: 16px;
    margin-bottom: 8px;
    padding: 0;
    font-size: calc(16px * 1.17);
    line-height: calc(16px * 1.17 * 1.5);
    color: #2e263db3;
  }

  p,
  ul,
  ol {
    margin: 8px 0px 8px;
    padding: 0;
    line-height: 2;
    font-size: 16px;
    font-weight: 400;
  }

  a {
    color: #1ac662;
    text-decoration: none;
  }

  table {
    margin: 0;
    padding: 0;
    border: 1px solid #ccc;
    border-collapse: collapse;
  }

  td {
    padding: 8px;
  }
}
</style>
