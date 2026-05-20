<script setup lang="ts">
defineOptions({ inheritAttrs: false })

import { ref, watch } from 'vue'
import { convertStoragePathToURL } from '@shokujii/base/utils/storage.js'
import { getEventMenuImageStoragePath, getMenuImageStoragePath } from '@shokujii/common/utils/storagePaths.js'
import type { BokudeliEvent } from '@shokujii/base/stores/event.js'
import type { BokudeliEventMenu } from '@shokujii/base/stores/event.js'

const props = defineProps<{
  event: BokudeliEvent
  menu: BokudeliEventMenu
  alt?: string
  cover?: boolean
  aspectRatio?: number | string
}>()

/**
 * EventMenu 画像の表示 URL。404 時に PartnerMenu パスへフォールバックする。
 * 既存の in_draft / applying_reservation イベントには EventMenu 画像が無いため暫定実装。
 * 撤去判断: documents/07_リファクタリング/16_EventMenu画像不具合.md 7.6
 */
const buildEventMenuImageUrl = () =>
  convertStoragePathToURL(
    getEventMenuImageStoragePath(props.event.community_id, props.event.event_id, props.menu.menu_id),
  )

const src = ref(buildEventMenuImageUrl())

watch(
  () =>
    [
      props.event.event_id,
      props.event.community_id,
      props.event.partner_id,
      props.event.event_status.value,
      props.event.calculatedEventStatus,
      props.menu.menu_id,
    ] as const,
  () => {
    src.value = buildEventMenuImageUrl()
  },
)

const onError = () => {
  if (props.event.partner_id === '') {
    return
  }
  const fallback = convertStoragePathToURL(getMenuImageStoragePath(props.event.partner_id, props.menu.menu_id))
  if (src.value !== fallback) {
    src.value = fallback
  }
}
</script>

<template>
  <v-img v-bind="$attrs" :src="src" :alt="alt" :cover="cover" :aspect-ratio="aspectRatio" @error="onError" />
</template>
