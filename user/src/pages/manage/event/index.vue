<script setup lang="ts">
import { db } from '@shokujii/base/firebase.js'
import { getEventCreatePath, getManageEventPath } from '@/router/utils'
import { useCommunityStore } from '@shokujii/base/stores/community.js'
import { useCommunityListStore, type CommunityListStore } from '@shokujii/base/stores/communityList.js'
import { getAuth } from 'firebase/auth'
import { doc, orderBy, where } from 'firebase/firestore'
import { mdiContentCopy, mdiMenuDown, mdiPlus, mdiHelp } from '@mdi/js'
import { useEventListStore } from '@shokujii/base/stores/eventList.js'
import { useDisplay } from 'vuetify'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import CopyEventDialog from '@shokujii/base/components/manage/community/CopyEventDialog.vue'
import EventCardGrid from '@shokujii/base/components/manage/shared/EventCardGrid.vue'
import { useCopyEventFeedback } from '@shokujii/base/composable/useCopyEventFeedback.js'

const router = useRouter()
const display = useDisplay()
const { t: $t } = useI18n()

const numOfColumns = computed(() => {
  switch (display.name.value) {
    case 'xs':
      return 1
    case 'sm':
      return 2
    default:
      return 3
  }
})

const userId = getAuth().currentUser!.uid
const communityListStore = useCommunityListStore(
  [where('managers', 'array-contains', doc(db, 'users', userId)), orderBy('community_num_members', 'desc')],
  5,
) as CommunityListStore

const communityList = computed(() => {
  if (communityListStore.communityStores == null) {
    return null
  }
  if (communityListStore.communityStores.length !== communityListStore.totalCount) {
    communityListStore.next()
  }
  return communityListStore.communityStores.flatMap((communityStore) => communityStore.community ?? [])
})

const communityAccount = ref<string | null>(communityList.value?.[0]?.community_account ?? null)
const communityAccountForList = computed({
  get: () => [communityAccount.value],
  set: (value) => {
    communityAccount.value = value[0]
  },
})

watch(communityList, (list) => {
  if (communityAccount.value == null && list != null && list.length > 0) {
    communityAccount.value = list[0].community_account
  }
})
const community = computed(() =>
  communityAccount.value == null ? null : useCommunityStore(communityAccount.value).community,
)

const eventListStore = computed(() =>
  useEventListStore(
    [where('community_account', '==', communityAccount.value), orderBy('event_start_datetime', 'desc')],
    numOfColumns.value,
  ),
)

const events = computed(
  () =>
    eventListStore.value.eventStores?.flatMap((s) => {
      if (s.event == null) {
        return []
      }
      return { event: s.event, members: s.members ?? [] }
    }) ?? [],
)

const {
  isOpenCopyDialog,
  isOpenCopyCompleteDialog,
  isOpenCopyErrorDialog,
  copyCompleteTitle,
  handleCopySuccess,
  handleCopyError,
  handleCopyCompleteOk,
} = useCopyEventFeedback({
  onReload: () => eventListStore.value.reload(),
  onNavigateToEvent: (eventId) => {
    void router.push(getManageEventPath(eventId))
  },
})

const isOpenEventDialog = ref(false)
</script>

<template>
  <v-row v-if="communityListStore.totalCount === 0">
    <v-col cols="12" class="text-h5 ml-15">
      <div v-html="$t('manage.event.no_community')" />
    </v-col>
  </v-row>
  <v-row v-if="communityAccount != null">
    <v-col cols="12" class="buttons">
      <v-menu v-if="community != null && communityList != null">
        <template #activator="{ props }">
          <v-btn v-bind="props">
            <span>{{ community.community_name }}</span>
            <v-icon :icon="mdiMenuDown" />
          </v-btn>
        </template>
        <v-list v-model:selected="communityAccountForList" :mandatory="true" active-class="active">
          <v-list-item v-for="item in communityList" :key="item.community_id" :value="item.community_account">
            <v-list-item-title>{{ item.community_name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-btn variant="outlined" :prepend-icon="mdiPlus" @click="router.push(getEventCreatePath(communityAccount))">{{
        $t('manage.new_event')
      }}</v-btn>
      <v-btn
        v-if="events.length > 0"
        variant="outlined"
        :prepend-icon="mdiContentCopy"
        @click="isOpenCopyDialog = true"
      >
        {{ $t('manage.copy_event') }}
      </v-btn>
      <v-btn variant="outlined" size="small" :icon="mdiHelp" @click="isOpenEventDialog = true" />
    </v-col>
  </v-row>
  <v-row v-if="communityAccount != null && eventListStore.totalCount === 0">
    <v-col cols="12" class="text-h5">
      <div v-html="$t('manage.event.no_events')" />
    </v-col>
  </v-row>
  <EventCardGrid
    v-if="communityAccount != null"
    class="mb-2"
    :events="events"
    :total-count="eventListStore.totalCount ?? Number.MAX_SAFE_INTEGER"
    :loaded-count="eventListStore.eventStores?.length ?? 0"
    col-md="3"
    col-sm="6"
    col-lg="3"
    :get-manage-event-path="getManageEventPath"
    @load="eventListStore.next"
  />
  <ConfirmDialog v-model="isOpenEventDialog" :ok-text="'OK'" max-width="800px">
    <v-card-text class="text-center py-6 text-h4">
      {{ $t('event_create_modal.title') }}
    </v-card-text>
    <v-card-text class="pb-0" style="line-height: 2.4rem">
      <div v-html="$t('event_create_modal.desc')" />
    </v-card-text>
  </ConfirmDialog>
  <CopyEventDialog
    v-if="communityAccount != null"
    :key="communityAccount"
    v-model="isOpenCopyDialog"
    :community-account="communityAccount"
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
</template>

<style lang="scss" scoped>
.buttons {
  display: flex;
  gap: 16px;
}
</style>

<route lang="yaml">
meta:
  layout: manage
</route>
