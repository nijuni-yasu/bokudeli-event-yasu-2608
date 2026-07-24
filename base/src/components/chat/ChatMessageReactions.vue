<script setup lang="ts">
import { mdiDotsVertical, mdiDownload, mdiEmoticonHappyOutline } from '@mdi/js'
import { CHAT_REACTION_EMOJIS, type ChatReactionEmoji } from '@shokujii/common/schemas/ChatReaction.js'
import { buildReactionSummaryAriaLabel, formatReactionSummaryText } from '@shokujii/common/utils/chatReactionSummary.js'
import { toggleReactionWithOptimistic } from '@shokujii/base/stores/chatReaction.js'
import { useNotification } from '@shokujii/base/composable/notification.js'
import type { ChatMessageItem } from './types.js'

const props = defineProps<{
  mode: 'side' | 'reaction-row'
  message: ChatMessageItem
  roomId: string
  currentUserId: string
  isOwnMessage: boolean
  canReact: boolean
  timeLabel?: string
  showReactionPicker?: boolean
  showRecall?: boolean
  showDownload?: boolean
  isDownloading?: boolean
  isDownloadBlocked?: boolean
}>()

const emit = defineEmits<{
  recall: []
  download: []
  openDetail: []
}>()

const { t } = useI18n()
const notification = useNotification()
const isToggling = ref(false)
const reactionMenuOpen = ref(false)
const recallMenuOpen = ref(false)

const actionMenuProps = {
  location: 'top center' as const,
  origin: 'bottom center' as const,
  offset: 8,
  contentClass: 'chat-message-action-menu',
}

watch(reactionMenuOpen, (open) => {
  if (open) {
    recallMenuOpen.value = false
  }
})

watch(recallMenuOpen, (open) => {
  if (open) {
    reactionMenuOpen.value = false
  }
})

const onRecallClick = (): void => {
  recallMenuOpen.value = false
  emit('recall')
}

const hasReactionSummary = computed(() => formatReactionSummaryText(props.message.reactionSummary) !== '')

const reactionSummaryText = computed(() => formatReactionSummaryText(props.message.reactionSummary))

const reactionSummaryAriaLabel = computed(() => {
  const label = buildReactionSummaryAriaLabel(props.message.reactionSummary, (emoji, count) =>
    t('chat.reaction_count', { emoji, count }),
  )
  if (label === '') {
    return ''
  }
  return t('chat.reaction_summary_label', { label })
})

const showSideActions = computed(() => props.showRecall === true || props.showDownload === true)

const showReactionRow = computed(
  () => (props.showReactionPicker === true && props.canReact) || hasReactionSummary.value,
)

const onReactionSelect = async (emoji: ChatReactionEmoji): Promise<void> => {
  if (!props.canReact || isToggling.value) {
    return
  }
  reactionMenuOpen.value = false
  recallMenuOpen.value = false
  isToggling.value = true
  try {
    await toggleReactionWithOptimistic(
      props.roomId,
      props.message.id,
      props.currentUserId,
      emoji,
      props.message.reactionSummary,
    )
  } catch {
    notification.show(t('chat.reaction_failed'), 'error')
  } finally {
    isToggling.value = false
  }
}

const onSummaryClick = (): void => {
  emit('openDetail')
}
</script>

