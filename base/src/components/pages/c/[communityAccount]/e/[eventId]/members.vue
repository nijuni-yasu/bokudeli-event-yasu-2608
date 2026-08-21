<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { useAppCommunityStore } from '@shokujii/base/composable/useAppCommunityStore.js'
import { useAppEventStore } from '@shokujii/base/composable/useAppEventStore.js'
import EventMemberCard from '@shokujii/base/components/EventMemberCard.vue'
import { getEventPath } from '@/router/utils'
import { mdiArrowLeftBold } from '@mdi/js'
import { shouldShowPfEventParticipantsSection } from '@shokujii/common/utils/eventParticipantsVisibility.js'

const props = defineProps<{
  communityAccount: string
  eventId: string
}>()

const router = useRouter()

const communityStore = useAppCommunityStore(props.communityAccount)
const isShowMember: boolean = await new Promise((resolve) => {
  watch(
    () => communityStore.community?.is_show_member,
    (isShowMember) => {
      if (isShowMember === false) {
        router.push('/404')
      }
      if (isShowMember != null) {
        resolve(isShowMember)
      }
    },
    { immediate: true },
  )
})

const eventStore = useAppEventStore(props.eventId)
const event = computed<BokudeliEvent | null>(() => eventStore.event)
const members = computed(() =>
  [...(eventStore.members ?? [])].sort(
    (a, b) =>
      a.orders.reduce((max, order) => Math.max(max, order.updated_at), 0) -
      b.orders.reduce((max, order) => Math.max(max, order.updated_at), 0),
  ),
)

const shouldShowParticipantsPage = computed(() => {
  const currentEvent = event.value
  if (currentEvent == null) {
    return null
  }
  return shouldShowPfEventParticipantsSection(currentEvent, currentEvent.members.length)
})

watch(
  shouldShowParticipantsPage,
  (visible) => {
    if (visible === false) {
      router.replace('/404')
    }
  },
  { immediate: true },
)
</script>
<template>
  <section>
    <div v-if="event != null && isShowMember && shouldShowParticipantsPage" class="justify-center">
      <v-btn
        class="ma-1"
        color="primary"
        variant="text"
        size="large"
        :prepend-icon="mdiArrowLeftBold"
        @click="() => $router.push(getEventPath(props.communityAccount, props.eventId))"
      >
        イベントページ
      </v-btn>
      <v-row class="ma-0 pa-0">
        <v-col v-for="member in members" :key="member.user_id" class="ma-0 pa-0" lg="3" md="4" sm="6" cols="12">
          <event-member-card :member="member" />
        </v-col>
      </v-row>
    </div>
    <div v-else class="justify-center">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </div>
  </section>
</template>
<style scoped lang="scss"></style>
