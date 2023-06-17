<script setup lang="ts">
import memberList from '@/assets/examples/memberList'
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
  isLoading: true,
})

const isDialogOpen = ref(false)
const selectedMenu = ref(null as PartnerMenu | null)

const selectMenu = (menu: PartnerMenu) => {
  selectedMenu.value = menu
  isDialogOpen.value = true
}

onMounted(async () => {
  const [eventSnapshot, communitySnapshot] = await Promise.all([getDocs(eventDb), getDocs(communityDb)])

  const eventDocumentSnapshot = eventSnapshot.docs.shift()
  if (eventDocumentSnapshot) {
    state.eventSnapshot = eventDocumentSnapshot

    const eventData = eventDocumentSnapshot.data()
    const event = convertDocumentDataToEvent(eventData)
    state.event = event

    const menuSnapshot = await getDocs(collection(partnerDb, event.partnerId, 'menus'))
    const menus = menuSnapshot.docs.map((doc) => convertDocumentDataToMenu(event.partnerId, doc.id, doc.data()))
    state.menus = menus
  }

  const communityData = communitySnapshot.docs.shift()?.data()
  if (communityData) {
    const community = convertDocumentDataToCommunity(communityData)
    state.community = community
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
                  :to="`/community/${state.event.communityAccount}`"
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
                        {{ state.event.communityName }}
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
                【最大人数】{{ state.event.eventMaxPeople }} 人
              </v-card-text>
              <v-card-text class="text-left pb-10">
                <v-row>
                  <v-col
                    v-for="data in memberList"
                    :key="data.avatar"
                    class="d-flex justify-start pa-2"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                      <v-row class="ma-0 d-flex align-center">
                        <router-link :to="`/users/${data.id}`" class="text--primary cursor-pointer text-decoration-none">
                          <v-avatar class="ma-1" size="60">
                            <v-img :src="data.avatar"></v-img>
                          </v-avatar>
                        </router-link>
                        <v-col class="ma-0 px-1">
                          <div class="d-flex align-center text-subtitle-2 font-weight-bold">
                            <div>
                              {{ data.name }}
                            </div>
                          </div>
                          <div class="d-flex align-center" style="font-size:12px; color:gray;">
                            <div>
                              日替わり弁当(1)
                            </div>
                          </div>
                          <div class="d-flex align-center" style="font-size:12px; color:gray;">
                            <div>
                              サラダ(1)
                            </div>
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
                  <v-btn class="px-5 my-4" color="primary" rounded width="80%" @click="selectMenu(menu)">
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
      v-model="isDialogOpen"
      :menu="selectedMenu"
      :event-snapshot="state.eventSnapshot"
    ></event-cart-dialog>
  </section>
</template>
<style lang="scss" scoped></style>
