<script setup lang="ts">
import topLogo from '@/assets/images/shokujii/shokujii_logo_cover.png'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { dateWithDayOfWeekString, dateOnlyTimeString } from '@/schemes/converter'
import { getEventPath } from '@/router/utils'
import { useEventsStore, type EventsStore, type EventStore } from '@/stores/event'
import { where, orderBy } from 'firebase/firestore'
import UserAvatar from '@/layouts/components/UserAvatar.vue'

const eventsStore = useEventsStore() as EventsStore
eventsStore.filters = [where('is_public', '==', true), orderBy('event_start_datetime', 'desc')]

const isLoading = computed(() => {
  return eventsStore.eventStores == null
})

type _EventStore = Omit<EventStore, 'event'> & {
  event: BokudeliEvent
}

const eventStoreList = computed<_EventStore[]>(() =>
  (eventsStore.eventStores ?? []).flatMap((eventStore) => {
    if (
      eventStore.event == null ||
      eventStore.event.event_status.value === 'in_draft' ||
      eventStore.event.event_status.value === 'applying_reservation'
    ) {
      return []
    } else {
      return eventStore as _EventStore
    }
  }),
)

const getEventKey = (event: BokudeliEvent) => {
  return [event.community_account, event.event_id].join('/')
}

</script>

<template>
  <div>
    <v-row class="justify-center align-center">
      <v-col md="10" cols="12">
        <a href="https://shokujii.studio.site/" target="_blank">
          <v-card class="d-flex align-center justify-center text-center mb-5" flat>
            <v-img :src="topLogo" />
          </v-card>
        </a>
        <v-row v-if="isLoading === false" class="mb-2">
          <v-col
            v-for="eventStore in eventStoreList"
            :key="getEventKey(eventStore.event)"
            md="4"
            sm="6"
            cols="12"
            class="content"
          >
            <router-link :to="getEventPath(eventStore.event.community_account, eventStore.event.event_id)">
              <v-card color="text-center cursor-pointer">
                <div class="image">
                  <VImg cover class="mx-auto" aspect-ratio="1.91" :src="eventStore.event.event_cover_url" />
                </div>
                <v-chip class="mt-2 ml-3" color="primary" size="small">
                  {{ $t(`event_status.${eventStore.event.event_status.value}`) }}
                </v-chip>
                <v-card-title class="justify-center px-3 py-1" style="font-size:16px; font-weight:600;">
                  {{ eventStore.event.event_name }}
                </v-card-title>
                <v-card-title class="text-left px-3 py-0 text-subtitle-2" style="line-height:1.75rem;">
                  【主催】{{ eventStore.event.community_name }}
                </v-card-title>
                <v-card-title class="text-left px-3 py-0 text-subtitle-2" style="line-height:1.75rem;">
                  【日時】{{ dateWithDayOfWeekString(eventStore.event.event_start_datetime) }}〜{{ dateOnlyTimeString(eventStore.event.event_end_datetime) }}
                </v-card-title>
                <v-card-title class="text-left px-3 py-0 text-subtitle-2" style="line-height:1.75rem;">
                  【場所】{{ eventStore.event.event_address }}
                </v-card-title>
                <v-card-title class="text-left px-3 py-0 text-subtitle-2" style="line-height:1.75rem;">
                  【お店】{{ eventStore.event.shop_name }}
                </v-card-title>
                <v-card-title class="text-left px-3 pt-0 pb-3 text-subtitle-2" style="line-height:1.75rem;">
                  【参加】{{ eventStore.orderConfiremedMembers?.length ?? 0 }} 人 / {{ eventStore.event.event_max_people }} 人
                </v-card-title>
                <!-- Mutual members -->
                <v-card-text class="position-relative px-3">
                  <div class="d-flex justify-space-between align-center">
                    <div v-if="eventStore.orderConfiremedMembers" class="v-avatar-group">
                      <UserAvatar
                        v-for="member in eventStore.orderConfiremedMembers.slice(0, 12) ?? []"
                        :key="member.user_id"
                        :user="member"
                        :size="40"
                      />
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </router-link>
          </v-col>
        </v-row>
        <v-row v-else>
          <v-col cols="12" class="text-center">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<style lang="scss" scoped>
.content {
  .image {
    position: relative;
    background: #fafafa;

    .v-image {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
    }
  }

  .title {
    text-align: center;
  }
}
</style>
