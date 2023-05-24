<script setup lang="ts">
import {
  collectionGroup,
  query,
  getDocs,
  DocumentData,
  Timestamp,
  orderBy,
  collection,
  where,
} from 'firebase/firestore'
import { format } from 'date-fns'

import { db } from '@/firebase'
import topLogo from '@/assets/images/bokudeli/bokudeli_top4.png'

const allEvents = query(collectionGroup(db, 'events'), orderBy('event_start_datetime', 'desc'))

type Event = {
  communityId: string
  communityName: string
  communityAccount: string
  eventId: string
  eventAddress: string
  eventCoverUrl: string
  eventDescription: string
  eventDeadline: Date | null
  eventMaxPeople: number
  eventName: string
  eventStartDatetime: Date | null
  eventEndDatetime: Date | null
  partnerId: string
  shopId: string
  shopName: string
}

const convertDocumentDataToEvent = (documentData: DocumentData): Event => {
  const {
    community_id,
    community_name,
    event_address,
    event_cover_url,
    event_deadline_datetime,
    event_desc,
    event_end_datetime,
    event_id,
    event_max_people,
    event_name,
    event_start_datetime,
    partner_id,
    shop_id,
    shop_name,
  } = documentData

  return {
    communityId: community_id ?? '',
    communityName: community_name ?? '',
    communityAccount: '',
    eventId: event_id ?? '',
    eventAddress: event_address ?? '',
    eventCoverUrl: event_cover_url ?? '',
    eventDescription: event_desc ?? '',
    eventDeadline: event_deadline_datetime ? (event_deadline_datetime as Timestamp).toDate() : null,
    eventMaxPeople: event_max_people ?? 0,
    eventName: event_name ?? '',
    eventStartDatetime: event_start_datetime ? (event_start_datetime as Timestamp).toDate() : null,
    eventEndDatetime: event_end_datetime ? (event_end_datetime as Timestamp).toDate() : null,
    partnerId: partner_id ?? '',
    shopId: shop_id ?? '',
    shopName: shop_name ?? '',
  }
}

const makeDateString = (date: Date | null): string => {
  if (!date) return ''
  return format(date, 'yyyy-MM-dd HH:mm')
}

const state = reactive({
  eventList: [] as Event[],
  isLoading: true,
})

onMounted(async () => {
  // イベント情報取得
  const events: Event[] = []
  const communityIdSet = new Set<string>()
  const querySnapshot = await getDocs(allEvents)
  querySnapshot.forEach((doc) => {
    const event = convertDocumentDataToEvent(doc.data())
    events.push(event)
    communityIdSet.add(event.communityId)
  })

  // コミュニティIDからコミュニティアカウント取得処理
  const communityIdList = Array.from(communityIdSet)
  const communities = query(collection(db, 'communities'), where('community_id', 'in', communityIdList))
  const communityQuerySnapshot = await getDocs(communities)
  communityQuerySnapshot.forEach((doc) => {
    const communityId = doc.data().community_id
    const communityAccount = doc.data().community_account
    events.forEach((event) => {
      if (event.communityId === communityId) {
        event.communityAccount = communityAccount
      }
    })
  })

  state.eventList = events
  state.isLoading = false
})
</script>

<template>
  <div>
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
            <v-card-title class="justify-center pb-3 title">
              {{ event.eventName }}
            </v-card-title>
            <v-card-text class="text-left pb-8">
              {{ event.eventDescription }}
            </v-card-text>
            <v-card-text class="text-left pb-2"> 【主催者】 {{ event.communityName }} </v-card-text>
            <v-card-text class="text-left pb-2"> 【注文期限】{{ event.eventDeadline }} </v-card-text>
            <v-card-text class="text-left pb-2">
              【開催日時】{{ makeDateString(event.eventStartDatetime) }}
            </v-card-text>
            <v-card-text class="text-left pb-2"> 【開催場所】{{ event.eventAddress }} </v-card-text>
            <v-card-text class="text-left pb-2"> 【お店】 {{ event.shopName }} </v-card-text>
            <v-card-text class="text-left pb-8"> 【最大人数】{{ event.eventMaxPeople }} </v-card-text>
          </v-card>
        </router-link>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
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
