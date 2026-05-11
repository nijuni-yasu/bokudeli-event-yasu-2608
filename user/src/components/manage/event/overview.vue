<script setup lang="ts">
import { useEventStore, type EventStore } from '@shokujii/base/stores/event.js'
import EventCard from '@shokujii/base/components/EventCard.vue'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import CopyEventDialog, { type CopyEventSuccessPayload } from '@/components/manage/community/CopyEventDialog.vue'
import {
  getEventEditPathByRawStatus,
  getEventPath,
  getManageCommunityPath,
  getManageCommunityInvoicePath,
  getManageEventPath,
} from '@/router/utils'
import { mdiPencil, mdiDelete, mdiFilePdfBox, mdiContentCopy, mdiCancel } from '@mdi/js'
import { cancelEvent } from '@shokujii/base/apis/eventCancellation.js'
import { useNotification } from '@shokujii/base/composable/notification'
import { useI18n } from 'vue-i18n'
import { EVENT_CANCEL_PRESET_REASONS } from '@shokujii/common/constants/eventCancellationReasons.js'

/** ラジオの「その他」選択時の内部値（保存・API には送らない） */
const CANCEL_REASON_OTHER = '__other__'

const router = useRouter()
const route = useRoute()
const { t: $t } = useI18n()
const { show: showNotification } = useNotification()

const eventId = route.params.eventId as string

const eventStore = useEventStore(eventId) as EventStore
const deleteConfirmationDialog = ref(false)
const deleteCompleteDialog = ref(false)
const isOpenCopyDialog = ref(false)
const isOpenCopyCompleteDialog = ref(false)
const isOpenCopyErrorDialog = ref(false)
const copiedEventId = ref<string | null>(null)
const copyCompleteTitle = ref('')

const handleCopySuccess = (payload: CopyEventSuccessPayload) => {
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
    void router.push(getManageEventPath(copiedEventId.value))
  }
}

const handleCopyError = () => {
  isOpenCopyErrorDialog.value = true
}

// キャンセル関連の状態
const cancelReasonDialog = ref(false)
const cancelConfirmDialog = ref(false)
const cancelCompleteDialog = ref(false)
const supportContactDialog = ref(false)
/** 確定後に Callable に渡す最終文字列（確認ダイアログ以降） */
const cancelReason = ref('')
const cancelPresetSelection = ref<string | null>(null)
const cancelReasonOtherText = ref('')
const isCanceling = ref(false)

const canProceedToCancelConfirm = computed(() => {
  const sel = cancelPresetSelection.value
  if (sel == null) return false
  if (sel === CANCEL_REASON_OTHER) {
    return cancelReasonOtherText.value.trim().length >= 1
  }
  return true
})

const canCancel = computed(() => {
  const status = eventStore.event?.calculatedEventStatus
  return status === 'applying_reservation' || status === 'accepting_order'
})

const hasMembers = computed(() => (eventStore.event?.members.length ?? 0) > 0)

const deleteEvent = async () => {
  await eventStore.deleteEvent()
  deleteConfirmationDialog.value = false
  deleteCompleteDialog.value = true
}

const handleDeleteCompleteOk = () => {
  const communityAccount = eventStore.event?.community_account
  if (communityAccount) {
    window.location.href = getManageCommunityPath(communityAccount)
  }
}

const openInNew = (url: string) => {
  window.open(url, '_blank')
}

const goToEventEdit = () => {
  const e = eventStore.event
  if (e != null) {
    void router.push(getEventEditPathByRawStatus(eventId, e.event_status.value))
  }
}

// キャンセルボタン押下時
const handleCancelClick = () => {
  if (hasMembers.value) {
    supportContactDialog.value = true
  } else {
    cancelPresetSelection.value = null
    cancelReasonOtherText.value = ''
    cancelReason.value = ''
    cancelReasonDialog.value = true
  }
}

