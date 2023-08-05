<script setup lang="ts">
import { collectionGroup, query, orderBy, getDocs, where } from 'firebase/firestore'

import { db } from '@/firebase'
import topLogo from '@/assets/images/bokudeli/bokudeli_top4.png'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { dateString, convertDocumentDataToEvent } from '@/schemes/converter'
import { getEventPath } from '@/router/utils'
import { EventMember } from '@/schemes/EventMember'
import { loadEventMembersWithoutMenu } from '@/composable/loadEventMembers'

const state = reactive({
  eventList: [] as BokudeliEvent[],
  membersSet: {} as { [key: string]: EventMember[] },
  isLoading: true,
})

const getEventKey = (event: BokudeliEvent) => {
  return [event.communityAccount, event.eventId].join('/')
}

const getEventMemberKey = (event: BokudeliEvent, memberSet: { [key: string]: EventMember[] }) => {
  const key = [event.communityAccount, event.eventId].join('/')
  return memberSet[key] ? key + '/' + memberSet[key].length : key
}

onMounted(async () => {
  // イベント情報取得
  const allEvents = query(
    collectionGroup(db, 'events'),
    where('is_public', '==', true),
    orderBy('event_start_datetime', 'desc')
  )
  const events: BokudeliEvent[] = []
  const querySnapshot = await getDocs(allEvents)

  for (const doc of querySnapshot.docs) {
    const event = convertDocumentDataToEvent(doc.data())
    loadEventMembersWithoutMenu(event.communityAccount, event.eventId).then((members) => {
      const key = [event.communityAccount, event.eventId].join('/')
      state.membersSet[key] = members
    })
    events.push(event)
  }

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
          <v-col
            v-for="event in state.eventList"
            :key="getEventMemberKey(event, state.membersSet)"
            md="4"
            sm="6"
            cols="12"
            class="content"
          >
            <router-link :to="getEventPath(event.communityAccount, event.eventId)">
              <v-card color="text-center cursor-pointer">
                <div class="image">
                  <VImg cover class="mx-auto" aspect-ratio="1.91" :src="event.eventCoverUrl" />
                </div>
                <v-card-title class="justify-center pb-3 title text-h6">
                  {{ event.eventName }}
                </v-card-title>
                <v-card-text class="text-left pb-2"> 【主催者】 {{ event.communityName }} </v-card-text>
                <v-card-text class="text-left pb-2"> 【注文期限】{{ dateString(event.eventDeadline) }} </v-card-text>
                <v-card-text class="text-left pb-2">
                  【開催日時】{{ dateString(event.eventStartDatetime) }}
                </v-card-text>
                <v-card-text class="text-left pb-2"> 【開催場所】{{ event.eventAddress }} </v-card-text>
                <v-card-text class="text-left pb-2"> 【お店】 {{ event.shopName }} </v-card-text>
                <v-card-text class="text-left pb-2"> 【定員】{{ event.eventMaxPeople }} 人</v-card-text>
                <v-card-text v-if="state.membersSet[getEventKey(event)]" class="text-left pb-4">
                  【参加者】{{ state.membersSet[getEventKey(event)].length }} 人</v-card-text
                >
                <!-- Mutual members -->
                <v-card-text class="position-relative">
                  <div class="d-flex justify-space-between align-center">
                    <div class="v-avatar-group ml-2">
                      <v-avatar v-for="member in state.membersSet[getEventKey(event)]" :key="member.userId" size="40">
                        <v-img :src="member.userImageUrl" />
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
