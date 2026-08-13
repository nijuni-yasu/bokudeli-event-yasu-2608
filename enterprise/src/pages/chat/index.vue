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

const router = useRouter()

const onNavigateRoom = (payload: { path: Parameters<typeof router.push>[0]; replace?: boolean }) => {
  if (payload.replace === true) {
    void router.replace(payload.path)
  } else {
    void router.push(payload.path)
  }
}

const onOpenEvent = async (payload: { communityId: string; eventId: string }) => {
  try {
    const snapshot = await getDoc(getEventInCommunityRef(payload.communityId, payload.eventId))
    if (!snapshot.exists()) {
      return
    }
    const event = snapshot.data()
    void router.push(getEventPath(event.community_account, payload.eventId))
  } catch {
    // getDoc 失敗時（ネットワーク / 権限）: イベントハンドラからの unhandled rejection を防ぐ
  }
}
</script>

<template>
  <div class="chat-page d-flex flex-column overflow-hidden">
    <VCard class="chat-page-card d-flex flex-column flex-grow-1 overflow-hidden" elevation="2">
      <ChatApp
        unread-badge-color="primary"
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
  min-block-size: 0;
  inline-size: 100%;
  min-inline-size: 0;
  padding: 0;

  @media (min-width: 600px) {
    padding: 16px;
  }
}

.chat-page-card {
  flex: 1 1 auto;
  min-block-size: 0;
  overflow: hidden;
  border-radius: 0;

  :deep(.chat-app-layout) {
    flex: 1 1 auto;
    min-block-size: 0;
    overflow: hidden;

    .v-main {
      flex: 1 1 auto;
      min-block-size: 0;
      overflow: hidden;
    }

    .v-main__wrap {
      display: flex;
      flex-direction: column;
      min-block-size: 0;
      block-size: 100%;
    }
  }

  @media (min-width: 600px) {
    border-radius: var(--v-card-border-radius);
  }
}
</style>
