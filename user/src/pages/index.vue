<script setup lang="ts">
import topLogo from '@/assets/images/bokudeli/bokudeli_top4.png'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { dateWithDayOfWeekString, dateOnlyTimeString } from '@/schemes/converter'
import { getEventPath } from '@/router/utils'
import { useEventsStore, type EventsStore, type EventStore } from '@/stores/event'
import { where, orderBy } from 'firebase/firestore'

const eventsStore = useEventsStore() as EventsStore
eventsStore.filters = [
  where('is_public', '==', true),
  orderBy('event_start_datetime', 'desc')
]

const isLoading = computed(() => {
  return eventsStore.eventStores == null
})

type _EventStore = Omit<EventStore, 'event'> & {
  event: BokudeliEvent
}

const eventStoreList = computed<_EventStore[]>(() => 
  (eventsStore.eventStores ?? []).flatMap((eventStore) => {
    if (eventStore.event == null || eventStore.event.event_status.value === 'in_draft' || eventStore.event.event_status.value === 'applying_reservation') {
      return []
    } else {
      return eventStore as _EventStore
    }
  })
)

const getEventKey = (event: BokudeliEvent) => {
  return [event.community_account, event.event_id].join('/')
}
</script>

<template>
  <div>
    <v-row class="justify-center align-center">
      <v-col md="10" cols="12">
        <v-card class="d-flex align-center justify-center text-center mb-10" flat>
          <v-img :src="topLogo" />
        </v-card>
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
                <v-card-title class="justify-center pb-3 title text-h6">
                  {{ eventStore.event.event_name }}
                </v-card-title>
                <v-card-text class="text-left pb-2"> 【主催者】 {{ eventStore.event.community_name }} </v-card-text>
                <v-card-text class="text-left pb-2">
                  【開催日時】{{ dateWithDayOfWeekString(eventStore.event.event_start_datetime) }}〜{{ dateOnlyTimeString(eventStore.event.event_end_datetime) }}
                </v-card-text>
                <v-card-text class="text-left pb-2">
                  【注文期限】{{ dateWithDayOfWeekString(eventStore.event.event_deadline_datetime) }}
                </v-card-text>
                <v-card-text class="text-left pb-2"> 【開催場所】{{ eventStore.event.event_address }} </v-card-text>
                <v-card-text class="text-left pb-2"> 【お店】 {{ eventStore.event.shop_name }} </v-card-text>
                <v-card-text class="text-left pb-2"> 【定員】{{ eventStore.event.event_max_people }} 人</v-card-text>
                <v-card-text class="text-left pb-4">
                  【参加者】{{ eventStore.orderConfiremedMembers?.length ?? 0 }} 人
                </v-card-text>
                <!-- Mutual members -->
                <v-card-text class="position-relative">
                  <div class="d-flex justify-space-between align-center">
                    <div class="v-avatar-group ml-2">
                      <v-avatar v-for="member in eventStore.orderConfiremedMembers ?? []" :key="member.user_id" size="40">
                        <v-img :src="member.user_image_url" cover/>
                      </v-avatar>
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
