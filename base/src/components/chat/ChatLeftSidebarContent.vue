<script setup lang="ts">
import { mdiClose, mdiMagnify } from '@mdi/js'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import ChatContact from './ChatContact.vue'
import { useChatStore } from '@shokujii/base/stores/chat.js'

defineProps<{
  isDrawerOpen: boolean
}>()

const emit = defineEmits<{
  openRoom: [roomId: string]
  openEvent: [payload: { communityId: string; eventId: string }]
  close: []
}>()

const store = useChatStore()
const { t } = useI18n()
const search = ref('')

const filteredRooms = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (keyword === '') return store.rooms
  return store.rooms.filter((room) => room.displayTitleReady && room.displayTitle.toLowerCase().includes(keyword))
})
</script>

<template>
  <div class="chat-list-header d-flex align-center px-4">
    <h6 class="text-h6">{{ t('chat.title') }}</h6>
    <VSpacer />
    <VBtn v-if="$vuetify.display.smAndDown" variant="text" color="default" icon size="small" @click="emit('close')">
      <VIcon size="24" :icon="mdiClose" />
    </VBtn>
  </div>
  <VDivider />

  <div class="px-4 py-3">
    <VTextField
      v-model="search"
      density="compact"
      :placeholder="t('chat.search_placeholder')"
      :prepend-inner-icon="mdiMagnify"
      hide-details
    />
  </div>

  <PerfectScrollbar tag="ul" class="chat-contacts-list px-3" :options="{ wheelPropagation: false }">
    <ChatContact
      v-for="room in filteredRooms"
      :key="room.roomId"
      :room="room"
      @open-room="emit('openRoom', $event)"
      @open-event="emit('openEvent', $event)"
    />
    <li v-if="filteredRooms.length === 0" class="no-chat-items-text text-disabled px-3 pb-4">
      {{ t('chat.empty.no_rooms') }}
    </li>
  </PerfectScrollbar>
</template>

<style scoped lang="scss">
.chat-list-header {
  min-block-size: 68px;
}

.chat-contacts-list {
  padding-block-end: 0.75rem;
  list-style: none;
}
</style>
