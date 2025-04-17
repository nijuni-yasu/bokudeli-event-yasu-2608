<script setup lang="ts">
// ネストされたディレクトリだと layout: blank 指定が効かないので、ルートディレクトリに配置。
// TODO 要調査: ネストされたディレクトリで layout: blank が効かない理由
//
// ここで window.location.href により PDF を表示する予定だったが、
// このページを離れると Blob が garbage collection の対象になるため、PDF のダウンロードが出来ない。
// https://stackoverflow.com/a/44780122
// そのため、このページではローディング画面のみを表示する。
</script>

<template>
  <div class="loading">
    <v-progress-circular indeterminate color="primary" />
  </div>
</template>

<route lang="yaml">
meta:
  layout: blank
</route>
