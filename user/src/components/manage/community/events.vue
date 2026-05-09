<script setup lang="ts">
import { where, orderBy } from 'firebase/firestore'
import { useI18n } from 'vue-i18n'
import { useEventListStore } from '@shokujii/base/stores/eventList.js'
import EventCard from '@shokujii/base/components/EventCard.vue'
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'
import { useDisplay } from 'vuetify'
import { mdiPlus, mdiHelp, mdiContentCopy } from '@mdi/js'
import { getEventCreatePath, getManageEventPath } from '@/router/utils'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import CopyEventDialog, { type CopyEventSuccessPayload } from './CopyEventDialog.vue'

const route = useRoute()
const router = useRouter()
const { t: $t } = useI18n()

const communityAccount = route.params.communityAccount as string

const display = useDisplay()

const numOfColumns = computed(() => {
  switch (display.name.value) {
    case 'xs':
      return 1
    case 'sm':
      return 2
    case 'md':
      return 3
    default:
      return 4
  }
})

const eventListStore = useEventListStore(
  [where('community_account', '==', communityAccount), orderBy('event_start_datetime', 'desc')],
  numOfColumns.value,
)
const events = computed(
  () =>
    eventListStore.eventStores?.flatMap((s) => {
      if (s.event == null) {
        return []
      } else {
        return { event: s.event, members: s.members ?? [] }
      }
    }) ?? [],
)
const isOpenEventDialog = ref(false)
const isOpenCopyDialog = ref(false)
const isOpenCopyCompleteDialog = ref(false)
const isOpenCopyErrorDialog = ref(false)
const copiedEventId = ref<string | null>(null)
const copyCompleteTitle = ref('')

const handleCopySuccess = (payload: CopyEventSuccessPayload) => {
  eventListStore.reload()
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

onMounted(() => {
  eventListStore.reload()
})
</script>

<template>
  <v-container class="manage-container">
    <v-row>
      <v-col cols="12" class="d-flex ga-4 pb-0">
        <v-btn variant="outlined" :prepend-icon="mdiPlus" @click="router.push(getEventCreatePath(communityAccount))">
          {{ $t('manage.new_event') }}
        </v-btn>
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
    <v-row class="justify-center">
      <v-col cols="12" sm="12" md="12" class="pt-0">
        <v-row v-show="eventListStore.eventStores?.length === 0" class="pt-4">
          <v-col cols="12" class="text-h5">
            <div v-html="$t('manage.event.no_events')" />
          </v-col>
        </v-row>
        <v-row>
          <v-col v-for="({ event, members }, i) of events" :key="`item_${i}`" cols="12" sm="6" md="4" lg="3">
            <router-link v-if="event != null" :to="{ path: getManageEventPath(event.event_id) }">
              <EventCard class="event-card" :event="event" :members="members" />
            </router-link>
          </v-col>
        </v-row>
        <v-row v-show="events.length ?? 0 !== 0">
          <v-col cols="12" class="text-center">
            <IncrementalLoader
              class="my-5"
              :total-count="eventListStore.totalCount ?? Number.MAX_SAFE_INTEGER"
              :loaded-count="eventListStore.eventStores?.length ?? 0"
              @load="eventListStore.next()"
            />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
  <confirm-dialog v-model="isOpenEventDialog" :ok-text="'OK'" max-width="800px">
    <v-card-text class="text-center py-6 text-h4">
      {{ $t('event_create_modal.title') }}
    </v-card-text>
    <v-card-text class="pb-0" style="line-height: 2.4rem">
      <div v-html="$t('event_create_modal.desc')" />
    </v-card-text>
  </confirm-dialog>
  <CopyEventDialog
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

<style scoped lang="scss">
.event-card {
  height: 100%;
  width: 100%;
  min-height: 300px;
}
</style>
