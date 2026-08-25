/**
 * Event write 用 discriminatedUnion（H1: App write strict + Db flat 寛容）。
 *
 * @see documents/08_エンタープライズ/30_リファクタ計画/05_WS-C_C-1_PoC設計.md
 */
import { z } from 'zod'
import { Event } from './Event.js'
import { EpochMillisSchema } from './firebase/index.js'

/** partnerCompat fixture と整合する write コア（EventAppSchema 非 export のためここで定義） */
export const EventWriteCoreAppSchema = z.object({
  community_id: z.string().nonempty(),
  community_name: z.string().nonempty(),
  community_account: z.string().nonempty(),
  created_by: z.string().nonempty(),
  event_postalcode: z.string().regex(/^\d{7}$/),
  event_address_base: z.string().nonempty(),
  event_start_datetime: EpochMillisSchema,
  event_end_datetime: EpochMillisSchema,
  event_deadline_datetime: EpochMillisSchema,
  partner_id: z.string().nonempty(),
  shop_id: z.string().nonempty(),
  shop_name: z.string().nonempty(),
  event_name: z.string().nonempty(),
  event_max_people: z.number().int().positive(),
  organizer_fullname: z.string(),
  organizer_company: z.string(),
  organizer_email: z.string(),
  organizer_phone_personal: z.string(),
  organizer_memo: z.string(),
  is_public: z.boolean(),
  is_deleted: z.boolean(),
  members: z.array(z.string()),
  created_at: EpochMillisSchema,
})

export type EventWriteCoreApp = z.infer<typeof EventWriteCoreAppSchema>

export const PfEventPaymentSchema = z.enum(['user_advance', 'user_on_day', 'community_bill'])

/** Enterprise 書き込み分支 */
export const EnterpriseEventWriteAppSchema = EventWriteCoreAppSchema.extend({
  event_payment: z.literal('enterprise_subsidy'),
  enterprise_id: z.string().nonempty(),
})

/** enterprise draft 出口で検証する判別フィールド（下書き未完了時のコア未入力は許容） */
export const EnterpriseEventWriteDiscriminantSchema = EnterpriseEventWriteAppSchema.pick({
  event_payment: true,
  enterprise_id: true,
})

const PfEventWriteBaseSchema = EventWriteCoreAppSchema.extend({
  event_payment: PfEventPaymentSchema,
  enterprise_id: z.null().optional(),
  members_visible_min_count: z.number().int().positive().optional(),
})

/** PF 書き込み分支 */
export const PfEventWriteAppSchema = PfEventWriteBaseSchema

/** write 用 discriminatedUnion（分支は ZodObject のみ） */
export const EventWriteAppSchema = z.discriminatedUnion('event_payment', [
  PfEventWriteBaseSchema,
  EnterpriseEventWriteAppSchema,
])

export type PfEventWriteApp = z.infer<typeof PfEventWriteAppSchema>
export type EnterpriseEventWriteApp = z.infer<typeof EnterpriseEventWriteAppSchema>
export type EventWriteApp = z.infer<typeof EventWriteAppSchema>

export type EnterpriseEvent = Event & {
  event_payment: 'enterprise_subsidy'
  enterprise_id: string
}

export function isEnterpriseEvent(e: Event): e is EnterpriseEvent {
  return e.event_payment === 'enterprise_subsidy' && e.enterprise_id != null
}

export function parseEventWrite(input: unknown): EventWriteApp {
  return EventWriteAppSchema.parse(input)
}

export function writeToEvent(id: string, write: EventWriteApp): Event {
  return new Event(id, write)
}

/** prepareEnterpriseEventDraft 出口: enterprise 判別を strict 検証 */
export function assertEnterpriseEventDraftStrict(event: Event): void {
  EnterpriseEventWriteDiscriminantSchema.parse({
    event_payment: event.event_payment,
    enterprise_id: event.enterprise_id,
  })
}
