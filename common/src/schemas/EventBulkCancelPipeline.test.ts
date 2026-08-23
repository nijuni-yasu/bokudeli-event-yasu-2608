import { describe, expect, it } from 'vitest'
import { EventBulkCancelPipeline } from './EventBulkCancelPipeline.js'

describe('EventBulkCancelPipeline.isPostProcessingIncomplete', () => {
  const completeBase = {
    shop_mail_sent_at: 1,
    participant_mails_sent_at: 1,
    stripe_refunds_done_at: 1,
    participant_user_ids: ['u1'],
    side_effects_user_ids: ['u1'],
    friend_history_removed_at: 1,
  }

  it('returns false when all post-processing steps are done', () => {
    const pipeline = new EventBulkCancelPipeline('bulk_cancel', completeBase)
    expect(pipeline.isPostProcessingIncomplete).toBe(false)
  })

  it('returns true when side_effects_user_ids is missing a participant', () => {
    const pipeline = new EventBulkCancelPipeline('bulk_cancel', {
      ...completeBase,
      side_effects_user_ids: [],
    })
    expect(pipeline.isPostProcessingIncomplete).toBe(true)
  })

  it('returns true when friend_history_removed_at is unset with participants', () => {
    const pipeline = new EventBulkCancelPipeline('bulk_cancel', {
      ...completeBase,
      friend_history_removed_at: undefined,
    })
    expect(pipeline.isPostProcessingIncomplete).toBe(true)
  })
})
