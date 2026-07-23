import { ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { waitForEventChatMembership } from '@shokujii/base/stores/chat.js'
import { useNotification } from '@shokujii/base/composable/notification.js'
import type { NavigateToEventChatFn } from '@shokujii/base/types/profilePathResolvers.js'

type UseNavigateToEventChatOptions = {
  getChatPath: (roomId: string) => string
  userId: () => string | undefined
}

type UseNavigateToEventChatReturn = {
  navigateToEventChat: NavigateToEventChatFn
  isNavigatingToChat: Ref<boolean>
}

export const useNavigateToEventChat = (options: UseNavigateToEventChatOptions): UseNavigateToEventChatReturn => {
  const router = useRouter()
  const notification = useNotification()
  const { t } = useI18n()
  const isNavigatingToChat = ref(false)

  const navigateToEventChat: NavigateToEventChatFn = async (params) => {
    const userId = options.userId()
    if (userId == null || userId === '') {
      return false
    }

    isNavigatingToChat.value = true
    try {
      const roomId = await waitForEventChatMembership(userId, params.communityId, params.eventId)
      if (roomId == null) {
        notification.show(t('chat.error.preparing'), 'warning')
        return false
      }
      await router.push(options.getChatPath(roomId))
      return true
    } catch {
      notification.show(t('chat.error.open_failed'), 'error')
      return false
    } finally {
      isNavigatingToChat.value = false
    }
  }

  return {
    navigateToEventChat,
    isNavigatingToChat,
  }
}
