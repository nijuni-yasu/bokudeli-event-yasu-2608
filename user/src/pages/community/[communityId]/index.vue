<script setup lang="ts">
import { useRouter } from 'vue-router'
import { getEventPath, getEventCreatePath } from '@/router/utils'
import { dateWithDayOfWeekString, dateOnlyTimeString } from '@/schemes/converter'
import CommunityContactDialog from '@/components/CommunityContactDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import LoginDialog from '@/components/LoginDialog.vue'
import { useStoreStoredUser } from '@/stores/storedUser'
import { useCommunityStore, type CommunityStore } from '@/stores/community'

const props = defineProps<{
  communityId: string
}>()
const router = useRouter()

const communityStore = useCommunityStore(props.communityId) as CommunityStore

const isManager = ref(false)
communityStore.isManager().then((result) => {
  isManager.value = result
})

const events = computed(() => {
  const isManager = communityStore.isManager
  const isMember = communityStore.isMember
  return communityStore.events?.flatMap((event) => {
    // 「コミュマネでない」かつ「注文受付中でない」場合は非表示
    if (!isManager && (event.event_status.value == 'in_draft' || event.event_status.value == 'applying_reservation')) {
      return []
    }
    // 「コミュマネでもメンバーでもない」かつ「限定公開」の場合は非表示
    if (!isManager && !isMember && event.is_public == false) {
      return []
    }
    return event
  }) ?? []
})

const state = reactive({
  links: [] as string[],
})

const goToEvents = (eventId: string) => {
  const path = getEventPath(props.communityId, eventId)
  router.push({ path })
}

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
</script>
<template>
  <section>
    <v-row v-if="communityStore.community != null" class="justify-center">
      <!-- community main -->
      <v-col cols="12" md="9" sm="9">
        <v-card flat class="align-center justify-center text-center my-10 pa-md-16 pa-sm-8 pa-xs-0">
          <v-row>
            <v-col>
              <VImg class="ma-0" aspect-ratio="1.91" cover :src="communityStore.community.communityCoverImageUrl" />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-card-title class="justify-center text-h4 pb-6">{{ communityStore.community.communityName }}</v-card-title>
              <v-card-text v-linkify class="text-left text-subtitle-1 pb-6">
                {{ communityStore.community.communityDescription }}
              </v-card-text>
            </v-col>
          </v-row>
        </v-card>

        <!-- community event list -->
        <v-row>
          <!-- community description -->
          <v-col md="4" sm="6" cols="12">
            <v-card class="pa-5" color="text-center">
              <!-- community title and links -->
              <v-img style="border-radius: 10px" aspect-ratio="1" cover :src="communityStore.community.communityIconImageUrl" />
              <v-card-title class="justify-center text-h5 py-5 pre-line">
                {{ communityStore.community.communityName }}
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
                <community-contact-dialog v-model="isOpenContactDialogVisible" :community-name="communityStore.community.communityName" :community-id="communityStore.community.communityId"/>
                <confirm-dialog v-model="isOpenConfirmDialog" :is-confirm="true" :ok-click="openLoginDialog">
                  ログインした後にお問い合わせしてください。
                </confirm-dialog>
                <login-dialog v-model="isOpenLoginDialog" />
              </v-col>
              <!-- community manager -->
              <v-card-title v-if="communityStore.managers?.length ?? 0 > 0" class="justify-center text-h6 mt-10">コミュニケーター</v-card-title>
              <div v-for="manager in communityStore.managers" :key="manager.user_id">
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
              <div v-for="member in communityStore.members" :key="member.user_id">
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
          <v-col md="8" sm="6" cols="12">
            <v-row>
              <v-col v-for="event in events" :key="event.event_id" md="6" sm="12" cols="12">
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
                  v-if="isManager"
                  class="justify-end my-2 mr-1"
                >
                  <v-btn
                    v-if="event.event_status.value===`in_draft`"
                    class="ml-1"
                    color="white"
                    elevation="5"
                    size="small"
                    rounded
                    prepend-icon="mdi-email"
                    :to="{ path: getEventCreatePath(communityStore.community.communityAccount), query: { id: event.event_id, step:4} }"
                  >
                    予約
                  </v-btn>                
                  <v-btn
                    v-if="event.event_status.value===`in_draft`"
                    class="ml-1"
                    color="white"
                    elevation="5"
                    size="small"
                    rounded
                    prepend-icon="mdi-pencil-box-outline"
                    :to="{ path: getEventCreatePath(communityStore.community.communityAccount), query: { id: event.event_id} }"
                  >
                    編集
                  </v-btn>
                  <v-btn
                    v-if="event.event_status.value=='applying_reservation'||event.event_status.value=='accepting_order'||event.event_status.value=='order_closed'"
                    class="ml-1"
                    color="white"
                    elevation="5"
                    size="small"
                    rounded
                    prepend-icon="mdi-pencil-box-outline"
                    :to="{ path: getEventCreatePath(communityStore.community.communityAccount), query: { id: event.event_id, step:3} }"
                  >
                    編集
                  </v-btn>                  
                </v-row>
              </v-col>
            </v-row>
            <v-row v-if="isManager" class="justify-center">
              <v-col class="text-center">
                <v-btn
                  class="mx-2 my-10 text-lg-h5"
                  color="white"
                  elevation="5"
                  size="x-large"
                  rounded
                  width="85%"
                  prepend-icon="mdi-pencil-box-outline"
                  :to="getEventCreatePath(communityStore.community.communityAccount)"
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
