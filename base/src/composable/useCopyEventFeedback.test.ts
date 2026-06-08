import { describe, expect, it, vi } from 'vitest'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, number>) => {
      if (key === 'manage.copy_event_modal.complete') {
        return 'complete'
      }
      if (key === 'manage.copy_event_modal.success_multiple') {
        return `multiple:${params?.count ?? 0}`
      }
      if (key === 'manage.copy_event_modal.success_partial') {
        return `partial:${params?.success ?? 0}:${params?.failure ?? 0}`
      }
      return key
    },
  }),
}))

import { useCopyEventFeedback } from './useCopyEventFeedback.js'

describe('useCopyEventFeedback', () => {
  it('単発コピー成功時に complete タイトルと eventId を設定する', () => {
    const onReload = vi.fn()
    const onNavigateToEvent = vi.fn()
    const feedback = useCopyEventFeedback({ onReload, onNavigateToEvent })

    feedback.handleCopySuccess({ mode: 'single', newEventId: 'event-1' })

    expect(onReload).toHaveBeenCalledOnce()
    expect(feedback.copiedEventId.value).toBe('event-1')
    expect(feedback.copyCompleteTitle.value).toBe('complete')
    expect(feedback.isOpenCopyCompleteDialog.value).toBe(true)
  })

  it('繰り返しコピー全成功時に success_multiple タイトルを設定する', () => {
    const feedback = useCopyEventFeedback()

    feedback.handleCopySuccess({
      mode: 'repeat',
      successCount: 3,
      failureCount: 0,
      newEventIds: ['a', 'b', 'c'],
    })

    expect(feedback.copiedEventId.value).toBeNull()
    expect(feedback.copyCompleteTitle.value).toBe('multiple:3')
    expect(feedback.isOpenCopyCompleteDialog.value).toBe(true)
  })

  it('繰り返しコピー部分失敗時に success_partial タイトルを設定する', () => {
    const feedback = useCopyEventFeedback()

    feedback.handleCopySuccess({
      mode: 'repeat',
      successCount: 2,
      failureCount: 1,
      newEventIds: ['a', 'b'],
    })

    expect(feedback.copiedEventId.value).toBeNull()
    expect(feedback.copyCompleteTitle.value).toBe('partial:2:1')
  })

  it('完了 OK で onNavigateToEvent を呼ぶ', () => {
    const onNavigateToEvent = vi.fn()
    const feedback = useCopyEventFeedback({ onNavigateToEvent })

    feedback.handleCopySuccess({ mode: 'single', newEventId: 'event-42' })
    feedback.handleCopyCompleteOk()

    expect(onNavigateToEvent).toHaveBeenCalledWith('event-42')
    expect(feedback.isOpenCopyCompleteDialog.value).toBe(false)
  })

  it('エラー時にエラーダイアログを開く', () => {
    const feedback = useCopyEventFeedback()

    feedback.handleCopyError()

    expect(feedback.isOpenCopyErrorDialog.value).toBe(true)
  })
})
