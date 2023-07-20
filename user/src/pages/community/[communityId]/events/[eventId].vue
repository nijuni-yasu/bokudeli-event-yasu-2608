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
  dateString,
  convertDocumentDataToCommunity,
  convertDocumentDataToEvent,
  convertDocumentDataToMenu,
} from '@/schemes/converter'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import PartnerMenu from '@/schemes/partnerMenu'
import EventCartDialog from '@/components/EventCartDialog.vue'
import { loadEventMembers } from '@/composable/loadEventMembers'
import { EventMember } from '@/schemes/EventMember'

const covidImage = new URL('@/assets/images/bokudeli/covid19.png', import.meta.url).href

const props = defineProps<{
  communityId: string
  eventId: string
}>()

const eventDb = query(
  collectionGroup(db, 'events'),
  where('community_account', '==', props.communityId),
  where('event_id', '==', props.eventId)
)
const communityDb = query(collection(db, 'communities'), where('community_account', '==', props.communityId))
const partnerDb = collection(db, 'partners')

const state = reactive({
  event: {} as BokudeliEvent,
  community: {} as BokudeliCommunity,
  menus: [] as PartnerMenu[],
  eventSnapshot: undefined as QueryDocumentSnapshot<DocumentData> | undefined,
  members: [] as EventMember[],
  menuDisable: false as false | 'deadline' | 'limitPeople',
  isLoading: true,
})

const isDialogOpen = ref(false)
const selectedMenu = ref(null as PartnerMenu | null)

const selectMenu = (menu: PartnerMenu) => {
  selectedMenu.value = menu
  isDialogOpen.value = true
}

const showDisableAlert = (reason: 'deadline' | 'limitPeople') => {
  switch (reason) {
    case 'deadline':
      alert('注文期限をすぎました。カートに追加できません')
      break
    case 'limitPeople':
      alert('定員に達しました。カートに追加できません')
      break
  }
}

const loadEventData = async (eventDocumentSnapshot: QueryDocumentSnapshot<DocumentData> | undefined) => {
  if (!eventDocumentSnapshot) {
    return undefined
  }

  const eventData = eventDocumentSnapshot.data()
  const event = convertDocumentDataToEvent(eventData)

  const menuSnapshot = await getDocs(collection(partnerDb, event.partnerId, 'menus'))
  const menus = menuSnapshot.docs.map((doc) => convertDocumentDataToMenu(event.partnerId, doc.id, doc.data()))
  menus.sort((a, b) => (b.updatedAt?.valueOf() ?? 0) - (a.updatedAt?.valueOf() ?? 0))
  return { event, menus }
}

onMounted(async () => {
  const [eventSnapshot, communitySnapshot] = await Promise.all([getDocs(eventDb), getDocs(communityDb)])

  const communityData = communitySnapshot.docs.shift()?.data()
  if (communityData) {
    const community = convertDocumentDataToCommunity(communityData)
    state.community = community
  }

  const eventDocumentSnapshot = eventSnapshot.docs.shift()

  const [eventInfo, members] = await Promise.all([
    loadEventData(eventDocumentSnapshot),
    loadEventMembers(props.communityId, props.eventId),
  ])
  if (eventInfo) {
    state.eventSnapshot = eventDocumentSnapshot
    state.event = eventInfo.event
    state.menus = eventInfo.menus
  }
  state.members = members

  if (state.event.eventDeadline && state.event.eventDeadline < new Date()) {
    state.menuDisable = 'deadline'
  } else if (state.members.length >= state.event.eventMaxPeople) {
    state.menuDisable = 'limitPeople'
  } else {
    state.menuDisable = false
  }

  state.isLoading = false
})
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
              <v-card-title class="justify-center text-sm-h4 text-xs-h5 font-weight-semibold pb-10">
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
                【注文期限】{{ dateString(state.event.eventDeadline) }}
              </v-card-text>
              <v-card-text class="text-left pb-8 text-subtitle-1">
                【開催日時】{{ dateString(state.event.eventStartDatetime) }}
              </v-card-text>
              <v-card-text class="text-left pb-8 text-subtitle-1"> 【お店】{{ state.event.shopName }} </v-card-text>
              <v-card-text class="text-left pb-8 text-subtitle-1" style="line-height: 32px">
                【開催内容】{{ state.event.eventDescription }}
              </v-card-text>
              <v-card-text class="text-left pb-8 text-subtitle-1">
                【コロナ感染対策】
                <v-row class="justify-center">
                  <v-col class="d-flex child-flex" cols="12">
                    <v-img class="ma-2" :src="covidImage" />
                  </v-col>
                </v-row>
              </v-card-text>
              <v-card-text class="text-left pb-8 text-subtitle-1">
                【定員】{{ state.event.eventMaxPeople }} 人
              </v-card-text>
              <v-card-text class="text-left pb-8 text-subtitle-1">
                【参加人数】{{ state.members.length }} 人
              </v-card-text>
              <v-card-text class="text-left pb-10">
                <v-row>
                  <v-col
                    v-for="member in state.members"
                    :key="member.userId"
                    class="d-flex justify-start pa-2"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-row class="ma-0 d-flex align-center">
                      <router-link
                        :to="`/users/${member.userId}`"
                        class="text--primary cursor-pointer text-decoration-none"
                      >
                        <v-avatar class="ma-1" size="60">
                          <v-img :src="member.userImageUrl" />
                        </v-avatar>
                      </router-link>
                      <v-col class="ma-0 px-1">
                        <div class="d-flex align-center text-subtitle-2 font-weight-bold">
                          <div>
                            {{ member.username }}
                          </div>
                        </div>
                        <div
                          v-for="menu in member.menus"
                          :key="menu"
                          class="d-flex align-center"
                          style="font-size: 12px; color: gray"
                        >
                          <div>{{ menu }}</div>
                        </div>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-col>
          </v-row>
        </v-card>
        <v-row>
          <v-col v-for="menu in state.menus" :key="menu.id" md="4" sm="6" cols="12">
            <v-card class="mb-3 mx-0" color="text-center">
              <v-img :src="menu.imageUrl" aspect-ratio="1" cover />

              <!-- title -->
              <v-card-title class="justify-center pb-3">
                {{ menu.name }}
              </v-card-title>
              <v-card-text class="text-left pb-8">
                {{ menu.description }}
              </v-card-text>
              <v-card-text class="text-right text-h6 pb-2"> ¥ {{ menu.price }} </v-card-text>
              <v-row class="justify-center">
                <v-col class="text-center">
                  <v-btn
                    :class="`px-5 my-4 ${state.menuDisable ? 'disable-menu-button' : ''}`"
                    color="primary"
                    rounded
                    width="80%"
                    @click="state.menuDisable === false ? selectMenu(menu) : showDisableAlert(state.menuDisable)"
                  >
                    カートに追加
                  </v-btn>
                </v-col>
              </v-row>
            </v-card>
          </v-col>

          <!-- no result found -->
          <v-col v-show="!state.menus.length" cols="12" class="text-center">
            <h4 class="mt-4">メニューがありません</h4>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-row v-else class="justify-center">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>
    <event-cart-dialog
      v-if="selectedMenu && state.eventSnapshot"
      v-model="isDialogOpen"
      :menu="selectedMenu"
      :event-snapshot="state.eventSnapshot"
    ></event-cart-dialog>
  </section>
</template>
<style lang="scss" scoped>
.disable-menu-button {
  opacity: 0.4615384615;
}
</style>
