<script setup lang="ts">
import { getCommunityPath, getEventCreatePath } from '@/router/utils'
import { dateWithDayOfWeekString, dateOnlyTimeString } from '@/schemes/converter'
import PartnerMenu from '@/schemes/partnerMenu'
import EventCartDialog from '@/components/EventCartDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EventMemberList from '@/components/EventMemberList.vue'
import EventMenuList from '@/components/EventMenuList.vue'
import CommunityContactDialog from '@/components/CommunityContactDialog.vue'
import LoginDialog from '@/components/LoginDialog.vue'
import { useStoreStoredUser } from '@/stores/storedUser'
import { useEventStore, type EventStore } from '@/stores/event'
import { useCommunityStore, type CommunityStore } from '@/stores/community'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import CalendarAddDialog from '@/components/CalendarAddDialog.vue'

const props = defineProps<{
  communityId: string
  eventId: string
}>()

const eventStore = useEventStore(props.eventId) as EventStore
const communityStore = useCommunityStore(props.communityId) as CommunityStore

const isManager = ref(false)
communityStore.getCurrentUserRoles().then((roles) => {
  isManager.value = roles?.includes('manager') ?? false
})

const event = computed<BokudeliEvent | null>(() => eventStore.event)
const members = computed(() => eventStore.orderConfiremedMembers?.sort((a, b) => 
  a.orders.reduce((max, order) => Math.max(max, order.status !== 'ordered' ? 0 : order.updated_at.toMillis()), 0) -
  b.orders.reduce((max, order) => Math.max(max, order.status !== 'ordered' ? 0 : order.updated_at.toMillis()), 0)
) ?? [])

const eventStartDate = computed(() => {
  return event.value?.event_start_datetime?.toDate() ?? null
})

