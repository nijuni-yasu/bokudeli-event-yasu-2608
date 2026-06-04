<script setup lang="ts">
import { convertToTimeString } from '@shokujii/common/utils/datetime.js'
import { User } from '@shokujii/common/schemas/User.js'
import { useChatStore } from '@shokujii/base/stores/chat.js'
import { useUserStore } from '@shokujii/base/stores/user.js'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import { CHAT_SYSTEM_EVENT_MEMBER_JOINED } from '@shokujii/common/schemas/ChatMessage.js'
import type { ResolveUserPathFn } from '@shokujii/base/types/profilePathResolvers.js'
import type { ChatMessageItem } from './types.js'

const props = defineProps<{
  currentUserId: string
  resolveProfilePath?: ResolveUserPathFn
}>()

const store = useChatStore()
const { t } = useI18n()

const senderNames = ref<Map<string, string>>(new Map())
const senderUsers = ref<Map<string, User | null>>(new Map())

const resolveSystemMessage = (message: ChatMessageItem): string => {
  if (message.systemEvent === CHAT_SYSTEM_EVENT_MEMBER_JOINED) {
    const userName = message.systemParams?.user_name ?? t('chat.default_user_name')
    return t('chat.system_member_joined', { name: userName })
  }
  return t('chat.system_message')
}

const resolveSenderName = (senderUserId: string): string => {
  if (senderUserId === props.currentUserId) {
    return t('chat.you')
  }
  return senderNames.value.get(senderUserId) ?? senderUserId.slice(0, 8)
}

const resolveSenderUser = (senderUserId: string): User | null => {
  return senderUsers.value.get(senderUserId) ?? null
}

const canLinkToProfile = (senderUserId: string): boolean => {
  if (senderUserId === props.currentUserId || props.resolveProfilePath == null) {
    return false
  }
  const user = resolveSenderUser(senderUserId)
  return user == null || !user.is_deleted
}

const profilePath = (senderUserId: string): string | undefined => {
  if (!canLinkToProfile(senderUserId) || props.resolveProfilePath == null) {
    return undefined
  }
  return props.resolveProfilePath(senderUserId)
}

const profileAriaLabel = (senderUserId: string): string => {
  return t('chat.open_user_profile', { name: resolveSenderName(senderUserId) })
}

watch(
  () => store.messages,
  (messages) => {
    const senderIds = new Set<string>()
    for (const message of messages) {
      if (message.messageType === 'user' && message.senderUserId != null) {
        senderIds.add(message.senderUserId)
      }
    }
    for (const senderId of senderIds) {
      if (senderUsers.value.has(senderId)) continue
      const userStore = useUserStore(senderId)
      watch(
        () => userStore.user,
        (user) => {
          senderUsers.value.set(senderId, user ?? null)
          if (user?.user_name != null) {
            senderNames.value.set(senderId, user.user_name)
          }
        },
        { immediate: true },
      )
    }
  },
  { immediate: true, deep: true },
)
</script>

<template>
  <div class="chat-log pa-5">
    <div v-if="store.isLoadingOlderMessages" class="text-center text-disabled text-sm mb-4">
      {{ t('chat.loading_older') }}
    </div>

    <template v-for="message in store.messages" :key="message.id">
      <div v-if="message.messageType === 'system'" class="text-center text-disabled text-sm my-4">
        {{ resolveSystemMessage(message) }}
      </div>

      <div
        v-else
        class="chat-group d-flex align-start mb-6"
        :class="message.senderUserId === currentUserId ? 'flex-row-reverse' : ''"
      >
        <component
          :is="profilePath(message.senderUserId ?? '') != null ? 'router-link' : 'div'"
          v-bind="
            profilePath(message.senderUserId ?? '') != null
              ? {
                  to: profilePath(message.senderUserId ?? ''),
                  'aria-label': profileAriaLabel(message.senderUserId ?? ''),
                }
              : {}
          "
          class="flex-shrink-0"
          :class="message.senderUserId === currentUserId ? 'ms-3' : 'me-3'"
          @click.stop
        >
          <UserAvatar :user="resolveSenderUser(message.senderUserId ?? '')" :size="38" />
        </component>

        <div
          class="chat-body d-inline-flex flex-column"
          :class="message.senderUserId === currentUserId ? 'align-end' : 'align-start'"
        >
          <span v-if="message.senderUserId !== currentUserId" class="text-xs text-medium-emphasis mb-1">
            {{ resolveSenderName(message.senderUserId ?? '') }}
          </span>
          <p
            v-linkify
            class="chat-content text-sm py-3 px-4 elevation-1 mb-1"
            :class="
              message.senderUserId === currentUserId ? 'bg-primary text-white chat-right' : 'bg-surface chat-left'
            "
          >
            {{ message.body }}
          </p>
          <span class="text-xs text-disabled">
            {{ convertToTimeString(message.createdAt) }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.chat-content {
  border-end-end-radius: 6px;
  border-end-start-radius: 6px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;

  &.chat-left {
    border-start-end-radius: 6px;
  }

  &.chat-right {
    border-start-start-radius: 6px;
  }
}
</style>
