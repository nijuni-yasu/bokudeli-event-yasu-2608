<script setup lang="ts">
const props = defineProps<{ content: string; style?: string }>()
</script>
<template>
  <div v-html="props.content" :class="$style['tiny-mce-viewer']" />
</template>
<style module>
.tiny-mce-viewer {
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 16px;
    margin-bottom: 8px;
    padding: 0;
    font-size: calc(15px * 1.3);
    line-height: calc(15px * 1.3 * 1.5);
    color: #2e263db3;
  }

  p {
    margin: 8px 0px 8px;
    padding: 0;
    line-height: 1.8;
    font-size: 15px;
    font-weight: 400;
  }
  ul,
  ol {
    margin: 8px 24px 8px;
    padding: 0;
    line-height: 1.8;
    font-size: 15px;
    font-weight: 400;
  }

  a {
    color: #1ac662;
    text-decoration: none;
  }

  table {
    border-collapse: collapse;
  }
  table,
  th,
  td {
    border: 1px solid #ccc;
    padding: 5px;
  }
  td p,
  th p {
    padding: 0;
    margin: 0;
  }
  img {
    max-width: 100%;
    height: auto;
  }
}
</style>
