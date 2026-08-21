import { DateTime } from 'luxon'
import { z } from 'zod'
import { TimestampSchema, EpochMillisSchema } from './firebase/index.js'

const nowMillis = () => DateTime.now().toMillis()

const EventBulkCancelPipelineDbSchema = z.object({
  // 一括中止トランザクションで canceled にした注文 id（後処理再開時に個別キャンセル分と区別するためのスナップショット）
  bulk_canceled_order_ids: z.array(z.string().nonempty()),
  // 一括中止時点の参加者 user_id（注文は canceled 済みのため再取得では復元できない）
  participant_user_ids: z.array(z.string()),
  // applyOrderCanceledSideEffects 済みの user_id（チェックポイント）
  side_effects_user_ids: z.array(z.string()),
  shop_mail_sent_at: TimestampSchema.optional(),
  participant_mails_sent_at: TimestampSchema.optional(),
  stripe_refunds_done_at: TimestampSchema.optional(),
  friend_history_removed_at: TimestampSchema.optional(),
  enterprise_order_cancel_audit_done: z.boolean(),
  enterprise_event_auto_cancel_audit_done: z.boolean(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
})

const EventBulkCancelPipelineAppSchema = z.object({
  bulk_canceled_order_ids: z.array(z.string().nonempty()).default([]),
  participant_user_ids: z.array(z.string()).default([]),
  side_effects_user_ids: z.array(z.string()).default([]),
  shop_mail_sent_at: EpochMillisSchema.optional(),
  participant_mails_sent_at: EpochMillisSchema.optional(),
  stripe_refunds_done_at: EpochMillisSchema.optional(),
  friend_history_removed_at: EpochMillisSchema.optional(),
  enterprise_order_cancel_audit_done: z.boolean().default(false),
  enterprise_event_auto_cancel_audit_done: z.boolean().default(false),
})

const convertToDb = (pipeline: EventBulkCancelPipeline) => {
  return {
    ...pipeline,
    created_at: EpochMillisSchema.default(nowMillis()).parse(pipeline.created_at),
    updated_at: nowMillis(),
  }
}

/**
 * イベント一括中止（cancelEventBulkCore / 最小催行自動中止）の後処理チェックポイント。
 * communities/{communityId}/events/{eventId}/system/bulk_cancel に保存する。
 */
export class EventBulkCancelPipeline {
  readonly id: string
  bulk_canceled_order_ids!: string[]
  participant_user_ids!: string[]
  side_effects_user_ids!: string[]
  shop_mail_sent_at?: number
  participant_mails_sent_at?: number
  stripe_refunds_done_at?: number
  friend_history_removed_at?: number
  enterprise_order_cancel_audit_done!: boolean
  enterprise_event_auto_cancel_audit_done!: boolean
  created_at: number
  updated_at: number

  constructor(id: string, src: Partial<EventBulkCancelPipeline>) {
    Object.assign(this, EventBulkCancelPipelineAppSchema.parse(src))
    this.id = id
    this.created_at = EpochMillisSchema.default(nowMillis()).parse(src.created_at)
    this.updated_at = EpochMillisSchema.default(nowMillis()).parse(src.updated_at)
  }

  /** 後処理（メール送信・Stripe 返金など）が完了していないか（true なら resume 対象） */
  get isPostProcessingIncomplete(): boolean {
    return (
      this.shop_mail_sent_at == null || this.participant_mails_sent_at == null || this.stripe_refunds_done_at == null
    )
  }

  isValidForDatabase(): boolean {
    return EventBulkCancelPipelineDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof EventBulkCancelPipelineDbSchema> {
    return EventBulkCancelPipelineDbSchema.parse(convertToDb(this))
  }
}
