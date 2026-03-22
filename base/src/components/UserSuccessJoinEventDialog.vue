<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { mdiContentCopy, mdiCloseCircle, mdiSend, mdiCalendar } from '@mdi/js'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { useEventStore } from '@shokujii/base/stores/event'
import { useCommunityStore } from '@shokujii/base/stores/community'
import { usePartnerStore } from '@shokujii/base/stores/partner'
import { shareSnsButton, isMobileDevice } from '@shokujii/base/utils/shareSnsButton'
import CalendarAddDialog from '@shokujii/base/components/CalendarAddDialog.vue'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'

const props = defineProps<{
  eventId: string
  communityAccount: string
  isPosted: boolean
}>()

const model = defineModel<boolean>()

const eventStore = useEventStore(props.eventId)
const communityStore = useCommunityStore(props.communityAccount)
const isPosted = props.isPosted

const event = computed(() => eventStore.event)

const onShareSnsButtonClicked = async (type: 'twitterAfterOrder' | 'copy', event: BokudeliEvent) => {
  const partnerStore = usePartnerStore(event.partner_id)
  const _window = type !== 'copy' && !isMobileDevice() ? window.open('', '_blank', 'width=800,height=500')! : undefined
  const community = communityStore.community
  const shop = partnerStore.shops?.[0]

  if (community != null && shop != null) {
    await shareSnsButton(type, event, community, shop, _window)
    return
  }

  const [loadedCommunity, loadedShops] = await Promise.all([
    communityStore.getLoadedCommunity(),
    partnerStore.getLoadedShops(),
  ])
  await shareSnsButton(type, event, loadedCommunity, loadedShops[0]!, _window)
}
const isOpenCalendarAddDialog = ref(false)
const openCalendarAddDialog = () => {
  isOpenCalendarAddDialog.value = true
}

const isSharePromptDialogVisible = ref(false)
let hasShownSharePrompt = false

watch(
  [model, event],
  async ([newModel, newEvent]) => {
    if (newModel && newEvent?.is_public && !isPosted && !hasShownSharePrompt) {
      hasShownSharePrompt = true
      const partnerStore = usePartnerStore(newEvent.partner_id)
      await Promise.all([new Promise<void>((resolve) => setTimeout(resolve, 1000)), partnerStore.getLoadedShops()])
      isSharePromptDialogVisible.value = true
    }
  },
  { immediate: true },
)
</script>

<template>
  <v-dialog v-model="model" :width="$vuetify.display.smAndDown ? 'auto' : 650" persistent>
    <v-card v-if="event != null" class="px-sm-15 py-sm-9 pa-2 pre-line">
      <v-card-title class="text-center text-h3">{{ $t('success_join_event_dialog.title') }}</v-card-title>
      <v-card-text class="text-center text-h5 px-0 py-3">{{ $t('success_join_event_dialog.subtitle') }}</v-card-text>
      <div class="mx-4">
        <v-img class="mx-0" cover aspect-ratio="1.91" :src="eventStore.coverImageUrl" />
        <v-card-text class="text-left pb-3 px-0 text-h5">
          {{ event.event_name }}
        </v-card-text>
        <v-card-text class="text-description pb-1 px-0">
          {{ $t('success_join_event_dialog.datetime') }}
          {{ $d(event.event_start_datetime, 'datetime_weekday_short') }}〜{{ $d(event.event_end_datetime, 'time') }}
        </v-card-text>
        <v-card-text class="text-description pb-1 px-0">
          {{ $t('success_join_event_dialog.deadline', [$d(event.event_deadline_datetime, 'datetime_weekday_short')]) }}
        </v-card-text>
        <v-card-text class="text-description pb-1 px-0">
          {{ $t('success_join_event_dialog.place') }} {{ event.fullAddress }} {{ event.event_place }}
        </v-card-text>
        <v-card-text class="text-description pb-1 px-0"
          >{{ $t('success_join_event_dialog.organizer') }} {{ event.community_name }}</v-card-text
        >
        <v-card-text class="text-description pb-1 px-0"
          >{{ $t('success_join_event_dialog.food') }} {{ event.shop_name }}</v-card-text
        >
        <v-card-text
          v-if="typeof event.event_sns_hash_tag === 'string' && event.event_sns_hash_tag.trim() !== ''"
          class="text-description pb-1 px-0"
        >
          {{ $t('success_join_event_dialog.hashtag') }}
          <a :href="`https://x.com/search?q=%23${event.event_sns_hash_tag}`" target="_blank">
            #{{ event.event_sns_hash_tag }}
          </a>
        </v-card-text>
        <v-card-text class="mt-5">
          <v-row justify="center" v-if="event.is_public && !isPosted">
            <v-btn
              class="my-2"
              size="large"
              color="grey-900"
              :append-icon="mdiSend"
              rounded="pill"
              @click="onShareSnsButtonClicked('twitterAfterOrder', event)"
            >
              {{ $t('success_join_event_dialog.share_on_x') }}
            </v-btn>
          </v-row>
          <v-row justify="center">
            <v-btn
              class="my-2"
              size="large"
              color="grey-900"
              :append-icon="mdiCalendar"
              rounded="pill"
              @click="openCalendarAddDialog"
            >
              {{ $t('success_join_event_dialog.add_to_calendar') }}
            </v-btn>
          </v-row>
        </v-card-text>
        <v-card-text class="text-center px-0 py-1">
          <v-btn
            :prepend-icon="mdiContentCopy"
            class="mx-1"
            size="small"
            color="grey-600"
            rounded="pill"
            variant="text"
            @click="onShareSnsButtonClicked('copy', event)"
          >
            {{ $t('success_join_event_dialog.copy_text') }}
          </v-btn>
          <v-btn
            :prepend-icon="mdiCloseCircle"
            class="mx-1"
            size="small"
            color="grey-600"
            rounded="pill"
            variant="text"
            @click="model = false"
          >
            {{ $t('success_join_event_dialog.close') }}
          </v-btn>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
  <calendar-add-dialog v-model="isOpenCalendarAddDialog" :event="event!" />

  <ConfirmDialog
    v-model="isSharePromptDialogVisible"
    :is-confirm="false"
    :persistent="false"
    :ok-click="() => event && onShareSnsButtonClicked('twitterAfterOrder', event)"
    :ok-text="$t('success_join_event_dialog.share_prompt_ok')"
    max-width="400px"
  >
    {{ $t('success_join_event_dialog.share_prompt') }}
  </ConfirmDialog>
</template>

<style lang="scss" scoped>
.text-lowercase {
  text-transform: lowercase;
}
.text-description {
  font-size: 14px !important;
  text-align: left !important;
}
</style>
