<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { injectionKeyEventEditHostActive } from './symbols'

/**
 * イベント編集ステッパー用: ビューポート下部に固定し、スクロールしてもナビが見える。
 * body へ Teleport し、v-stepper / VWindow の transform 祖先による position:fixed の包含ブロックずれを防ぐ。
 *
 * 表示条件は visible（ステップ番号で個別制御）と hostActive（タブ等のホスト画面が表示中か）の AND。
 * VWindow は非アクティブ項目を v-show でマウントし続けるため、ホスト側からも非表示状態を inject で受け取り、
 * Teleport 先の body 上にステップナビが残らないようにする。hostActive は未提供時 true（単独画面用）。
 */
const props = defineProps<{
  visible: boolean
  /** 省略時は i18n の event_edit.step_nav_aria_label */
  navigationAriaLabel?: string
}>()

const { t } = useI18n()
const navAriaLabel = computed(() => props.navigationAriaLabel ?? t('event_edit.step_nav_aria_label'))

const hostActive = inject(injectionKeyEventEditHostActive, ref(true))
const isShown = computed(() => props.visible && hostActive.value)
</script>

<template>
  <Teleport to="body">
    <div v-if="isShown" class="event-edit-step-nav" role="navigation" :aria-label="navAriaLabel">
      <div class="event-edit-step-nav__surface">
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.event-edit-step-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1008;
  pointer-events: none;
}

.event-edit-step-nav__surface {
  pointer-events: auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 10px 12px;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px));
  background: rgb(var(--v-theme-surface));
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.06);
}
</style>
