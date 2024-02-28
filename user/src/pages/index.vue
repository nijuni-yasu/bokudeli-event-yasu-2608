<script setup lang="ts">
import topLogo from '@/assets/images/shokujii/shokujii_logo_cover.png'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { dateWithDayOfWeekString, dateOnlyTimeString } from '@/schemes/converter'
import { getEventPath } from '@/router/utils'
import { useEventsStore, type EventsStore, type EventStore } from '@/stores/event'
import { where, orderBy } from 'firebase/firestore'
import UserAvatar from '@/layouts/components/UserAvatar.vue'

const loadingElement = ref()
let observer: IntersectionObserver
let isVisible = false

const eventsStore = useEventsStore([
  where('is_public', '==', true),
  where('event_status.value', '==', 'accepting_order'),
  orderBy('event_start_datetime', 'desc')
]) as EventsStore

const hasMore = computed(() => {
  if (eventsStore.totalCount == null || eventsStore.eventStores?.length == null) {
    return true
  }
  return (eventsStore.eventStores.length) < eventsStore.totalCount
})

type _EventStore = Omit<EventStore, 'event'> & {
  event: BokudeliEvent
}

const eventStoreList = computed<_EventStore[]>(() =>
  (eventsStore.eventStores ?? []).flatMap((eventStore) => {
    if (
      eventStore.event == null
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

watch(eventStoreList, () => {
  if (isVisible) {
    eventsStore.next()
  }
})

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        isVisible = true
        eventsStore.next()
      } else {
        isVisible = false
      }
    });
  }, {
    // オプションでroot、rootMargin、thresholdを設定可能
    threshold: 0.1 // 10%の部分が見えたらトリガー
  });

  if (loadingElement.value?.$el != null) {
    observer.observe(loadingElement.value.$el);
  }
});

onUnmounted(() => {
  observer?.disconnect();
})
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
        <v-row class="mb-2">
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
                  【参加】{{ eventStore.members?.length ?? 0 }} 人 / {{ eventStore.event.event_max_people }} 人
                </v-card-title>
                <!-- Mutual members -->
                <v-card-text class="position-relative px-3">
                  <div class="d-flex justify-space-between align-center">
                    <div v-if="eventStore.members" class="v-avatar-group">
                      <UserAvatar
                        v-for="member in eventStore.members.slice(0, 12) ?? []"
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
          <v-col v-if="hasMore" cols="12" class="text-center">
            <v-progress-circular ref="loadingElement" indeterminate color="primary"></v-progress-circular>
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
