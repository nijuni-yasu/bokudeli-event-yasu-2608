<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { mdiCloseCircle, mdiSend, mdiCalendar, mdiMessageTextOutline } from '@mdi/js'
import type { NavigateToEventChatFn } from '@shokujii/base/types/profilePathResolvers.js'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import { useAppEventStore } from '@shokujii/base/composable/useAppEventStore.js'
import { useAppCommunityStore } from '@shokujii/base/composable/useAppCommunityStore.js'
import { usePartnerStore } from '@shokujii/base/stores/partner'
import { shareSnsButton, isMobileDevice } from '@shokujii/base/utils/shareSnsButton'
import CalendarAddDialog from '@shokujii/base/components/CalendarAddDialog.vue'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { convertToDatetimeWeekdayShort, convertToTimeString } from '@shokujii/common/utils/datetime.js'
import { useDisplay } from 'vuetify'

const display = useDisplay()

/** xs のみ画面幅いっぱい。sm（タブレット縦等）はコンテンツ max 520px に合わせて 560px 固定 */
const dialogWidth = computed(() => {
  if (display.xs.value) {
    return 'calc(100% - 48px)'
  }
  if (display.sm.value) {
    return 560
  }
  return 650
})

const props = withDefaults(
  defineProps<{
    eventId: string
    communityAccount: string
    isPosted: boolean
    /** Stripe Checkout からのリダイレクト時に付与される session_id。PayPay 等の遅延決済の判定に使う */
    sessionId?: string
    /** 自分の注文を抽出するためのユーザー ID。未指定の場合は処理中判定を行わない */
    userId?: string
    /** イベントチャットへ遷移するコールバック（membership 待機を含む）。user 側から注入する */
    navigateToEventChat?: NavigateToEventChatFn
    hideShareSns?: boolean
  }>(),
  {
    hideShareSns: false,
  },
)

const model = defineModel<boolean>()

const eventStore = useAppEventStore(props.eventId)
const communityStore = useAppCommunityStore(props.communityAccount)
const isPosted = props.isPosted

const event = computed(() => eventStore.event)

const eventChatTarget = computed((): { communityId: string; eventId: string } | null => {
  const currentEvent = event.value
  if (currentEvent == null) return null
  return { communityId: currentEvent.community_id, eventId: currentEvent.id }
})

const canOpenChat = computed(() => {
  const currentEvent = event.value
  if (currentEvent == null || props.userId == null || props.userId === '') return false
  return currentEvent.members.includes(props.userId)
})

const showShareLink = computed(() => {
  if (props.hideShareSns) return false
  const currentEvent = event.value
  if (currentEvent == null) return false
  return currentEvent.is_public && !isPosted && !isProcessing.value
})

const isNavigatingToChat = ref(false)

const onOpenChatClick = async () => {
  const target = eventChatTarget.value
  if (target == null || !canOpenChat.value || props.navigateToEventChat == null) {
    return
  }

  isNavigatingToChat.value = true
  try {
    const succeeded = await props.navigateToEventChat(target)
    if (succeeded && model.value) {
      model.value = false
    }
  } finally {
    isNavigatingToChat.value = false
  }
}

/** Checkout リダイレクト直後など、注文一覧が未読込の間は true（flash 表示や誤ったシェア誘導を防ぐ） */
const isLoadingOrder = computed(() => {
  if (props.userId == null || props.userId === '') return false
  if (props.sessionId == null || props.sessionId === '') return false
  return eventStore.orders == null
})

/** PayPay 遅延決済等で自分の注文が processing の間は決済処理中表示にする */
const isProcessing = computed(() => {
  if (props.sessionId == null || props.sessionId === '') return false
  if (props.userId == null || props.userId === '') return false
  if (eventStore.orders == null) return false
  return eventStore.orders.some((o) => o.user_id === props.userId && o.status === 'processing')
})

const onShareSnsButtonClicked = async (event: BokudeliEvent) => {
  const partnerStore = usePartnerStore(event.partner_id)
  const _window = !isMobileDevice() ? window.open('', '_blank', 'width=800,height=500')! : undefined
  const community = communityStore.community
  const shop = partnerStore.shops?.[0]

  if (community != null && shop != null) {
    await shareSnsButton('twitterAfterOrder', event, community, shop, _window)
    return
  }

  const [loadedCommunity, loadedShops] = await Promise.all([
    communityStore.getLoadedCommunity(),
    partnerStore.getLoadedShops(),
  ])
  await shareSnsButton('twitterAfterOrder', event, loadedCommunity, loadedShops[0]!, _window)
}
const isOpenCalendarAddDialog = ref(false)
const openCalendarAddDialog = () => {
  isOpenCalendarAddDialog.value = true
}

