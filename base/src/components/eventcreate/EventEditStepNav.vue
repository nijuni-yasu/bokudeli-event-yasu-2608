<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * イベント編集ステッパー用: ビューポート下部に固定し、スクロールしてもナビが見える。
 * body へ Teleport し、v-stepper / VWindow の transform 祖先による position:fixed の包含ブロックずれを防ぐ。
 * VWindow は非アクティブ項目をマウントしたままにすることがあるため、visible で body 側の描画を切る。
 */
const props = defineProps<{
  visible: boolean
  /** 省略時は i18n の event_edit.step_nav_aria_label */
  navigationAriaLabel?: string
}>()

const { t } = useI18n()
const navAriaLabel = computed(() => props.navigationAriaLabel ?? t('event_edit.step_nav_aria_label'))
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="event-edit-step-nav" role="navigation" :aria-label="navAriaLabel">
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
