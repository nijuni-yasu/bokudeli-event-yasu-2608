<script setup lang="ts">
import { useRouter } from 'vue-router'
import { db } from '@/firebase'
import { collection, collectionGroup, getDocs, orderBy, query, where } from 'firebase/firestore'
import { getEventPath, getEventCreatePath } from '@/router/utils'
import { dateWithDayOfWeekString, dateOnlyTimeString ,convertDocumentDataToCommunity, convertDocumentDataToEvent } from '@/schemes/converter'
import BokudeliCommunity from '@/schemes/bokudeliCommunity'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { loadCommunityMembers } from '@/composable/loadCommunityMembers'
import { loadCommunityManagers } from '@/composable/loadCommunityManagers'
import { checkCommunityManager } from '@/composable/checkCommunityManager'
import { FirestoredUser } from '@/schemes/storedUser'
import CommunityContactDialog from '@/components/CommunityContactDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import LoginDialog from '@/components/LoginDialog.vue'
import { useStoreStoredUser } from '@/stores/storedUser'

const props = defineProps<{
  communityId: string
}>()

const state = reactive({
  community: {} as BokudeliCommunity,
  members: [] as FirestoredUser[],
  managers: [] as FirestoredUser[],
  links: [] as string[],
  events: [] as BokudeliEvent[],
  isLoading: true,
  isCommunityManager: false,
})

const router = useRouter()
const goToEvents = (eventId: string) => {
  const path = getEventPath(props.communityId, eventId)
  router.push({ path })
}

const communityDb = query(collection(db, 'communities'), where('community_account', '==', props.communityId))
const eventDb = query(
  collectionGroup(db, 'events'),
  where('community_account', '==', props.communityId),
  where('is_public', '==', true),
  orderBy('event_start_datetime', 'desc'),
)

const isOpenContactDialogVisible = ref(false)
const isOpenConfirmDialog = ref(false)
const isOpenLoginDialog = ref(false)

// コミュニティへの問い合わせはログイン必須
const userStore = useStoreStoredUser()
const openContactDialog = () => {
  if(!userStore.storedUser){
    isOpenConfirmDialog.value = true
  } else {
    isOpenContactDialogVisible.value = true
  }
}
const openLoginDialog = () => {
  isOpenLoginDialog.value = true
}

onMounted(async () => {
  const communitiesSnapshot = await getDocs(communityDb)
  const communitySnapshot = communitiesSnapshot.docs.shift()
  if (communitySnapshot) {
    const communityData = communitySnapshot.data()
    const community = convertDocumentDataToCommunity(communityData)
    state.community = community

    const links = [] as string[]
    community.communitySns.officialsite && links.push(community.communitySns.officialsite)
    community.communitySns.twitter && links.push(community.communitySns.twitter)
    community.communitySns.facebook && links.push(community.communitySns.facebook)
    community.communitySns.instagram && links.push(community.communitySns.instagram)
    state.links = links

    state.members = await loadCommunityMembers(communitySnapshot.ref)
    state.managers = await loadCommunityManagers(communitySnapshot.ref)
    // ログインしてるユーザーがコミュニティマネージャーかどうかチェック
    state.isCommunityManager = await checkCommunityManager(communitySnapshot.ref)
  }

  const eventSnapshot = await getDocs(eventDb)
  state.events = eventSnapshot.docs.flatMap((doc) => {
    const event = convertDocumentDataToEvent(doc.data())
    if (!state.isCommunityManager && event.event_status.value !== 'accepting_order') {
      return []
    }
    return event
  })
  state.isLoading = false
})