const eventDeadlineDate = computed(() => {
  return event.value?.event_deadline_datetime?.toDate() ?? null
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

const isOpenContactDialogVisible = ref(false)
const isOpenConfirmDialog = ref(false)
const isOpenLoginDialog = ref(false)
const isOpenCalendarAddDialog = ref(false)

// コミュニティへの問い合わせはログイン必須
const userStore = useStoreStoredUser()
const openContactDialog = () => {
  if (!userStore.storedUser) {
    isOpenConfirmDialog.value = true
  } else {
    isOpenContactDialogVisible.value = true
  }
}
const openLoginDialog = () => {
  isOpenLoginDialog.value = true
}

const openCalendarAddDialog = () => {
  isOpenCalendarAddDialog.value = true
}
</script>

<template>
  <section>
    <div v-if="event != null && communityStore.community != null" class="justify-center">
      <v-row class="justify-center mt-lg-10 mr-1">
        <v-col md="8" sm="9" cols="12">
          <v-row class="justify-end align-center">
            <v-btn
              v-if="event.event_status.value === `in_draft` && isManager"
              color="white"
              class="mr-2 my-1"
              elevation="5"
              rounded
              prepend-icon="mdi-email"
              :to="{
                path: getEventCreatePath(communityStore.community.communityAccount),
                query: { id: props.eventId, step: 4 },
              }"
            >
              店舗へ予約申請
            </v-btn>
            <v-btn
              v-if="event.event_status.value == `in_draft` && isManager"
              color="white"
              class="mr-2 my-1"
              elevation="5"
              rounded
              prepend-icon="mdi-pencil-box-outline"
              :to="{
                path: getEventCreatePath(communityStore.community.communityAccount),
                query: { id: props.eventId },
              }"
            >
              イベント編集
            </v-btn>
            <v-btn
              v-if="
                (event.event_status.value == 'applying_reservation' ||
                  event.event_status.value == 'accepting_order' ||
                  event.event_status.value == 'order_closed') &&
                isManager
              "
              color="white"
              class="mr-2 my-1"
              elevation="5"
              rounded
              prepend-icon="mdi-pencil-box-outline"
              :to="{
                path: getEventCreatePath(communityStore.community.communityAccount),
                query: { id: props.eventId, step: 3 },
              }"
            >
              イベント編集
            </v-btn>
            <v-chip color="primary" size="large">
              {{ $t(`event_status.${event.event_status.value}`) }}
            </v-chip>
          </v-row>
        </v-col>
      </v-row>
      <v-row class="justify-center">
        <v-col md="8" sm="9" cols="12">
          <v-card class="align-center justify-center mt-1 mb-5 pa-sm-10 pa-xs-1">
            <v-row>
              <v-col>
                <v-img class="ma-0" cover aspect-ratio="1.91" :src="event.event_cover_url" />
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <!-- イベント情報 -->
                <v-card-title class="text-sm-h4 text-xs-h5 font-weight-bold pb-10 pre-line">
                  {{ event.event_name }}
                </v-card-title>
                <v-card-text class="event-item"> 【開催日時】 </v-card-text>
                <v-card-text class="event-content">
                  {{ dateWithDayOfWeekString(event.event_start_datetime) }}〜{{
                    dateOnlyTimeString(event.event_end_datetime)
                  }}
                  <a @click="openCalendarAddDialog"
                    ><button><v-icon>mdi-calendar-plus</v-icon></button></a
                  >
                </v-card-text>
                <v-card-text class="event-item"> 【開催場所】 </v-card-text>
                <v-card-text class="event-content">
                  {{ event.event_address }}
                  <a
                    :href="`https://www.google.co.jp/maps/search/${event.event_address} ${event.event_place}`"
                    target="_blank"
                  >
                    <v-icon>mdi-map-marker-radius</v-icon>
                  </a>
                  <div v-if="event.event_place_url && event.event_place">
                    {{ event.event_place }}
                    <a :href="event.event_place_url" target="_blank">
                      <v-icon size="small"> mdi-open-in-new </v-icon>
                    </a>
                  </div>
                  <div v-else-if="!event.event_place_url && event.event_place">
                    {{ event.event_place }}
                  </div>
                </v-card-text>
                <v-card-text class="event-item"> 【開催内容】 </v-card-text>
                <v-card-text v-linkify class="event-content">
                  {{ event.event_desc }}
                </v-card-text>
                <v-card-text class="event-item2">
                  【お店】
                  <span class="event-content">
                    {{ event.shop_name }}
                  </span>
                </v-card-text>
                <v-card-text class="event-item2">
                  【注文期限】
                  <span class="event-content">
                    {{ dateWithDayOfWeekString(event.event_deadline_datetime) }}
                  </span>
                </v-card-text>
                <v-card-text class="event-item2">
                  【支払い方法】
                  <span class="event-content">
                    {{ $t(`payment.${event.event_payment}`) }}
                  </span>
                </v-card-text>
                <!-- <v-card-text class="event-item2">
                  【定員】
                  <span class="event-content">
                    {{ event.event_max_people }} 人
                  </span>                
                </v-card-text> -->
                <!-- メンバー情報 -->
                <event-member-list :members="members" :event-max-people="event.event_max_people">
                  <v-row>
                    <v-spacer/>
                    <v-col v-if="members.length>0" cols="auto">
                      <router-link :to="{ path: `${eventId}/members` }">
                        <div class="d-flex align-end">
                          <v-icon size="large">mdi-account-group</v-icon>
                          <span class="ml-2" style="font-size: 16px">参加者一覧</span>
                        </div>
                      </router-link>
                    </v-col>
                  </v-row>
                </event-member-list>
                <v-card-text>
                  <v-row align-self-center>
                    <v-row class="ma-1">
                      <router-link :to="getCommunityPath(event.community_account)">
                        <v-img
                          :src="communityStore.community.communityIconImageUrl"
                          style="border-radius: 10px; width: 100px; height: 100px"
                          aspect-ratio="1"
                          cover
                          max-width="100px"
                        />
                      </router-link>
                      <div class="ml-2 align-self-end">
                        <router-link
                          :to="getCommunityPath(event.community_account)"
                          class="text--primary cursor-pointer text-decoration-none"
                        >
                          <div class="ma-1" style="font-size: 12px">【主 催 者】</div>
                          <div class="ma-1" style="font-size: 18px">{{ communityStore.community.communityName }}</div>
                        </router-link>
                        <v-btn
                          class="ma-1"
                          variant="outlined"
                          rounded
                          prepend-icon="mdi-email"
                          @click="openContactDialog"
                        >
                          主催者に連絡
                        </v-btn>
                        <community-contact-dialog
                          v-model="isOpenContactDialogVisible"
                          :community-name="communityStore.community.communityName"
                          :community-id="communityStore.community.communityId"
                        />
                      </div>
                    </v-row>
                  </v-row>
                </v-card-text>
              </v-col>
            </v-row>
          </v-card>
          <!-- メニュ -->
          <event-menu-list
            :event-deadline="eventDeadlineDate"
            :event-start-datetime="eventStartDate"
            :current-member-count="members.length"
            :event="event"
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
      v-if="selectedMenuState.menu && event != null"
      v-model="selectedMenuState.isOpen"
      :menu="selectedMenuState.menu"
      :event-id="event.event_id"
    ></event-cart-dialog>
    <confirm-dialog v-model="alertState.isOpen" :is-confirm="false">{{ alertState.message }}</confirm-dialog>
    <confirm-dialog v-model="isOpenConfirmDialog" :is-confirm="true" :ok-click="openLoginDialog">
      ログインした後に主催者に連絡してください。
    </confirm-dialog>
    <login-dialog v-model="isOpenLoginDialog" />
    <calendar-add-dialog v-model="isOpenCalendarAddDialog" :event="event" />
  </section>
</template>
<style lang="scss" scoped>
.event-item {
  font-size: 14px;
  padding-bottom: 2px;
  font-weight: 600;
}
.event-item2 {
  font-size: 14px;
  padding-bottom: 16px;
  font-weight: 600;
}
.event-content {
  font-size: 16px;
  padding-bottom: 16px;
  font-weight: 400;
  line-height: 32px;
  white-space: pre-line;
}
</style>
