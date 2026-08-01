<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getEventPath, getManageCommunityPath, getLogin } from '@/router/utils'
import CommunityContactDialog from '@shokujii/base/components/CommunityContactDialog.vue'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import {
  useEnterpriseCommunityMemberFlags,
  useEnterpriseCommunityStore,
} from '@/composable/useEnterpriseCommunityStore'

import CommunityBioPanel from '@shokujii/base/components/CommunityBioPanel.vue'
import EventCard from '@shokujii/base/components/EventCard.vue'
import type { EventStore, BokudeliEventMember } from '@shokujii/base/stores/event.js'
import { useEventListStore } from '@shokujii/base/stores/eventList'
import { where, orderBy } from 'firebase/firestore'
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'
import { getCommunityAlbumItemStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { convertStoragePathToURL } from '@shokujii/base/utils/storage.js'
import PublicAlbumGallery from '@shokujii/base/components/PublicAlbumGallery.vue'
import { useEnterpriseId } from '@/composable/useEnterpriseId'
import { useEnterpriseTenantGuard } from '@/composable/useEnterpriseTenantGuard'
import EnterpriseErrorPage from '@/components/EnterpriseErrorPage.vue'

const router = useRouter()
const communityAccount = useRoute().params.communityAccount as string
const { t: $t } = useI18n()
const { enterpriseId } = useEnterpriseId()
if (enterpriseId.value == null) {
  throw new Error('Enterprise is not resolved')
}

const communityStore = useEnterpriseCommunityStore(communityAccount)

const communityEnterpriseId = computed(() => communityStore.community?.enterprise_id)
const { isTenantMismatch } = useEnterpriseTenantGuard([communityEnterpriseId])

const userStore = useCurrentUserStore()

const { isMember, isManager } = useEnterpriseCommunityMemberFlags(communityAccount)

// イベントリストストアを作成（ページサイズ6件）
const eventListStore = computed(() =>
  useEventListStore(
    [
      where('enterprise_id', '==', enterpriseId.value),
      where('community_account', '==', communityAccount),
      orderBy('event_start_datetime', 'desc'),
    ],
    6,
  ),
)

type EventWithMembers = {
  eventStore: EventStore
  members: BokudeliEventMember[]
}

const events = computed<EventWithMembers[]>(() => {
  return (
    eventListStore.value.eventStores?.flatMap((eventStore) => {
      const event = eventStore.event
      if (!event) return []
      // キャンセルされたイベントは非表示
      if (event.isCanceled()) {
        return []
      }
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
      return { eventStore, members: eventStore.members ?? [] }
    }) ?? []
  )
})

const goToEvents = (eventId: string) => {
  const path = getEventPath(communityAccount, eventId)
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

/** 表示順は communityStore.community の community_album_item_ids（store の albumItems で反映） */
const albumSlides = computed(() => {
  const cid = communityStore.community?.community_id
  if (cid == null) return []
  return (communityStore.albumItems ?? []).map((item) => ({
    src: convertStoragePathToURL(getCommunityAlbumItemStoragePath(cid, item.id)),
    title: item.album_caption,
  }))
})
</script>

<template>
  <EnterpriseErrorPage v-if="isTenantMismatch" variant="not_found" />
  <section v-else>
    <v-row v-if="communityStore.community != null" class="justify-center">
      <!-- community main -->
      <v-col cols="12" md="9" sm="9">
        <v-row v-if="isManager" class="justify-end align-center mt-lg-5">
          <v-btn
            class="mx-2 mt-2"
            variant="outlined"
            :to="getManageCommunityPath(communityStore.community.community_account)"
          >
            {{ $t('user.community_management') }}
          </v-btn>
          <v-chip v-if="communityStore.community.is_approved === false" color="primary" size="large">
            {{ $t('community.applying') }}
          </v-chip>
        </v-row>
        <v-card flat class="align-center justify-center text-center my-8 pa-md-15 pa-sm-8 pa-xs-0">
          <PublicAlbumGallery
            :cover-url="communityStore.coverImageUrl ?? ''"
            :cover-title="communityStore.community.community_name"
            :albums="albumSlides"
          />
          <v-row>
            <v-col>
              <h1
                class="justify-center pt-6 pb-6 text-sm-h2 text-h4 font-weight-black text-wrap"
                style="line-height: 1.3"
              >
                {{ communityStore.community.community_name }}
              </h1>
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
            <v-row>
              <v-col
                v-for="eventWithMembers in events"
                :key="eventWithMembers.eventStore.event?.event_id"
                md="6"
                sm="12"
                cols="12"
              >
                <EventCard
                  v-if="eventWithMembers.eventStore.event"
                  :event="eventWithMembers.eventStore.event"
                  :members="eventWithMembers.members"
                  class="mx-0 cursor-pointer"
                  @click="goToEvents(eventWithMembers.eventStore.event.event_id)"
                />
              </v-col>
              <v-col cols="12">
                <v-row class="justify-center">
                  <v-col cols="auto">
                    <IncrementalLoader
                      :loaded-count="eventListStore.eventStores?.length ?? 0"
                      :total-count="eventListStore.totalCount ?? Number.MAX_SAFE_INTEGER"
                      @load="eventListStore.next()"
                    />
                  </v-col>
                </v-row>
              </v-col>
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
      {{ $t('community.contact_after_login') }}
    </confirm-dialog>
  </section>
</template>
