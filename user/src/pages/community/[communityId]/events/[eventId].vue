<script setup lang="ts">
import { db } from '@/firebase'
import {
  DocumentData,
  QueryDocumentSnapshot,
  collection,
  collectionGroup,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { getCommunityPath } from '@/router/utils'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import {
  dateWithDayOfWeekString,
  convertDocumentDataToCommunity,
  convertDocumentDataToEvent,
} from '@/schemes/converter'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import PartnerMenu from '@/schemes/partnerMenu'
import EventCartDialog from '@/components/EventCartDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EventMemberList from '@/components/EventMemberList.vue'
import EventMenuList from '@/components/EventMenuList.vue'
import { countEventMembers } from '@/composable/countEventMembers'

const props = defineProps<{
  communityId: string
  eventId: string
}>()

const eventDb = query(
  collectionGroup(db, 'events'),
  where('community_account', '==', props.communityId),
  where('event_id', '==', props.eventId),
)
const communityDb = query(collection(db, 'communities'), where('community_account', '==', props.communityId))

const state = reactive({
  event: {} as BokudeliEvent,
  community: {} as BokudeliCommunity,
  eventSnapshot: undefined as QueryDocumentSnapshot<DocumentData> | undefined,
  currentMemberCount: 0,
  isLoading: true,
})

const loadEventData = async (eventDocumentSnapshot: QueryDocumentSnapshot<DocumentData>) => {
  const eventData = eventDocumentSnapshot.data()
  const event = convertDocumentDataToEvent(eventData)
  return event
}

const fetchData = async () => {
  const [eventSnapshot, communitySnapshot] = await Promise.all([getDocs(eventDb), getDocs(communityDb)])

  const communityData = communitySnapshot.docs.shift()?.data()
  if (communityData) {
    const community = convertDocumentDataToCommunity(communityData)
    state.community = community
  }

  const eventDocumentSnapshot = eventSnapshot.docs.shift()
  if (!eventDocumentSnapshot) {
    return
  }
  state.eventSnapshot = eventDocumentSnapshot
  state.event = await loadEventData(eventDocumentSnapshot)

  state.isLoading = false
  state.currentMemberCount = await countEventMembers(state.event.communityAccount, state.event.eventId)
}

onBeforeRouteUpdate(async (to, from, next) => {
  await fetchData()
  next()
})

onMounted(async () => {
  await fetchData()
})

const selectedMenuState = reactive({
  menu: null as PartnerMenu | null,
  isOpen: false,
})

const updateSelectedMenu = (menu: PartnerMenu) => {
  selectedMenuState.menu = menu
  selectedMenuState.isOpen = true
}

const alertState = reactive({
  message: '',
  isOpen: false,
})

const updateAlert = (message: string) => {
  alertState.message = message
  alertState.isOpen = true
}
</script>

<template>
  <section>
    <v-row v-if="state.isLoading === false" class="justify-center">
      <v-col md="8" sm="9" cols="12">
        <v-card flat class="align-center justify-center text-center my-5 pa-sm-10 pa-xs-1">
          <v-row>
            <v-col>
              <v-img class="ma-0" cover aspect-ratio="1.91" :src="state.event.eventCoverUrl" />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <!-- イベント情報 -->
              <v-card-title class="justify-center text-sm-h4 text-xs-h5 font-weight-semibold pb-10 pre-line">
                {{ state.event.eventName }}
              </v-card-title>
              <v-card-text class="text-left pb-5 cursor-pointer text-decoration-none">
                <router-link
                  :to="getCommunityPath(state.event.communityAccount)"
                  class="text--primary cursor-pointer text-decoration-none"
                >
                  <v-row class="ma-1">
                    <v-img
                      :src="state.community.communityIconImageUrl"
                      style="border-radius: 10px; width: 75px; height: 75px"
                      aspect-ratio="1"
                      cover
                      max-width="75px"
                    />
                    <div class="ml-2 align-self-center">
                      <div class="my-1" style="font-size: 14px">【主催者】</div>
                      <div class="my-1" style="font-size: 24px">
                        {{ state.community.communityName }}
                      </div>
                    </div>
                  </v-row>
                </router-link>
              </v-card-text>
              <v-card-text class="text-left pb-8 text-subtitle-1">
                【開催場所】{{ state.event.eventAddress }}
              </v-card-text>
              <v-card-text class="text-left pb-8 text-subtitle-1">
                【開催日時】{{ dateWithDayOfWeekString(state.event.eventStartDatetime) }}
              </v-card-text>
              <v-card-text class="text-left pb-8 text-subtitle-1">
                【注文期限】{{ dateWithDayOfWeekString(state.event.eventDeadline) }}
              </v-card-text>
              <v-card-text class="text-left pb-8 text-subtitle-1"> 【お店】{{ state.event.shopName }} </v-card-text>
              <v-card-text class="text-left pb-8 text-subtitle-1" style="line-height: 32px">
                【開催内容】{{ state.event.eventDescription }}
              </v-card-text>
              <v-card-text class="text-left pb-8 text-subtitle-1">
                【支払い方法】{{ state.event.eventPayment }}
              </v-card-text>
              <v-card-text class="text-left pb-8 text-subtitle-1">
                【定員】{{ state.event.eventMaxPeople }} 人
              </v-card-text>
              <!-- メンバー情報 -->
              <event-member-list :community-id="state.event.communityAccount" :event-id="state.event.eventId" />
            </v-col>
          </v-row>
        </v-card>
        <!-- メニュ -->
        <event-menu-list
          :partner-id="state.event.partnerId"
          :event-deadline="state.event.eventDeadline"
          :event-start-datetime="state.event.eventStartDatetime"
          :current-member-count="state.currentMemberCount"
          :event-max-people="state.event.eventMaxPeople"
          @select-menu="updateSelectedMenu"
          @set-alert="updateAlert"
        />
      </v-col>
    </v-row>
    <v-row v-else class="justify-center">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>
    <event-cart-dialog
      v-if="selectedMenuState.menu && state.eventSnapshot"
      v-model="selectedMenuState.isOpen"
      :menu="selectedMenuState.menu"
      :event-snapshot="state.eventSnapshot"
    ></event-cart-dialog>
    <confirm-dialog v-model="alertState.isOpen" :is-confirm="false">{{ alertState.message }}</confirm-dialog>
  </section>
</template>
<style lang="scss" scoped></style>
