import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CopyEventSuccessPayload } from '@shokujii/base/components/manage/community/CopyEventDialog.vue'

export type UseCopyEventFeedbackOptions = {
  /** 単発コピー完了後のイベント詳細への遷移（path は呼び出し側で解決） */
  onNavigateToEvent?: (eventId: string) => void
  /** コピー成功後の一覧再読み込み等 */
  onReload?: () => void
}

export const useCopyEventFeedback = (options: UseCopyEventFeedbackOptions = {}) => {
  const { t: $t } = useI18n()

  const isOpenCopyDialog = ref(false)
  const isOpenCopyCompleteDialog = ref(false)
  const isOpenCopyErrorDialog = ref(false)
  const copiedEventId = ref<string | null>(null)
  const copyCompleteTitle = ref('')

  const handleCopySuccess = (payload: CopyEventSuccessPayload) => {
    options.onReload?.()

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
      options.onNavigateToEvent?.(copiedEventId.value)
    }
    isOpenCopyCompleteDialog.value = false
  }

  const handleCopyError = () => {
    isOpenCopyErrorDialog.value = true
  }

  return {
    isOpenCopyDialog,
    isOpenCopyCompleteDialog,
    isOpenCopyErrorDialog,
    copyCompleteTitle,
    copiedEventId,
    handleCopySuccess,
    handleCopyError,
    handleCopyCompleteOk,
  }
}
