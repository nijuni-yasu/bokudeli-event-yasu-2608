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
  doc,
} from 'firebase/firestore'
import {
  getCommunityPath,
  getEventCreatePath
 } from '@/router/utils'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import {
  dateWithDayOfWeekString,
  dateOnlyTimeString,
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
import { checkCommunityManager } from '@/composable/checkCommunityManager'

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
  isCommunityManager: false,
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
  state.currentMemberCount = await countEventMembers(state.event.community_account, state.event.event_id)
  // コミュマネージャー権限を持つかチェック
  const communitySnapshotRef = doc(db, 'communities', state.community.communityId)
  state.isCommunityManager = await checkCommunityManager(communitySnapshotRef)
}

onBeforeRouteUpdate(async (to, from, next) => {
  await fetchData()
  next()
})

onMounted(async () => {
  await fetchData()
})

const eventStartDate = computed(() => {
  return state.event.event_start_datetime?.toDate() ?? null
})

const eventDeadlineDate = computed(() => {
  return state.event.event_deadline_datetime?.toDate() ?? null
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
    <div v-if="state.isLoading === false" class="justify-center">
      <v-row class="justify-center mt-5 mr-1">
        <v-col md="8" sm="9" cols="12">
          <v-row class="justify-end align-center">
            <v-chip color="primary">
              {{ $t(`event_status.${state.event.event_status.value}`) }}
            </v-chip>
            <v-btn
              v-if="state.event.event_status.value===`in_draft`&&state.isCommunityManager"
              color="black"
              class="ml-2"
              rounded
              prepend-icon="mdi-pencil"
              :to="{ path: getEventCreatePath(state.community.communityAccount), query: { id: props.eventId} }"
            >
              イベント編集
            </v-btn>
          </v-row>
        </v-col>
      </v-row>
      <v-row class="justify-center">
        <v-col md="8" sm="9" cols="12">
          <v-card flat class="align-center justify-center mt-1 mb-5 pa-sm-10 pa-xs-1">
            <v-row>
              <v-col>
                <v-img class="ma-0" cover aspect-ratio="1.91" :src="state.event.event_cover_url" />
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <!-- イベント情報 -->
                <v-card-title class="text-sm-h4 text-xs-h5 font-weight-bold pb-10 pre-line">
                  {{ state.event.event_name }}
                </v-card-title>
                <v-card-text class="text-left pb-5 cursor-pointer text-decoration-none">
                  <router-link
                    :to="getCommunityPath(state.event.community_account)"
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
                        <div class="mb-2" style="font-size: 14px">【主催者】</div>
                        <div class="my-2" style="font-size: 20px">
                          {{ state.community.communityName }}
                        </div>
                      </div>
                    </v-row>
                  </router-link>
                </v-card-text>
                <v-card-text class="event-item">
                  【開催日時】
                </v-card-text>
                <v-card-text class="event-content">
                  {{ dateWithDayOfWeekString(state.event.event_start_datetime) }}〜{{ dateOnlyTimeString(state.event.event_end_datetime) }}
                </v-card-text>
                <v-card-text class="event-item">
                  【開催場所】
                </v-card-text>
                <v-card-text class="event-content">
                  {{ state.event.event_address }}
                  <a
                    :href="`https://www.google.co.jp/maps/search/${state.event.event_address} ${state.event.event_place}`"
                    target="_blank"
                  >
                    <v-icon>mdi-map-marker-radius</v-icon>
                  </a>
                  <div v-if="state.event.event_place_url&&state.event.event_place">
                    {{ state.event.event_place }}
                    <a
                      :href="state.event.event_place_url"
                      target="_blank">
                      <v-icon size="small">
                        mdi-open-in-new
                      </v-icon>
                    </a>
                  </div>
                  <div v-else-if="!state.event.event_place_url&&state.event.event_place">
                    {{ state.event.event_place }}
                  </div>
                </v-card-text>
                <v-card-text class="event-item">
                  【開催内容】
                </v-card-text>
                <v-card-text v-linkify class="event-content">
                  {{ state.event.event_desc }}
                </v-card-text>
                <v-card-text class="event-item2">
                  【お店】
                  <span class="event-content">
                    {{ state.event.shop_name }}
                  </span>
                </v-card-text>
                <v-card-text class="event-item2">
                  【注文期限】
                  <span class="event-content">
                    {{ dateWithDayOfWeekString(state.event.event_deadline_datetime) }}
                  </span>
                </v-card-text>
                <v-card-text class="event-item2">
                  【支払い方法】
                  <span class="event-content">
                  {{ $t(`payment.${state.event.event_payment}`) }}
                  </span>
                </v-card-text>
                <!-- <v-card-text class="event-item2">
                  【定員】
                  <span class="event-content">
                    {{ state.event.event_max_people }} 人
                  </span>                
                </v-card-text> -->
                <!-- メンバー情報 -->
                <event-member-list :community-id="state.event.community_account" :event-id="state.event.event_id" :event-max-people="state.event.event_max_people"/>
              </v-col>
            </v-row>
          </v-card>
          <!-- メニュ -->
          <event-menu-list
            :partner-id="state.event.partner_id"
            :event-deadline="eventDeadlineDate"
            :event-start-datetime="eventStartDate"
            :current-member-count="state.currentMemberCount"
            :event-max-people="state.event.event_max_people"
            @select-menu="updateSelectedMenu"
            @set-alert="updateAlert"
          />
        </v-col>
      </v-row>
    </div>
    <div v-else class="justify-center">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </div>
    <event-cart-dialog
      v-if="selectedMenuState.menu && state.eventSnapshot"
      v-model="selectedMenuState.isOpen"
      :menu="selectedMenuState.menu"
      :event-snapshot="state.eventSnapshot"
    ></event-cart-dialog>
    <confirm-dialog v-model="alertState.isOpen" :is-confirm="false">{{ alertState.message }}</confirm-dialog>
  </section>
</template>
<style lang="scss" scoped>
  .event-item{
    font-size: 14px;
    padding-bottom: 2px;
    font-weight: 600;
  }
  .event-item2{
    font-size: 14px;
    padding-bottom: 16px;
    font-weight: 600;
  }
  .event-content{
    font-size: 18px;
    padding-bottom: 16px;
    font-weight: 400;
    line-height: 32px;
    white-space: pre-line;
  }
</style>
