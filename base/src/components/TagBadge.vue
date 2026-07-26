<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    tag: string
    /** 件数（参加者タグ集計など。2 以上のときだけ「｜件数」を表示。未指定はラベルのみ） */
    count?: number
    highlighted?: boolean
    clickable?: boolean
    /** x-small より一段小さくする（イベントページの参加者ブロックなど狭いレイアウト向け） */
    compact?: boolean
  }>(),
  { highlighted: false, clickable: false, compact: false },
)

const emit = defineEmits<{
  click: [tag: string]
}>()

const onClick = () => {
  if (props.clickable) {
    emit('click', props.tag)
  }
}
</script>

<template>
  <v-chip
    :variant="highlighted ? 'tonal' : 'flat'"
    :color="highlighted ? 'primary' : undefined"
    size="x-small"
    :class="[
      'tag-badge',
      highlighted ? 'tag-badge--highlighted' : 'tag-badge--default',
      { 'cursor-pointer': clickable, 'tag-badge--compact': compact, 'ma-1': !compact },
    ]"
    @click="onClick"
  >
    {{ tag }}<template v-if="count != null && count > 1">｜{{ count }}</template>
  </v-chip>
</template>

<style lang="scss" scoped>
.tag-badge--default.v-chip {
  background-color: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.tag-badge--compact.v-chip {
  --v-chip-size: 0.6875rem;
  --v-chip-height: 20px;
  font-size: 0.6875rem;
  line-height: 1.2;
  padding: 0 5px;
  margin: 0 2px 4px 0;
}
</style>
