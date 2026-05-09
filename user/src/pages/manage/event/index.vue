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
import { useI18n } from 'vue-i18n'
import EventCard from '@shokujii/base/components/EventCard.vue'
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import CopyEventDialog, { type CopyEventSuccessPayload } from '@/components/manage/community/CopyEventDialog.vue'

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
const isOpenEventDialog = ref(false)
const isOpenCopyDialog = ref(false)
const isOpenCopyCompleteDialog = ref(false)
const isOpenCopyErrorDialog = ref(false)
const copiedEventId = ref<string | null>(null)
const copyCompleteTitle = ref('')

const handleCopySuccess = (payload: CopyEventSuccessPayload) => {
  eventListStore.value.reload()
  if (payload.mode === 'single') {
    copiedEventId.value = payload.newEventId
    copyCompleteTitle.value = $t('manage.copy_event_modal.complete')
  } else {
    copiedEventId.value = null
    if (payload.failureCount === 0) {
      copyCompleteTitle.value = $t('manage.copy_event_modal.success_multiple', { count: payload.successCount })
    } else {
      copyCompleteTitle.value = $t('manage.copy_event_modal.success_partial', {
        success: payload.successCount,
        failure: payload.failureCount,
      })
    }
  }
  isOpenCopyCompleteDialog.value = true
}

const handleCopyCompleteOk = () => {
  if (copiedEventId.value != null) {
    router.push(getManageEventPath(copiedEventId.value))
  }
}

const handleCopyError = () => {
  isOpenCopyErrorDialog.value = true
}
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
  <v-row class="mb-2">
    <v-col
      v-for="{ event, members } in events"
      :key="`popular_${event.event_id}`"
      md="3"
      sm="6"
      cols="12"
      class="content"
    >
      <router-link :to="getManageEventPath(event.event_id)">
        <EventCard class="event-card" :event="event" :members="members" />
      </router-link>
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="12" class="text-center">
      <IncrementalLoader
        :total-count="eventListStore.totalCount ?? Number.MAX_SAFE_INTEGER"
        :loaded-count="eventListStore.eventStores?.length ?? 0"
        @load="eventListStore.next"
      />
    </v-col>
  </v-row>
  <confirm-dialog v-model="isOpenEventDialog" :ok-text="'OK'" max-width="800px">
    <v-card-text class="text-center py-6 text-h4">
      {{ $t('event_create_modal.title') }}
    </v-card-text>
    <v-card-text class="pb-0" style="line-height: 2.4rem">
      <div v-html="$t('event_create_modal.desc')" />
    </v-card-text>
  </confirm-dialog>
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
.event-card {
  height: 100%;
  width: 100%;
}

.buttons {
  display: flex;
  gap: 16px;
}
</style>

<route lang="yaml">
meta:
  layout: manage
</route>