</script>
<template>
  <section>
    <v-row v-if="!state.isLoading" class="justify-center">
      <!-- community main -->
      <v-col cols="12" md="9" sm="9">
        <v-card flat class="align-center justify-center text-center my-10 pa-10">
          <v-row>
            <v-col>
              <VImg class="ma-0" aspect-ratio="1.91" cover :src="state.community.communityCoverImageUrl" />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-card-title class="justify-center text-h4 pb-6">{{ state.community.communityName }}</v-card-title>
              <v-card-text v-linkify class="text-left text-subtitle-1 pb-6">
                {{ state.community.communityDescription }}
              </v-card-text>
            </v-col>
          </v-row>
        </v-card>

        <!-- community event list -->
        <v-row>
          <!-- community description -->
          <v-col md="4" sm="4" cols="12">
            <v-card class="pa-5" color="text-center">
              <!-- community title and links -->
              <v-img style="border-radius: 10px" aspect-ratio="1" cover :src="state.community.communityIconImageUrl" />
              <v-card-title class="justify-center text-h5 py-5 pre-line">
                {{ state.community.communityName }}
              </v-card-title>
              <v-card-text v-for="link in state.links" :key="link" class="text-left pb-3">
                <a v-if="link" :href="link" class="text-decoration-none" target="_blank">
                  {{ link }}
                </a>
              </v-card-text>
              <v-col>
                <v-btn
                  class="ma-1"
                  variant="outlined"
                  rounded
                  prepend-icon="mdi-email"
                  color="primary"
                  width="100%"
                  @click="openContactDialog"
                >
                  お問い合わせ
                </v-btn>
                <community-contact-dialog v-model="isOpenContactDialogVisible" :community-name="state.community.communityName" :community-id="state.community.communityId"/>
                <confirm-dialog v-model="isOpenConfirmDialog" :is-confirm="true" :ok-click="openLoginDialog">
                  ログインした後にお問い合わせしてください。
                </confirm-dialog>
                <login-dialog v-model="isOpenLoginDialog" />
              </v-col>
              <!-- community manager -->
              <v-card-title v-if="state.managers.length>0" class="justify-center text-h6 mt-10">コミュニケーター</v-card-title>
              <div v-for="manager in state.managers" :key="manager.user_id">
                <router-link :to="`/users/${manager.user_id}`">
                  <v-row>
                    <div class="d-flex flex-row px-6 py-2">
                      <v-avatar size="40px">
                        <v-img v-if="manager.user_image_url" :src="manager.user_image_url" cover/>
                      </v-avatar>
                      <div class="ma-2 text-subtitle-1">{{ manager.user_name }}</div>
                    </div>
                  </v-row>
                </router-link>
              </div>

              <!-- community member -->
              <v-card-title class="justify-center text-h6 mt-7">メンバー</v-card-title>
              <div v-for="member in state.members" :key="member.user_id">
                <router-link :to="`/users/${member.user_id}`">
                  <v-row>
                    <div class="d-flex flex-row px-6 py-2">
                      <v-avatar size="40px">
                        <v-img v-if="member.user_image_url" :src="member.user_image_url" cover/>
                      </v-avatar>
                      <div class="ma-2 text-subtitle-1">{{ member.user_name }}</div>
                    </div>
                  </v-row>
                </router-link>
              </div>
            </v-card>
          </v-col>
          <!-- events -->
          <v-col md="8" sm="8" cols="12">
            <v-row>
              <v-col v-for="event in state.events" :key="event.event_id" md="6" sm="6" cols="12">
                <v-card class="mx-0" color="text-color cursor-pointer" @click="goToEvents(event.event_id)">
                  <v-img cover aspect-ratio="1.91" :src="event.event_cover_url" />
                  <v-chip class="ma-2" color="primary" elevated flat>
                    {{ $t(`event_status.${event.event_status.value}`) }}
                  </v-chip>
                  <v-card-title class="justify-center text-h5 pb-3 pre-line">
                    {{ event.event_name }}
                  </v-card-title>
                  <v-card-text class="text-left pb-2"> 【主催者】 {{ event.community_name }} </v-card-text>
                  <v-card-text class="text-left pb-2">
                    【開催日時】{{ dateWithDayOfWeekString(event.event_start_datetime) }}〜{{ dateOnlyTimeString(event.event_end_datetime) }}
                  </v-card-text>
                  <v-card-text class="text-left pb-2">
                    【注文期限】{{ dateWithDayOfWeekString(event.event_deadline_datetime) }}
                  </v-card-text>
                  <v-card-text class="text-left pb-2"> 【開催場所】{{ event.event_address }} </v-card-text>
                  <v-card-text class="text-left pb-2"> 【お店】 {{ event.shop_name }} </v-card-text>
                  <v-card-text class="text-left pb-8"> 【定員】{{ event.event_max_people }} 人</v-card-text>
                </v-card>
                <v-row
                  v-if="event.event_status.value===`in_draft`&&state.isCommunityManager"
                  class="justify-end my-2 mr-1"
                >
                  <v-btn
                    color="grey-900"
                    elevation="10"
                    rounded
                    prepend-icon="mdi-pencil-box-outline"
                    :to="{ path: getEventCreatePath(state.community.communityAccount), query: { id: event.event_id} }"
                  >
                    イベント編集
                  </v-btn>
                </v-row>
              </v-col>
            </v-row>
            <v-row v-if="state.isCommunityManager" class="justify-center">
              <v-col class="text-center">
                <v-btn
                  class="mx-2 my-10 text-lg-h5"
                  color="grey-900"
                  elevation="10"
                  size="x-large"
                  rounded
                  width="85%"
                  prepend-icon="mdi-pencil-box-outline"
                  :to="getEventCreatePath(state.community.communityAccount)"
                >
                  イベントを新規作成する
                </v-btn>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-row v-else class="justify-center">
      <v-progress-circular indeterminate color="primary" />
    </v-row>
  </section>
</template>
<style lang="scss" scoped></style>