<template>
  <div
    v-if="mode === 'side' && timeLabel != null"
    class="chat-message-side-meta flex-shrink-0"
    :class="showSideActions ? 'chat-message-side-meta--with-actions' : ''"
  >
    <div v-if="showSideActions" class="chat-message-side-meta__actions d-flex align-center">
      <VMenu v-if="showRecall === true" v-model="recallMenuOpen" v-bind="actionMenuProps">
        <template #activator="{ props: menuProps, isActive }">
          <VBtn
            v-bind="menuProps"
            icon
            variant="text"
            size="x-small"
            color="default"
            class="chat-message-action-btn flex-shrink-0"
            :class="{ 'chat-message-action-btn--active': isActive }"
            :aria-label="t('chat.recall_message')"
            @click.stop
          >
            <VIcon :icon="mdiDotsVertical" size="18" />
          </VBtn>
        </template>
        <div class="chat-message-action-menu-panel">
          <VList density="compact" class="py-1">
            <VListItem :title="t('chat.recall_message')" @click="onRecallClick" />
          </VList>
        </div>
      </VMenu>

      <VBtn
        v-if="showDownload === true"
        icon
        variant="text"
        size="x-small"
        color="default"
        class="chat-message-action-btn flex-shrink-0"
        :loading="isDownloading === true"
        :disabled="isDownloadBlocked === true"
        :aria-label="t('chat.download_all_attachments')"
        @click.stop="emit('download')"
      >
        <VIcon :icon="mdiDownload" size="18" />
      </VBtn>
    </div>
    <span class="chat-message-side-meta__time text-xs text-disabled">{{ timeLabel }}</span>
  </div>

  <div
    v-else-if="mode === 'reaction-row' && showReactionRow"
    class="chat-message-reaction-row d-flex align-center flex-wrap ga-1"
    :class="isOwnMessage ? 'justify-end' : 'justify-start'"
  >
    <VMenu
      v-if="showReactionPicker === true && canReact"
      v-model="reactionMenuOpen"
      v-bind="actionMenuProps"
    >
      <template #activator="{ props: menuProps, isActive }">
        <VBtn
          v-bind="menuProps"
          icon
          variant="text"
          size="x-small"
          color="default"
          class="chat-message-action-btn chat-message-reaction-picker-btn flex-shrink-0"
          :class="{ 'chat-message-action-btn--active': isActive }"
          :aria-label="t('chat.reaction_picker')"
          :disabled="isToggling"
          @click.stop
        >
          <VIcon :icon="mdiEmoticonHappyOutline" size="18" />
        </VBtn>
      </template>
      <div class="chat-message-action-menu-panel chat-message-action-menu-panel--emoji d-flex align-center">
        <VBtn
          v-for="emoji in CHAT_REACTION_EMOJIS"
          :key="emoji"
          variant="text"
          size="x-small"
          class="chat-reaction-picker-btn"
          :aria-label="t('chat.reaction_picker')"
          @click.stop="onReactionSelect(emoji)"
        >
          {{ emoji }}
        </VBtn>
      </div>
    </VMenu>

    <VBtn
      v-if="hasReactionSummary"
      variant="flat"
      color="default"
      size="x-small"
      class="chat-reaction-chip chat-reaction-chip--combined"
      :aria-label="reactionSummaryAriaLabel"
      @click.stop="onSummaryClick"
    >
      {{ reactionSummaryText }}
    </VBtn>
  </div>
</template>

<style scoped lang="scss">
.chat-message-side-meta {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-inline-size: 36px;
  min-block-size: 28px;
}

.chat-message-side-meta--with-actions {
  min-inline-size: 56px;
}

.chat-message-side-meta__time {
  line-height: 1.2;
  white-space: nowrap;
  transition: opacity 0.15s ease;
}

.chat-message-side-meta__actions {
  display: flex;
  align-items: center;
  gap: 0;
}

.chat-message-action-btn {
  border-radius: 50%;
  inline-size: 28px;
  block-size: 28px;

  &:hover {
    background: rgba(var(--v-theme-on-surface), 0.08);
  }
}

.chat-message-action-btn--active {
  background: rgba(var(--v-theme-on-surface), 0.12);
}

.chat-message-action-menu-panel {
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.chat-message-action-menu-panel--emoji {
  border-radius: 999px;
  padding: 2px 4px;
  gap: 0;
}

.chat-reaction-picker-btn {
  min-inline-size: 28px;
  block-size: 28px;
  padding: 0;
  font-size: 1.125rem;
  border-radius: 50%;
}

.chat-reaction-chip {
  border-radius: 999px;
  text-transform: none;
  letter-spacing: normal;
}

.chat-reaction-chip--combined.v-btn {
  --v-btn-background: #fff;
  background: #fff;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  font-size: 1rem;
  line-height: 1.2;
  min-block-size: 28px;
  padding-inline: 10px;
}
</style>

<style lang="scss">
.chat-message-action-menu {
  border-radius: 16px;
  overflow: visible;
}
</style>
