<script setup lang="ts">
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { cancelEvent } from '@shokujii/base/apis/eventCancellation.js'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { EVENT_CANCEL_PRESET_REASONS } from '@shokujii/common/constants/eventCancellationReasons.js'
import type { BokudeliEvent } from '@shokujii/base/stores/event.js'

/** ラジオの「その他」選択時の内部値（保存・API には送らない） */
const CANCEL_REASON_OTHER = '__other__'

const props = defineProps<{
  event: BokudeliEvent | null
  eventId: string
  hasMembers: boolean
}>()

const emit = defineEmits<{
  canceled: []
}>()

const { t: $t } = useI18n()
const { show: showNotification } = useNotification()

const cancelReasonDialog = ref(false)
const cancelConfirmDialog = ref(false)
const cancelCompleteDialog = ref(false)
const supportContactDialog = ref(false)
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

const openCancelFlow = () => {
  if (props.hasMembers) {
    supportContactDialog.value = true
    return
  }
  cancelPresetSelection.value = null
  cancelReasonOtherText.value = ''
  cancelReason.value = ''
  cancelReasonDialog.value = true
}

const proceedToConfirm = () => {
  if (!canProceedToCancelConfirm.value) return
  const sel = cancelPresetSelection.value
  if (sel == null) return
  cancelReason.value = sel === CANCEL_REASON_OTHER ? cancelReasonOtherText.value.trim() : sel
  cancelReasonDialog.value = false
  cancelConfirmDialog.value = true
}

const backToCancelReason = () => {
  cancelConfirmDialog.value = false
  cancelReasonDialog.value = true
}

const executeCancelEvent = async () => {
  const e = props.event
  if (e == null) return
  isCanceling.value = true
  try {
    await cancelEvent({
      communityId: e.community_id,
      eventId: props.eventId,
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
  emit('canceled')
}

defineExpose({ openCancelFlow })
</script>

<template>
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

  <ConfirmDialog
    v-model="cancelCompleteDialog"
    :title="$t('manage.event.cancel_complete_dialog.title')"
    ok-text="OK"
    :ok-click="handleCancelCompleteOk"
    max-width="500px"
  />

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