const isSharePromptDialogVisible = ref(false)
let hasShownSharePrompt = false

watch(
  [model, event, isProcessing, isLoadingOrder],
  async ([newModel, newEvent, , newIsLoadingOrder]) => {
    if (props.hideShareSns) {
      return
    }
    if (!newModel || newIsLoadingOrder || !newEvent?.is_public || isPosted || hasShownSharePrompt) {
      return
    }
    if (isProcessing.value) {
      return
    }
    const partnerStore = usePartnerStore(newEvent.partner_id)
    await Promise.all([new Promise<void>((resolve) => setTimeout(resolve, 1000)), partnerStore.getLoadedShops()])
    if (
      !model.value ||
      isLoadingOrder.value ||
      isProcessing.value ||
      !event.value?.is_public ||
      isPosted ||
      hasShownSharePrompt
    ) {
      return
    }
    hasShownSharePrompt = true
    isSharePromptDialogVisible.value = true
  },
  { immediate: true },
)
</script>

<template>
  <v-dialog v-model="model" :width="dialogWidth" persistent>
    <v-card v-if="event != null" class="success-join-dialog pre-line">
      <template v-if="isLoadingOrder">
        <v-card-title class="text-center d-flex justify-center py-8">
          <v-progress-circular indeterminate color="primary" />
        </v-card-title>
        <v-card-text class="text-center text-body-1 px-8 py-3">
          {{ $t('success_join_event_dialog.loading') }}
        </v-card-text>
        <v-card-text class="text-center px-8 pb-8 pt-1">
          <v-btn
            variant="outlined"
            size="small"
            rounded="pill"
            color="primary"
            :prepend-icon="mdiCloseCircle"
            @click="model = false"
          >
            {{ $t('success_join_event_dialog.close') }}
          </v-btn>
        </v-card-text>
      </template>
      <template v-else>
        <div class="success-join-dialog__header px-8 pt-8 pb-4 text-center">
          <v-card-title class="success-join-dialog__title px-0">
            {{
              isProcessing ? $t('success_join_event_dialog.processing_title') : $t('success_join_event_dialog.title')
            }}
          </v-card-title>
          <p class="success-join-dialog__subtitle mb-0">
            {{
              isProcessing
                ? $t('success_join_event_dialog.processing_subtitle')
                : $t('success_join_event_dialog.subtitle')
            }}
          </p>
        </div>

        <div class="success-join-dialog__body px-8 pb-4">
          <div class="success-join-dialog__event-content">
            <v-img
              class="success-join-dialog__cover rounded-lg"
              cover
              aspect-ratio="1.91"
              :src="eventStore.coverImageUrl"
            />
            <h2 class="success-join-dialog__event-name text-left mt-4 mb-3">
              {{ event.event_name }}
            </h2>
            <v-sheet class="success-join-dialog__details pa-3 rounded-lg" color="grey-lighten-5">
              <dl class="event-details-grid">
                <dt class="text-description">{{ $t('success_join_event_dialog.datetime') }}</dt>
                <dd class="text-description">
                  {{ convertToDatetimeWeekdayShort(event.event_start_datetime) }}〜{{
                    convertToTimeString(event.event_end_datetime)
                  }}
                </dd>
                <dt class="text-description">{{ $t('success_join_event_dialog.deadline') }}</dt>
                <dd class="text-description">
                  {{
                    $t('success_join_event_dialog.deadline_value', [
                      convertToDatetimeWeekdayShort(event.event_deadline_datetime),
                    ])
                  }}
                </dd>
                <dt class="text-description">{{ $t('success_join_event_dialog.place') }}</dt>
                <dd class="text-description">{{ event.fullAddress }} {{ event.event_place }}</dd>
                <dt class="text-description">{{ $t('success_join_event_dialog.organizer') }}</dt>
                <dd class="text-description">{{ event.community_name }}</dd>
                <dt class="text-description">{{ $t('success_join_event_dialog.food') }}</dt>
                <dd class="text-description">{{ event.shop_name }}</dd>
                <template
                  v-if="
                    !hideShareSns &&
                    typeof event.event_sns_hash_tag === 'string' &&
                    event.event_sns_hash_tag.trim() !== ''
                  "
                >
                  <dt class="text-description">{{ $t('success_join_event_dialog.hashtag') }}</dt>
                  <dd class="text-description">
                    <a
                      :href="`https://x.com/search?q=%23${event.event_sns_hash_tag}`"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      #{{ event.event_sns_hash_tag }}
                    </a>
                  </dd>
                </template>
              </dl>
            </v-sheet>
          </div>
        </div>

        <v-sheet class="success-join-dialog__footer px-8 py-5" color="grey-lighten-5" rounded="0">
          <template v-if="!isProcessing && canOpenChat">
            <p class="success-join-dialog__chat-hint text-center mb-3">
              {{ $t('success_join_event_dialog.chat_hint') }}
            </p>
            <div class="d-flex justify-center">
              <v-btn
                size="large"
                color="primary"
                class="success-join-dialog__chat-btn"
                :prepend-icon="mdiMessageTextOutline"
                rounded="pill"
                elevation="2"
                :loading="isNavigatingToChat"
                :disabled="isNavigatingToChat || navigateToEventChat == null"
                @click="onOpenChatClick"
              >
                {{ $t('chat.open_chat') }}
              </v-btn>
            </div>
          </template>

          <div class="d-flex flex-wrap justify-center align-center ga-2 mt-4 secondary-actions">
            <v-btn
              v-if="showShareLink"
              class="secondary-action-btn"
              variant="outlined"
              size="small"
              rounded="pill"
              color="primary"
              :prepend-icon="mdiSend"
              @click="onShareSnsButtonClicked(event)"
            >
              {{ $t('success_join_event_dialog.share_on_x') }}
            </v-btn>
            <v-btn
              class="secondary-action-btn"
              variant="outlined"
              size="small"
              rounded="pill"
              color="primary"
              :prepend-icon="mdiCalendar"
              @click="openCalendarAddDialog"
            >
              {{ $t('success_join_event_dialog.add_to_calendar') }}
            </v-btn>
            <v-btn
              class="secondary-action-btn"
              variant="outlined"
              size="small"
              rounded="pill"
              color="primary"
              :prepend-icon="mdiCloseCircle"
              @click="model = false"
            >
              {{ $t('success_join_event_dialog.close') }}
            </v-btn>
          </div>
        </v-sheet>
      </template>
    </v-card>
  </v-dialog>
  <calendar-add-dialog v-model="isOpenCalendarAddDialog" :event="event!" />

  <ConfirmDialog
    v-if="!hideShareSns"
    v-model="isSharePromptDialogVisible"
    :is-confirm="false"
    :persistent="false"
    :ok-click="() => event && onShareSnsButtonClicked(event)"
    :ok-text="$t('success_join_event_dialog.share_prompt_ok')"
    max-width="400px"
  >
    {{ $t('success_join_event_dialog.share_prompt') }}
  </ConfirmDialog>
</template>

<style lang="scss" scoped>
.success-join-dialog {
  overflow: hidden;
}

.success-join-dialog__title {
  font-size: 1.5rem !important;
  font-weight: 700;
  line-height: 1.3;
  white-space: normal;
}

.success-join-dialog__subtitle {
  font-size: 0.9375rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.success-join-dialog__event-content {
  width: 100%;
  max-width: 520px;
  margin-inline: auto;
  min-width: 0;
}

.success-join-dialog__event-name {
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.success-join-dialog__details {
  min-width: 0;
}

.event-details-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 0.5em;
  row-gap: 0.5rem;
  margin: 0;

  dt {
    white-space: nowrap;
  }

  dd {
    margin: 0;
    min-width: 0;
  }
}

.success-join-dialog__cover {
  display: block;
  width: 100%;
  box-shadow:
    0 1px 4px rgba(0, 0, 0, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.1);
}

.success-join-dialog__chat-hint {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.success-join-dialog__chat-btn {
  min-height: 52px;
}

.text-description {
  font-size: 14px;
  line-height: 1.5;
  text-align: left;
  margin: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.secondary-actions {
  width: 100%;
}

.secondary-action-btn {
  letter-spacing: normal;
  text-transform: none;
}
</style>
