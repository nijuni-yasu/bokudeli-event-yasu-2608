<script setup lang="ts">
const props = defineProps<{ content: string; style?: string }>()

const isRichText = computed(() => {
  return props.content.includes('<p>')
})

const iframeContent = computed(() => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          ${props.style ?? ''}
        </style>
      </head>
      <body>
        ${props.content}
      </body>
    </html>
  `
})
const iframeRef = ref<HTMLIFrameElement | null>(null)
// iframeの高さを調整する関数
const adjustIframeHeight = (): void => {
  const iframe = iframeRef.value
  if (iframe && iframe.contentDocument && iframe.contentDocument.body) {
    const doc = iframe.contentDocument
    const bodyHeight = doc.body.scrollHeight
    const htmlHeight = doc.documentElement.scrollHeight

    // body と html の高さの大きい方を使用
    const finalHeight = Math.max(bodyHeight, htmlHeight)

    iframe.style.height = `${finalHeight}px`
  }
}

onMounted(() => {
  adjustIframeHeight()
})
</script>
<template>
  <iframe v-if=isRichText :srcdoc="iframeContent" ref="iframeRef" @load="adjustIframeHeight" />
  <slot v-else name="planeText"><p>{{ props.content }}</p></slot>
</template>
<style lang="scss" scoped>
iframe {
  width: 100%;
  border: none;
  overflow: hidden;
  padding: 0;
  margin: 0;
}
</style>
