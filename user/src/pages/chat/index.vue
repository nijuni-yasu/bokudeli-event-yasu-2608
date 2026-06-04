<script setup lang="ts">
import { getDoc } from 'firebase/firestore'
import ChatApp from '@shokujii/base/components/chat/ChatApp.vue'
import { getEventInCommunityRef } from '@shokujii/base/stores/event.js'
import { getEventPath, getUserPath } from '@/router/utils'

definePage({
  meta: {
    layoutWrapperClasses: 'layout-content-height-fixed chat-layout-stretch',
  },
})

const router = useRouter()

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
      <ChatApp :resolve-profile-path="getUserPath" @open-event="onOpenEvent" />
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
