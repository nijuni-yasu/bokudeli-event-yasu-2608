<script setup lang="ts">
import { useDisplay } from 'vuetify'
import { mdiPlus, mdiHelp, mdiContentCopy } from '@mdi/js'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import CopyEventDialog from '@shokujii/base/components/manage/community/CopyEventDialog.vue'
import EventCardGrid from '@shokujii/base/components/manage/shared/EventCardGrid.vue'
import { useCopyEventFeedback } from '@shokujii/base/composable/useCopyEventFeedback.js'
import { useCreateAppCommunityEventListStore } from '@shokujii/base/composable/useAppEventListStore.js'
import type { EventCreatePathResolver, ManageEventPathResolver } from '@shokujii/base/composable/managePathResolvers.js'

const props = defineProps<{
  communityAccount: string
  getEventCreatePath: EventCreatePathResolver
  getManageEventPath: ManageEventPathResolver
}>()

const createEventListStore = useCreateAppCommunityEventListStore()

const router = useRouter()
const { t: $t } = useI18n()
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

const eventListStore = createEventListStore(props.communityAccount, numOfColumns.value, { autoContinue: true })

const events = computed(
  () =>
    eventListStore.eventStores?.flatMap((s) => {
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
  onReload: () => eventListStore.reload(),
  onNavigateToEvent: (eventId) => {
    void router.push(props.getManageEventPath(eventId))
  },
})

const isOpenEventDialog = ref(false)

onMounted(() => {
  eventListStore.reload()
})
</script>

<template>
  <v-container class="manage-container">
    <v-row>
      <v-col cols="12" class="d-flex ga-4 pb-0">
        <v-btn variant="outlined" :prepend-icon="mdiPlus" @click="router.push(getEventCreatePath())">
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
        <EventCardGrid
          :events="events"
          :total-count="eventListStore.totalCount ?? Number.MAX_SAFE_INTEGER"
          :loaded-count="eventListStore.eventStores?.length ?? 0"
          :get-manage-event-path="getManageEventPath"
          @load="eventListStore.next"
        />
      </v-col>
    </v-row>
  </v-container>
  <ConfirmDialog v-model="isOpenEventDialog" :ok-text="'OK'" max-width="800px">
    <v-card-text class="text-center py-6 text-h4">
      {{ $t('event_create_modal.title') }}
    </v-card-text>
    <v-card-text class="pb-0" style="line-height: 2.4rem">
      <div v-html="$t('event_create_modal.desc')" />
    </v-card-text>
  </ConfirmDialog>
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
