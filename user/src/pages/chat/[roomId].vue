<script setup lang="ts">
import { getDoc } from 'firebase/firestore'
import ChatApp from '@shokujii/base/components/chat/ChatApp.vue'
import { getEventInCommunityRef } from '@shokujii/base/stores/event.js'
import { getChatPath, getEventPath, getUserPath } from '@/router/utils'

definePage({
  meta: {
    layoutWrapperClasses: 'layout-content-height-fixed chat-layout-stretch',
  },
})

const route = useRoute()
const router = useRouter()
const roomId = computed(() => String(route.params.roomId ?? ''))

const onNavigateRoom = (payload: { path: Parameters<typeof router.push>[0]; replace?: boolean }) => {
  if (payload.replace === true) {
    void router.replace(payload.path)
  } else {
    void router.push(payload.path)
  }
}

const onOpenEvent = async (payload: { communityId: string; eventId: string }) => {
  const snapshot = await getDoc(getEventInCommunityRef(payload.communityId, payload.eventId))
  if (!snapshot.exists()) {
    return
  }
  const event = snapshot.data()
  void router.push(getEventPath(event.community_account, payload.eventId))
}
</script>

<template>
  <div class="chat-page d-flex flex-column overflow-hidden">
    <VCard class="chat-page-card d-flex flex-column flex-grow-1 overflow-hidden" elevation="2">
      <ChatApp
        :room-id="roomId"
        :resolve-profile-path="getUserPath"
        :resolve-chat-room-path="getChatPath"
        @navigate-room="onNavigateRoom"
        @open-event="onOpenEvent"
      />
    </VCard>
  </div>
</template>

<style scoped lang="scss">
.chat-page {
  flex: 1 1 auto;
  block-size: 100%;
  min-block-size: 0;
  inline-size: 100%;
  min-inline-size: 0;
  padding: 12px;

  @media (min-width: 600px) {
    padding: 16px;
  }
}

.chat-page-card {
  block-size: 100%;
  min-block-size: 0;
}
</style>
