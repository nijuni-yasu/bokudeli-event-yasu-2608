<script setup lang="ts">
definePage({
  meta: {
    navActiveLink: '/manage/event/',
  },
})
import { useEventStore, buildEventStoreOptions, type EventStore } from '@shokujii/base/stores/event.js'
import { useCommunityStore } from '@shokujii/base/stores/community.js'
import EventCard from '@shokujii/base/components/EventCard.vue'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import CopyEventDialog from '@shokujii/base/components/manage/community/CopyEventDialog.vue'
import EventLetter from '@shokujii/base/components/manage/event/EventLetter.vue'
import EventSettings from '@shokujii/base/components/manage/event/EventSettings.vue'
import EventFlyer from '@shokujii/base/components/manage/event/EventFlyer.vue'
import EventCommunityBillAlert from '@shokujii/base/components/manage/event/EventCommunityBillAlert.vue'
import EventOverviewActionPanel from '@shokujii/base/components/manage/event/EventOverviewActionPanel.vue'
import EventCancelFlow from '@shokujii/base/components/manage/event/EventCancelFlow.vue'
import EventDeleteDialogs from '@shokujii/base/components/manage/event/EventDeleteDialogs.vue'
import EventMember from '@/components/manage/event/member.vue'
import { useCopyEventFeedback } from '@shokujii/base/composable/useCopyEventFeedback.js'
import { injectionKeyEventEditHostActive } from '@shokujii/base/components/eventcreate/symbols.js'
import {
  getEventEditPathByRawStatus,
  getEventPath,
  getManageCommunityInvoicePath,
  getManageCommunityPath,
  getManageEventPath,
} from '@/router/utils'
import { mdiArrowTopRight } from '@mdi/js'
import flyerLogo from '@/assets/images/shokujii/flyer_logo.png'
import { useEnterpriseId } from '@/composable/useEnterpriseId'

const { t: $t } = useI18n()
const router = useRouter()
const { enterpriseId } = useEnterpriseId()

const tabs = ['overview', 'member', 'letter', 'flyer', 'settings'] as const
type Tabs = (typeof tabs)[number]

const eventId = useRoute().params.eventId as string
const tabName = useRoute().params.tab as string
const eventStore = useEventStore(eventId, buildEventStoreOptions(enterpriseId.value)) as EventStore
const event = computed(() => eventStore.event)

const tab = ref<Tabs>(tabs.find((t) => t === tabName) ?? tabs[0])

const isSettingsTabActive = computed(() => tab.value === 'settings')
provide(injectionKeyEventEditHostActive, isSettingsTabActive)

const communityStore = computed(() => {
  const account = eventStore.event?.community_account
  if (account) {
    return useCommunityStore(account)
  }
  return null
})
const community = computed(() => communityStore.value?.community)

const tabItems = tabs.map((value) => ({
  value,
  text: $t(`manage.event.tabs.${value}`),
}))

const openInNew = (url: string) => {
  window.open(url, '_blank')
}

const canCancel = computed(() => {
  const status = eventStore.event?.calculatedEventStatus
  return status === 'applying_reservation' || status === 'accepting_order'
})

const canDelete = computed(
  () => eventStore.event?.event_status.value === 'in_draft' && eventStore.confirmedOrders?.length === 0,
)

const hasMembers = computed(() => (eventStore.event?.members.length ?? 0) > 0)

const {
  isOpenCopyDialog,
  isOpenCopyCompleteDialog,
  isOpenCopyErrorDialog,
  copyCompleteTitle,
  handleCopySuccess,
  handleCopyError,
  handleCopyCompleteOk,
} = useCopyEventFeedback({
  onNavigateToEvent: (id) => {
    void router.push(getManageEventPath(id))
  },
})

const deleteDialogsRef = ref<InstanceType<typeof EventDeleteDialogs> | null>(null)
const cancelFlowRef = ref<InstanceType<typeof EventCancelFlow> | null>(null)

const goToEventEdit = () => {
  const e = eventStore.event
  if (e != null) {
    void router.push(getEventEditPathByRawStatus(eventId, e.event_status.value))
  }
}

const navigateToCommunityAfterDelete = () => {
  const communityAccount = eventStore.event?.community_account
  if (communityAccount) {
    window.location.href = getManageCommunityPath(communityAccount)
  }
}

