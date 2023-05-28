<script setup lang="ts">
import memberList from '@/assets/examples/memberList'
import { db } from '@/firebase'
import { collection, collectionGroup, getDocs, query, where } from 'firebase/firestore'
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

type Props = {
  communityId: string
  eventId: string
}
const props = defineProps<Props>()

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
  isLoading: true,
})

onMounted(async () => {
  const [eventSnapshot, communitySnapshot] = await Promise.all([getDocs(eventDb), getDocs(communityDb)])
  const eventData = eventSnapshot.docs.shift()?.data()
  const communityData = communitySnapshot.docs.shift()?.data()
  if (eventData) {
    const event = convertDocumentDataToEvent(eventData)
    state.event = event

    const menuSnapshot = await getDocs(collection(partnerDb, event.partnerId, 'menus'))
    const menus = menuSnapshot.docs.map((doc) => convertDocumentDataToMenu(event.partnerId, doc.id, doc.data()))
    state.menus = menus
  }
  if (communityData) {
    const community = convertDocumentDataToCommunity(communityData)
    state.community = community
  }
  state.isLoading = false
})

const isDialogOpen = ref(false)
const selectedMenu = ref(null as PartnerMenu | null)

const selectMenu = (menu: PartnerMenu) => {
  selectedMenu.value = menu
  isDialogOpen.value = true
}
</script>

<template>
  <section>
    <v-row v-if="state.isLoading === false" class="justify-center">
      <v-col md="9" sm="9" cols="12">
        <v-card flat class="align-center justify-center text-center my-10 pa-10">
          <v-row>
            <v-col>
              <v-img class="ma-0" cover aspect-ratio="1.91" :src="state.event.eventCoverUrl"> </v-img>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-card-title class="justify-center text-h4 font-weight-semibold pb-10">
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
                    <div class="ml-2">
                      <div style="font-size: 14px">【主催者】</div>
                      <div style="font-size: 24px">
                        {{ state.event.communityName }}
                      </div>
                    </div>
                  </v-row>
                </router-link>
              </v-card-text>
              <v-card-text class="text-left pb-5"> 【開催場所】{{ state.event.eventAddress }} </v-card-text>
              <v-card-text class="text-left pb-5">
                【注文期限】{{ dateString(state.event.eventDeadline) }}
              </v-card-text>
              <v-card-text class="text-left pb-5">
                【開催日時】{{ dateString(state.event.eventStartDatetime) }}
              </v-card-text>
              <v-card-text class="text-left pb-5"> 【お店】{{ state.event.shopName }} </v-card-text>
              <v-card-text class="text-left pb-5">
                【開催内容】<br />
                {{ state.event.eventDescription }}
              </v-card-text>
              <v-card-text class="text-left pb-5">
                【コロナ感染対策】
                <v-row class="justify-center">
                  <v-col class="d-flex child-flex" cols="12">
                    <v-img class="ma-5" :src="covidImage" />
                  </v-col>
                </v-row>
              </v-card-text>
              <v-card-text class="text-left pb-5"> 【最大人数】{{ state.event.eventMaxPeople }} </v-card-text>
              <v-card-text class="text-left pb-10">
                【参加者】
                <v-row>
                  <v-col
                    v-for="data in memberList"
                    :key="data.avatar"
                    class="d-flex justify-start px-0 pt-2 pb-0"
                    cols="3"
                  >
                    <router-link :to="`/users/${data.id}`" class="text--primary cursor-pointer text-decoration-none">
                      <v-row class="ma-1">
                        <v-avatar class="ml-2 mt-2" size="50">
                          <img :src="data.avatar" />
                        </v-avatar>
                        <div class="d-flex align-center flex-wrap flex-grow-1 ml-2">
                          <div>
                            {{ data.name }}
                          </div>
                        </div>
                      </v-row>
                    </router-link>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-col>
          </v-row>
        </v-card>
        <v-row>
          <v-col v-for="menu in state.menus" :key="menu.id" md="4" sm="6" cols="12">
            <v-card class="mb-3 mx-0" color="text-center cursor-pointer">
              <v-img :src="menu.imageUrl" aspect-ratio="1"></v-img>

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
                  <v-btn class="mt-2 mb-2" x-large color="primary" rounded outlined @click="selectMenu(menu)">
                    カートの追加
                  </v-btn>
                </v-col>
              </v-row>
            </v-card>
          </v-col>

          <!-- no result found -->
          <v-col v-show="!state.menus.length" cols="12" class="text-center">
            <h4 class="mt-4">Search result not found!!</h4>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-row v-else class="justify-center">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>
    <event-cart-dialog v-model="isDialogOpen" :menu="selectedMenu"></event-cart-dialog>
  </section>
</template>
<style lang="scss" scoped></style>
