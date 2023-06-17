<script setup lang="ts">
import { collectionGroup, query, getDocs, orderBy } from 'firebase/firestore'

import { db } from '@/firebase'
import topLogo from '@/assets/images/bokudeli/bokudeli_top4.png'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { dateString, convertDocumentDataToEvent } from '@/schemes/converter'
import avatarImageList from '@/assets/examples/avatarImageList'

const allEvents = query(collectionGroup(db, 'events'), orderBy('event_start_datetime', 'desc'))

const state = reactive({
  eventList: [] as BokudeliEvent[],
  isLoading: true,
})

onMounted(async () => {
  // イベント情報取得
  const events: BokudeliEvent[] = []
  const querySnapshot = await getDocs(allEvents)
  querySnapshot.forEach((doc) => {
    const event = convertDocumentDataToEvent(doc.data())
    events.push(event)
  })

  state.eventList = events
  state.isLoading = false
})
</script>

<template>
  <div>
    <v-row class="justify-center align-center">
      <v-col md="10" cols="12">
        <v-card class="d-flex align-center justify-center text-center mb-10" flat>
          <v-img :src="topLogo" />
        </v-card>
        <v-row v-if="state.isLoading === false" class="mb-2">
          <v-col v-for="event in state.eventList" :key="event.eventId" md="4" sm="6" cols="12" class="content">
            <router-link :to="`/community/${event.communityAccount}/events/${event.eventId}`">
              <v-card color="text-center cursor-pointer">
                <div class="image">
                  <VImg cover class="mx-auto" aspect-ratio="1.91" :src="event.eventCoverUrl" />
                </div>
                <v-card-title class="justify-center pb-3 title text-h5">
                  {{ event.eventName }}
                </v-card-title>
                <v-card-text class="text-left pb-2"> 【主催者】 {{ event.communityName }} </v-card-text>
                <v-card-text class="text-left pb-2"> 【注文期限】{{ dateString(event.eventDeadline) }} </v-card-text>
                <v-card-text class="text-left pb-2">
                  【開催日時】{{ dateString(event.eventStartDatetime) }}
                </v-card-text>
                <v-card-text class="text-left pb-2"> 【開催場所】{{ event.eventAddress }} </v-card-text>
                <v-card-text class="text-left pb-2"> 【お店】 {{ event.shopName }} </v-card-text>
                <v-card-text class="text-left pb-8"> 【最大人数】{{ event.eventMaxPeople }} </v-card-text>
                <!-- Mutual members -->
                <v-card-text class="position-relative">
                  <div class="d-flex justify-space-between align-center mt-8">
                    <span class="text--primary font-weight-medium"> 10 members </span>
                    <div class="v-avatar-group">
                      <v-avatar v-for="i in 8" :key="i" size="40">
                        <v-img :src="avatarImageList[i % 8]"></v-img>
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
