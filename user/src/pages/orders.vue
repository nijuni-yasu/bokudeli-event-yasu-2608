<script setup lang="ts">
import Orders from '@shokujii/base/components/pages/orders.vue'
import { useRouter } from 'vue-router'
import { getChatPath, getEventPath, getReceiptPath } from '@/router/utils'
import { waitForEventChatMembership } from '@shokujii/base/stores/chat.js'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { storeToRefs } from 'pinia'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'

const router = useRouter()
const notification = useNotification()
const { t: $t } = useI18n()
const { user: loginUser } = storeToRefs(useCurrentUserStore())

const navigateToEventChat = async (params: { communityId: string; eventId: string }): Promise<boolean> => {
  const userId = loginUser.value?.user_id
  if (userId == null || userId === '') {
    return false
  }
  const roomId = await waitForEventChatMembership(userId, params.communityId, params.eventId)
  if (roomId == null) {
    notification.show($t('chat.error.preparing'), 'warning')
    return false
  }
  await router.push(getChatPath(roomId))
  return true
}
</script>

<template>
  <Orders
    :profile-filter="{ kind: 'pf-null' }"
    :resolve-event-path="getEventPath"
    :resolve-receipt-path="getReceiptPath"
    :navigate-to-event-chat="navigateToEventChat"
  />
</template>
