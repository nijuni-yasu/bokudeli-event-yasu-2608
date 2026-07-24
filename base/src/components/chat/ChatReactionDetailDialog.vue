<script setup lang="ts">
import { mdiClose } from '@mdi/js'
import type { ChatReaction } from '@shokujii/common/schemas/ChatReaction.js'
import { User } from '@shokujii/common/schemas/User.js'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import { listChatReactions } from '@shokujii/base/stores/chatReaction.js'
import { getUserById } from '@shokujii/base/stores/user.js'

const props = defineProps<{
  modelValue: boolean
  roomId: string | null
  messageId: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

type ReactionDetailRow = {
  userId: string
  emoji: ChatReaction['emoji']
  user: User | null
}

const isLoading = ref(false)
const loadFailed = ref(false)
const rows = ref<ReactionDetailRow[]>([])
let loadSeq = 0

const reactionCount = computed(() => rows.value.length)

const dialogTitle = computed(() => {
  if (isLoading.value) {
    return t('chat.reaction_detail_title_plain')
  }
  return t('chat.reaction_detail_title', { count: reactionCount.value })
})

const fetchUser = async (userId: string): Promise<User | null> => {
  try {
    return (await getUserById(userId)) ?? null
  } catch {
    return null
  }
}

const loadReactionDetails = async (): Promise<void> => {
  if (props.roomId == null || props.messageId == null) {
    rows.value = []
    return
  }

  const seq = ++loadSeq
  isLoading.value = true
  loadFailed.value = false
  rows.value = []

  try {
    const reactions = await listChatReactions(props.roomId, props.messageId)
    if (seq !== loadSeq) {
      return
    }
    const sorted = [...reactions].sort((a, b) => a.created_at - b.created_at)
    const users = await Promise.all(sorted.map((reaction) => fetchUser(reaction.id)))
    if (seq !== loadSeq) {
      return
    }
    rows.value = sorted.map((reaction, index) => ({
      userId: reaction.id,
      emoji: reaction.emoji,
      user: users[index] ?? null,
    }))
  } catch {
    if (seq !== loadSeq) {
      return
    }
    loadFailed.value = true
    rows.value = []
  } finally {
    if (seq === loadSeq) {
      isLoading.value = false
    }
  }
}

watch(
  () => [isOpen.value, props.roomId, props.messageId] as const,
  ([open]) => {
    if (open) {
      void loadReactionDetails()
    }
  },
)

const resolveDisplayName = (row: ReactionDetailRow): string => {
  return row.user?.user_name ?? row.userId.slice(0, 8)
}
</script>

<template>
  <VDialog v-model="isOpen" max-width="400">
    <VCard class="chat-reaction-detail-card">
      <VCardTitle class="d-flex align-center justify-space-between py-3 px-4">
        <span class="text-body-1 font-weight-medium">{{ dialogTitle }}</span>
        <VBtn
          icon
          variant="text"
          size="small"
          color="default"
          :aria-label="t('chat.reaction_detail_close')"
          @click="isOpen = false"
        >
          <VIcon :icon="mdiClose" size="20" />
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-0">
        <div v-if="isLoading" class="d-flex flex-column align-center justify-center py-8 ga-3">
          <VProgressCircular indeterminate size="28" width="2" />
          <span class="text-medium-emphasis text-body-2">{{ t('chat.reaction_detail_loading') }}</span>
        </div>
        <div v-else-if="loadFailed" class="text-center text-medium-emphasis py-8 px-4">
          {{ t('chat.reaction_detail_failed') }}
        </div>
        <VList v-else density="comfortable" class="py-2">
          <VListItem v-for="row in rows" :key="row.userId" class="chat-reaction-detail-row px-4">
            <template #prepend>
              <UserAvatar :user="row.user" :size="36" class="me-3" />
            </template>
            <VListItemTitle class="text-body-2">{{ resolveDisplayName(row) }}</VListItemTitle>
            <template #append>
              <span class="chat-reaction-detail-emoji text-body-1">{{ row.emoji }}</span>
            </template>
          </VListItem>
        </VList>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped lang="scss">
.chat-reaction-detail-card {
  border-radius: 16px;
}

.chat-reaction-detail-row {
  min-block-size: 52px;
}

.chat-reaction-detail-emoji {
  line-height: 1;
}
</style>
