<script setup lang="ts">
import Invoice from '@/components/Invoice.vue'

const route = useRoute()

// ネストされたディレクトリだと layout: blank 指定が効かないので、ルートディレクトリに配置し、
// query で eventId と orderId を受け取る
// TODO 要調査: ネストされたディレクトリで layout: blank が効かない理由
const eventId = route.query.eventId as string
const orderId = route.query.orderId as string

const onGenerated = (pdf: Blob) => {
  // https://stackoverflow.com/questions/74128322/using-window-open-in-an-async-function-in-firefox-and-safari
  // この問題で window.open が使えないので、代わりに window.location.href を使う
  window.location.href = window.URL.createObjectURL(pdf)
}

const onError = (err: Error) => {
  console.error(err)
  window.close()
}
</script>

<template>
  <Invoice :eventId="eventId" :orderId="orderId" @generated="onGenerated" @error="onError" />
</template>

<route lang="yaml">
meta:
  layout: blank
</route>