const openEventPublicPage = () => {
  const e = eventStore.event
  if (e != null) {
    openInNew(getEventPath(e.community_account, eventId))
  }
}
</script>

<template>
  <v-container class="manage-container">
    <v-row v-if="community != null" class="py-2">
      <router-link :to="getManageCommunityPath(community.community_account)">
        <div class="text-h5 ml-3 d-flex align-center justify-start text-primary">
          <v-img class="icon flex-shrink-0 me-2" cover :src="communityStore?.iconImageUrl" />
        </div>
      </router-link>
      <v-btn class="px-0" variant="text" size="small" :to="getManageCommunityPath(community.community_account)">
        {{ community?.community_name }} >
      </v-btn>
    </v-row>
    <v-row v-if="event != null">
      <v-col cols="12" class="py-0">
        <div class="text-h4 d-flex align-center justify-start">
          {{ event.event_name }}
          <v-btn
            class="ml-3"
            variant="outlined"
            size="small"
            :append-icon="mdiArrowTopRight"
            @click="openEventPublicPage"
          >
            イベントページ
          </v-btn>
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-tabs v-model="tab">
          <v-tab v-for="c in tabItems" :key="`tab_${c.value}`" :value="c.value" :to="`./${c.value}`">
            {{ c.text }}
          </v-tab>
        </v-tabs>
      </v-col>
    </v-row>
  </v-container>
  <v-row>
    <v-col cols="12">
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="overview">
          <v-container class="manage-container">
            <EventCommunityBillAlert
              :show="eventStore.event?.event_payment === 'community_bill'"
              :invoice-path="
                eventStore.event != null ? getManageCommunityInvoicePath(eventStore.event.community_account) : ''
              "
            />
            <v-row class="justify-center">
              <v-col v-if="eventStore.event != null" class="justify-center" md="4" sm="6" cols="12">
                <EventCard
                  :event="eventStore.event"
                  :members="eventStore.members ?? undefined"
                  @click="openEventPublicPage"
                />
              </v-col>
              <EventOverviewActionPanel
                :can-edit="eventStore.event != null"
                :can-delete="canDelete"
                :can-copy="eventStore.event != null"
                :can-cancel="canCancel"
                @edit="goToEventEdit"
                @delete="deleteDialogsRef?.openDeleteConfirmation()"
                @copy="isOpenCopyDialog = true"
                @cancel="cancelFlowRef?.openCancelFlow()"
              />
            </v-row>
          </v-container>
          <EventDeleteDialogs
            ref="deleteDialogsRef"
            :delete-event="() => eventStore.deleteEvent()"
            @deleted="navigateToCommunityAfterDelete"
          />
          <EventCancelFlow
            ref="cancelFlowRef"
            :event="eventStore.event"
            :event-id="eventId"
            :has-members="hasMembers"
            @canceled="navigateToCommunityAfterDelete"
          />
          <CopyEventDialog
            v-if="eventStore.event != null"
            v-model="isOpenCopyDialog"
            :community-account="eventStore.event.community_account"
            :initial-source-event="eventStore.event"
            @success="handleCopySuccess"
            @error="handleCopyError"
          />
          <ConfirmDialog
            v-model="isOpenCopyCompleteDialog"
            :title="copyCompleteTitle"
            ok-text="OK"
            :ok-click="handleCopyCompleteOk"
            max-width="500px"
          />
          <ConfirmDialog
            v-model="isOpenCopyErrorDialog"
            :title="$t('manage.copy_event_modal.error')"
            ok-text="OK"
            max-width="500px"
          />
        </v-tabs-window-item>
        <v-tabs-window-item value="member">
          <EventMember />
        </v-tabs-window-item>
        <v-tabs-window-item value="letter">
          <EventLetter />
        </v-tabs-window-item>
        <v-tabs-window-item value="flyer">
          <EventFlyer :flyer-logo-url="flyerLogo" />
        </v-tabs-window-item>
        <v-tabs-window-item value="settings">
          <EventSettings />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-col>
  </v-row>
</template>

<style scoped lang="scss">
.icon {
  height: 30px;
  aspect-ratio: 1/1;
  border-radius: 10%;
}
</style>

<route lang="yaml">
meta:
  layout: manage
</route>
