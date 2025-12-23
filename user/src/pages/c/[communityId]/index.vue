<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  getEventPath,
  getEventEditShopNoticePath,
  getEventCreatePath,
  getManageCommunitySettingsPath,
  getEventEditBasicPath,
  getEventEditDetailsPath,
  getLogin,
} from '@/router/utils'
import CommunityContactDialog from '@shokujii/base/components/CommunityContactDialog.vue'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { useCommunityStore, type CommunityStore } from '@shokujii/base/stores/community'
import { mdiPencilBoxOutline, mdiCog, mdiEmail } from '@mdi/js'
import CommunityBioPanel from '@shokujii/base/components/CommunityBioPanel.vue'
import EventCard from '@shokujii/base/components/EventCard.vue'
import { useEventStore } from '@shokujii/base/stores/event'
import type { EventStore, BokudeliEvent, BokudeliEventMember } from '@shokujii/base/stores/event.js'
import { useCommunityMemberFlags } from '@shokujii/base/composable/useCommunityMemberFlags'

const router = useRouter()
const communityId = useRoute().params.communityId as string

const communityStore = useCommunityStore(communityId) as CommunityStore

const userStore = useCurrentUserStore()

const { isMember, isManager } = useCommunityMemberFlags(communityId)

type EventWithMembers = {
  event: BokudeliEvent
  members: BokudeliEventMember[]
}

const events = computed<EventWithMembers[] | null>(() => {
  const events = communityStore.events
  if (!events) return null

  // 読み込み中は null として扱う
  return events.flatMap((event) => {
    // 「コミュマネでない」かつ「参加受付中でない」場合は非表示
    if (
      isManager.value === false &&
      (event.event_status.value === 'in_draft' || event.event_status.value === 'applying_reservation')
    ) {
      return []
    }
    // 「コミュマネでもメンバーでもない」かつ「限定公開」の場合は非表示
    if (isManager.value === false && isMember.value === false && event.is_public === false) {
      return []
    }
    const eventStore = useEventStore(event.event_id) as EventStore
    return { event, members: eventStore.members ?? [] }
  })
})

const goToEvents = (eventId: string) => {
  const path = getEventPath(communityId, eventId)
  router.push({ path })
}

const isOpenContactDialogVisible = ref(false)
const isOpenConfirmDialog = ref(false)

const openContactDialog = () => {
  if (userStore.firebaseUser == null) {
    isOpenConfirmDialog.value = true
  } else {
    isOpenContactDialogVisible.value = true
  }
}
const login = () => {
  router.push(getLogin())
}
</script>

<template>
  <section>
    <v-row v-if="communityStore.community != null" class="justify-center">
      <!-- community main -->
      <v-col cols="12" md="9" sm="9">
        <v-row v-if="isManager" class="justify-end align-center mt-lg-5">
          <v-btn
            v-if="communityStore.community.is_approved"
            class="mx-2"
            color="white"
            elevation="5"
            rounded="pill"
            :prepend-icon="mdiPencilBoxOutline"
            :to="getEventCreatePath(communityStore.community.community_account)"
          >
            イベント新規作成
          </v-btn>
          <v-btn
            class="mx-2"
            color="white"
            elevation="5"
            rounded="pill"
            :prepend-icon="mdiCog"
            :to="getManageCommunitySettingsPath(communityStore.community.community_account)"
          >
            コミュニティ設定
          </v-btn>
          <v-chip v-if="communityStore.community.is_approved === false" color="primary" size="large"> 申請中 </v-chip>
        </v-row>
        <v-card flat class="align-center justify-center text-center my-8 pa-md-15 pa-sm-8 pa-xs-0">
          <v-row>
            <v-col>
              <VImg class="ma-0" aspect-ratio="1.91" cover :src="communityStore.community.community_cover_image_url" />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-card-title class="justify-center text-h3 pb-6 text-wrap">{{
                communityStore.community.community_name
              }}</v-card-title>
              <v-card-text v-linkify class="text-left pb-6">
                {{ communityStore.community.community_desc }}
              </v-card-text>
            </v-col>
          </v-row>
        </v-card>

        <!-- community event list -->
        <v-row>
          <!-- community description -->
          <v-col md="4" sm="5" cols="12" class="order-2 order-sm-1">
            <community-bio-panel
              :community="communityStore.community"
              :members="communityStore.members"
              @click-contact="openContactDialog"
            />
          </v-col>
          <!-- events -->
          <v-col md="8" sm="7" cols="12" class="order-1 order-sm-2">
            <v-row v-if="events != null">
              <v-col v-for="eventWithMembers in events" :key="eventWithMembers.event.event_id" md="6" sm="12" cols="12">
                <EventCard
                  :event="eventWithMembers.event"
                  :members="eventWithMembers.members"
                  class="mx-0 cursor-pointer"
                  @click="goToEvents(eventWithMembers.event.event_id)"
                />
                <v-row v-if="isManager" class="justify-end my-2 mr-1">
                  <v-btn
                    v-if="eventWithMembers.event.event_status.value === `in_draft`"
                    class="ml-1"
                    color="white"
                    elevation="5"
                    size="small"
                    rounded="pill"
                    :prepend-icon="mdiEmail"
                    :to="getEventEditShopNoticePath(eventWithMembers.event.event_id)"
                  >
                    予約
                  </v-btn>
                  <v-btn
                    v-if="
                      eventWithMembers.event.calculatedEventStatus === 'in_draft' ||
                      eventWithMembers.event.calculatedEventStatus === 'applying_reservation' ||
                      eventWithMembers.event.calculatedEventStatus === 'accepting_order' ||
                      eventWithMembers.event.calculatedEventStatus === 'order_closed' ||
                      eventWithMembers.event.calculatedEventStatus === 'full'
                    "
                    class="ml-1"
                    color="white"
                    elevation="5"
                    size="small"
                    rounded="pill"
                    :prepend-icon="mdiPencilBoxOutline"
                    :to="
                      eventWithMembers.event.event_status.value === 'in_draft'
                        ? getEventEditBasicPath(eventWithMembers.event.event_id)
                        : getEventEditDetailsPath(eventWithMembers.event.event_id)
                    "
                  >
                    編集
                  </v-btn>
                </v-row>
              </v-col>
            </v-row>
            <v-row v-else class="justify-center">
              <v-progress-circular indeterminate color="primary" />
            </v-row>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-row v-else class="justify-center">
      <v-progress-circular indeterminate color="primary" />
    </v-row>
    <community-contact-dialog
      v-if="communityStore.community"
      v-model="isOpenContactDialogVisible"
      :community-name="communityStore.community.community_name"
      :community-id="communityStore.community.community_id"
    />
    <confirm-dialog v-model="isOpenConfirmDialog" :is-confirm="true" :ok-click="login">
      ログインした後にお問い合わせしてください。
    </confirm-dialog>
  </section>
</template>
