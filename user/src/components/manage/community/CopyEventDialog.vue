<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  convertToDateString,
  getStartOfDay,
  isInShopTime,
  parseDatetimeStrings,
} from '@shokujii/common/utils/datetime.js'
import { eventCopy } from '@shokujii/base/apis/eventCopy.js'
import EventList from '@shokujii/base/components/EventList.vue'
import DateInput from '@shokujii/base/components/DateInput.vue'
import { useNotification } from '@shokujii/base/composable/notification'
import type { BokudeliEvent } from '@shokujii/base/stores/event.js'
import { BokudeliPartnerShop, usePartnerStore } from '@shokujii/base/stores/partner'

defineProps<{
  communityAccount: string
}>()

const dialog = defineModel<boolean>()

const emit = defineEmits<{
  success: [newEventId: string]
}>()

const { t: $t } = useI18n()
const notification = useNotification()

const selectedEvent = ref<BokudeliEvent | null>(null)
const isCreating = ref(false)

// 日付の状態管理
const targetDateTime = ref<number | null>(null)

// 元イベントの開始時刻から、その日の0時からのオフセット（ミリ秒）を取得する
const eventStartTimeOffset = computed<number>(() => {
  const originalStartDateTime = selectedEvent.value?.event_start_datetime
  if (originalStartDateTime == null) {
    return 0
  }
  return originalStartDateTime - getStartOfDay(originalStartDateTime)
})

const targetDateTimeString = computed<string | null>({
  get: () => {
    if (targetDateTime.value == null) {
      return null
    }
    return convertToDateString(targetDateTime.value)
  },
  set: (value) => {
    if (value == null) {
      targetDateTime.value = null
      return
    }
    // 日付変更時にも元イベントの時刻を保持する
    targetDateTime.value = parseDatetimeStrings(value, null, null) + eventStartTimeOffset.value
  },
})

// null は読み込み中、undefined は店舗なし
const selectedShop = computed<BokudeliPartnerShop | null | undefined>(() => {
  const partnerId = selectedEvent.value?.partner_id
  if (partnerId == null) {
    return undefined
  }
  const partnerStore = usePartnerStore(partnerId)
  return partnerStore.shops?.find((s) => s.shop_id === selectedEvent.value?.shop_id) ?? null
})

// イベント選択時または店舗情報読み込み完了時に、14日後以降で直近の営業日をデフォルト選択する
const MIN_DAYS_AHEAD = 14
const MAX_SEARCH_DAYS = 7

watch([selectedEvent, selectedShop], ([event, shop]) => {
  const originalStartDateTime = event?.event_start_datetime
  if (originalStartDateTime == null || shop == null) {
    return
  }

  const offset = eventStartTimeOffset.value
  const searchStart = getStartOfDay(Date.now() + MIN_DAYS_AHEAD * 24 * 60 * 60 * 1000)
  const oneDay = 24 * 60 * 60 * 1000

  for (let i = 0; i < MAX_SEARCH_DAYS; i++) {
    const candidateTime = getStartOfDay(searchStart + i * oneDay) + offset
    if (isInShopTime(candidateTime, shop)) {
      targetDateTime.value = candidateTime
      return
    }
  }

  // 該当する営業日が見つからなかった場合設定しない
  targetDateTime.value = null
})

// v-date-picker の allowed-dates 関数
const allowedDates = (date: unknown) => {
  if (!(date instanceof Date)) {
    // 想定外の型の場合、この関数は機能しないので、全ての日付を許可する
    return true
  }
  if (date.getTime() < Date.now()) {
    return false
  }
  const shop = selectedShop.value
  if (shop === undefined || selectedEvent.value?.event_start_datetime == null) {
    return false
  }
  if (shop === null) {
    // 読み込み中は全ての日付を許可
    return true
  }
  const targetTime = getStartOfDay(date.getTime()) + eventStartTimeOffset.value
  return isInShopTime(targetTime, shop)
}

// イベント選択時の処理
const handleEventClick = (event: BokudeliEvent) => {
  selectedEvent.value = event
}

// イベント作成処理
const createEvents = async () => {
  isCreating.value = true
  try {
    if (selectedEvent.value === null || targetDateTime.value === null) {
      return
    }

    const result = await eventCopy({
      srcEventId: selectedEvent.value.event_id,
      startTime: targetDateTime.value,
    })

    emit('success', result.data.newEventId)
  } catch (error: any) {
    console.error('Error creating events:', error)
    notification.show($t('manage.copy_event_modal.error'), 'error')
  } finally {
    dialog.value = false
    isCreating.value = false
  }
}

// モーダルを閉じる
const closeDialog = () => {
  selectedEvent.value = null
  targetDateTime.value = null
  dialog.value = false
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    :max-width="$vuetify.display.smAndDown ? '95vw' : '800px'"
    :fullscreen="$vuetify.display.xs"
    scrollable
    persistent
  >
    <v-card>
      <v-card-title class="text-h4 pa-6">
        {{ $t('manage.copy_event_modal.title') }}
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-8" style="max-height: 70vh">
        <!-- イベント選択セクション -->
        <div class="mb-6">
          <h3 class="text-h5 mb-4">{{ $t('manage.copy_event_modal.select_original') }}</h3>
          <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 4px">
            <EventList
              :community-account="communityAccount"
              :selected-event-id="selectedEvent?.event_id"
              @click="handleEventClick"
            />
          </div>
        </div>

        <!-- 単発コピー設定 -->
        <div class="mb-6">
          <h3 class="text-h5 mb-4">{{ $t('manage.copy_event_modal.select_target_date') }}</h3>
          <DateInput
            v-model="targetDateTimeString"
            :label="$t('manage.copy_event_modal.target_date')"
            :allowed-dates="allowedDates"
          />
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" :loading="isCreating" @click="closeDialog">
          {{ $t('cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="createEvents"
          :disabled="selectedEvent === null || targetDateTimeString === null"
          :loading="isCreating"
        >
          {{ $t('manage.copy_event_modal.create_button') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