// キャンセル理由入力 → 確認ダイアログへ
const proceedToConfirm = () => {
  if (!canProceedToCancelConfirm.value) return
  const sel = cancelPresetSelection.value
  if (sel == null) return
  cancelReason.value = sel === CANCEL_REASON_OTHER ? cancelReasonOtherText.value.trim() : sel
  cancelReasonDialog.value = false
  cancelConfirmDialog.value = true
}

// 確認ダイアログ → キャンセル理由入力に戻る
const backToCancelReason = () => {
  cancelConfirmDialog.value = false
  cancelReasonDialog.value = true
}

// キャンセル実行
const executeCancelEvent = async () => {
  const e = eventStore.event
  if (e == null) return
  isCanceling.value = true
  try {
    await cancelEvent({
      communityId: e.community_id,
      eventId,
      cancelReason: cancelReason.value,
    })
    cancelConfirmDialog.value = false
    cancelCompleteDialog.value = true
  } catch {
    showNotification($t('manage.event.cancel_failed'), 'error')
  } finally {
    isCanceling.value = false
  }
}

const handleCancelCompleteOk = () => {
  const communityAccount = eventStore.event?.community_account
  if (communityAccount) {
    window.location.href = getManageCommunityPath(communityAccount)
  }
}
</script>

<template>
  <v-container class="manage-container">
    <v-row v-if="eventStore.event?.event_payment === 'community_bill'" class="justify-center mb-2">
      <v-col md="12" sm="12" cols="12">
        <v-alert variant="tonal" color="primary" :icon="mdiFilePdfBox" density="comfortable">
          <div class="text-subtitle-1 font-weight-bold mb-1">
            {{ $t('manage.event.community_bill_notice.title') }}
          </div>
          <div class="text-body-2" v-html="$t('manage.event.community_bill_notice.description')" />
          <div class="d-flex align-center flex-wrap mt-3">
            <span class="text-body-2 me-2">{{ $t('manage.event.community_bill_notice.link_label') }}</span>
            <v-btn
              variant="outlined"
              size="small"
              color="primary"
              :prepend-icon="mdiFilePdfBox"
              :to="getManageCommunityInvoicePath(eventStore.event.community_account)"
            >
              {{ $t('manage.event.community_bill_notice.link_button') }}
            </v-btn>
          </div>
        </v-alert>
      </v-col>
    </v-row>
    <v-row class="justify-center">
      <v-col v-if="eventStore.event != null" class="justify-center" md="4" sm="6" cols="12">
        <!-- <router-link :to="getEventPath(eventStore.event.community_account, eventStore.event.event_id)"> -->
        <EventCard
          :event="eventStore.event"
          :members="eventStore.members ?? undefined"
          @click="openInNew(getEventPath(eventStore.event.community_account, eventId))"
        />
        <!-- </router-link> -->
      </v-col>
      <v-col md="4" sm="6" cols="12" class="justify-center">
        <v-row>
          <v-btn
            class="ma-3"
            variant="outlined"
            :prepend-icon="mdiPencil"
            :disabled="eventStore.event == null"
            @click="goToEventEdit"
          >
            {{ $t('manage.event.edit') }}
          </v-btn>
        </v-row>
        <v-row>
          <v-btn
            v-if="eventStore.event?.event_status.value === 'in_draft' && eventStore.confirmedOrders?.length === 0"
            class="ma-3"
            variant="outlined"
            :prepend-icon="mdiDelete"
            @click="deleteConfirmationDialog = true"
          >
            {{ $t('manage.event.delete') }}
          </v-btn>
        </v-row>
        <v-row>
          <v-btn
            v-if="eventStore.event != null"
            class="ma-3"
            variant="outlined"
            :prepend-icon="mdiContentCopy"
            @click="isOpenCopyDialog = true"
          >
            {{ $t('manage.copy_event') }}
          </v-btn>
        </v-row>
        <v-row>
          <v-btn
            v-if="canCancel"
            class="ma-3"
            variant="outlined"
            color="grey-400"
            :prepend-icon="mdiCancel"
            @click="handleCancelClick"
          >
            {{ $t('manage.event.cancel') }}
          </v-btn>
        </v-row>
      </v-col>
    </v-row>
  </v-container>

  <!-- 削除確認ダイアログ -->
  <v-dialog v-model="deleteConfirmationDialog" max-width="600px">
    <v-card class="pa-2">
      <v-card-title>
        {{ $t('manage.event.dialog.title') }}
      </v-card-title>
      <v-card-text>
        {{ $t('manage.event.dialog.description') }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="deleteConfirmationDialog = false">
          {{ $t('cancel') }}
        </v-btn>
        <v-btn variant="tonal" @click="deleteEvent">
          {{ $t('manage.event.dialog.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <ConfirmDialog
    v-model="deleteCompleteDialog"
    :title="$t('manage.event.dialog.complete')"
    ok-text="OK"
    :ok-click="handleDeleteCompleteOk"
    max-width="500px"
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

  <!-- キャンセル理由入力ダイアログ -->
  <v-dialog v-model="cancelReasonDialog" max-width="600px">
    <v-card class="pa-4">
      <v-card-title>
        {{ $t('manage.event.cancel_reason_dialog.title') }}
      </v-card-title>
      <v-card-text>
        <p class="text-body-2 mb-2">{{ $t('manage.event.cancel_reason_dialog.instruction') }}</p>
        <v-radio-group v-model="cancelPresetSelection" hide-details="auto" class="mb-2">
          <v-radio v-for="preset in EVENT_CANCEL_PRESET_REASONS" :key="preset" :value="preset" :label="preset" />
          <v-radio :value="CANCEL_REASON_OTHER" :label="$t('manage.event.cancel_reason_dialog.other')" />
        </v-radio-group>
        <v-textarea
          v-if="cancelPresetSelection === CANCEL_REASON_OTHER"
          v-model="cancelReasonOtherText"
          class="mt-2"
          :placeholder="$t('manage.event.cancel_reason_dialog.other_placeholder')"
          :rules="[(v: string) => v.trim().length >= 1 || $t('manage.event.cancel_reason_dialog.error_other_required')]"
          auto-grow
          rows="5"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="cancelReasonDialog = false">
          {{ $t('cancel') }}
        </v-btn>
        <v-btn variant="tonal" color="error" :disabled="!canProceedToCancelConfirm" @click="proceedToConfirm">
          {{ $t('manage.event.cancel_reason_dialog.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- キャンセル確認ダイアログ -->
  <v-dialog v-model="cancelConfirmDialog" max-width="600px">
    <v-card class="pa-2">
      <v-card-title>
        {{ $t('manage.event.cancel_confirm_dialog.title') }}
      </v-card-title>
      <v-card-text>
        {{ $t('manage.event.cancel_confirm_dialog.description') }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="backToCancelReason">
          {{ $t('manage.event.cancel_confirm_dialog.no') }}
        </v-btn>
        <v-btn variant="tonal" color="error" :loading="isCanceling" @click="executeCancelEvent">
          {{ $t('manage.event.cancel_confirm_dialog.yes') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- キャンセル完了ダイアログ -->
  <ConfirmDialog
    v-model="cancelCompleteDialog"
    :title="$t('manage.event.cancel_complete_dialog.title')"
    ok-text="OK"
    :ok-click="handleCancelCompleteOk"
    max-width="500px"
  />

  <!-- 参加者あり時のサポート案内ダイアログ -->
  <v-dialog v-model="supportContactDialog" max-width="600px">
    <v-card class="pa-2">
      <v-card-title class="py-5">
        {{ $t('manage.event.cancel_support_dialog.title') }}
      </v-card-title>
      <v-card-text class="text-pre-wrap">
        {{ $t('manage.event.cancel_support_dialog.description') }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="supportContactDialog = false">
          {{ $t('close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
