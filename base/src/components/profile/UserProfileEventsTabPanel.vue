<script setup lang="ts">
import ProfileEventCard from '@shokujii/base/components/ProfileEventCard.vue'
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'
import type { BokudeliEvent } from '@shokujii/base/stores/event.js'
import type { ProfileLinkPolicyFn, ResolveEventPathFn } from '@shokujii/base/types/profilePathResolvers.js'

const props = defineProps<{
  events: BokudeliEvent[]
  isLoaded: boolean
  totalCount: number | null
  canLinkToDetail: ProfileLinkPolicyFn
  resolveEventPath: ResolveEventPathFn
  onLoadMore?: () => void
  eventListStore?: { next: () => void }
}>()

const { t: $t } = useI18n()

const handleLoadMore = () => {
  if (props.onLoadMore != null) {
    props.onLoadMore()
    return
  }
  props.eventListStore?.next()
}
</script>

<template>
  <div v-if="isLoaded && events.length === 0" class="text-body-1 text-medium-emphasis pa-4">
    {{ $t('user_profile.empty.events') }}
  </div>
  <v-row v-else>
    <v-col v-for="event in events" :key="`event_${event.event_id}`" sm="12" md="6" lg="4" cols="12">
      <div class="event-card">
        <router-link
          v-if="canLinkToDetail(event.is_public)"
          :to="resolveEventPath(event.community_account, event.event_id)"
        >
          <ProfileEventCard :event="event" />
        </router-link>
        <div v-else>
          <ProfileEventCard :event="event" />
        </div>
      </div>
    </v-col>
  </v-row>
  <v-row class="justify-center">
    <v-col cols="auto">
      <IncrementalLoader
        :loaded-count="events.length"
        :total-count="totalCount ?? Number.MAX_SAFE_INTEGER"
        @load="handleLoadMore"
      />
    </v-col>
  </v-row>
</template>

<style scoped lang="scss">
@import './userProfilePanel.scss';
</style>
