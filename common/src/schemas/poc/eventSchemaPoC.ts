/**
 * C-1 PoC: A/B/C 方式比較（H1 正本は eventWrite.ts）。
 *
 * @see documents/08_エンタープライズ/30_リファクタ計画/05_WS-C_C-1_PoC設計.md
 */
import { z } from 'zod'
import { EventDbSchema, EVENT_PAYMENT_VALUES } from '../Event.js'
import { EnterpriseSubsidySettingsAppSchema, EnterpriseSubsidySettingsDbSchema } from '../EnterpriseSubsidySettings.js'
import {
  type EventWriteApp,
  EventWriteCoreAppSchema,
  PfEventPaymentSchema,
  parseEventWrite,
  writeToEvent,
} from '../eventWrite.js'

export {
  EventWriteCoreAppSchema,
  EventWriteAppSchema,
  EnterpriseEventWriteAppSchema,
  PfEventWriteAppSchema,
  PfEventPaymentSchema,
  parseEventWrite,
  writeToEvent,
  isEnterpriseEvent,
  type EventWriteApp,
  type EnterpriseEvent,
} from '../eventWrite.js'

/** PoC テスト互換エイリアス */
export const parseH1EventWrite = parseEventWrite
export const h1WriteToEvent = writeToEvent

// --- 方式 C: App nest + Db flatten ---

const EventNestedPfWriteSchemaC = EventWriteCoreAppSchema.extend({
  event_payment: PfEventPaymentSchema,
  enterprise: z.undefined().optional(),
})

const EventNestedEnterpriseWriteSchemaC = EventWriteCoreAppSchema.extend({
  event_payment: z.literal('enterprise_subsidy'),
  enterprise: z.object({
    enterprise_id: z.string().nonempty(),
  }),
})

export const EventNestedWriteSchemaC = z.discriminatedUnion('event_payment', [
  EventNestedPfWriteSchemaC,
  EventNestedEnterpriseWriteSchemaC,
])

export type EventNestedWriteC = z.infer<typeof EventNestedWriteSchemaC>

/** C 方式: ネスト write → H1 と同型のフラット write 入力 */
export function flattenNestedWriteToFlat(input: EventNestedWriteC): EventWriteApp {
  if (input.event_payment === 'enterprise_subsidy') {
    const { enterprise, ...rest } = input
    return {
      ...rest,
      enterprise_id: enterprise.enterprise_id,
    }
  }
  const { enterprise, ...rest } = input
  void enterprise
  return {
    ...rest,
    enterprise_id: null,
  }
}

// --- 方式 A: DbSchema discriminatedUnion（partner / EventLog 互換リスクの比較用） ---

const pfEventPaymentDb = z.enum(['user_advance', 'user_on_day', 'community_bill'])

/** A: EventDbSchema を extend して判別（shape 複製だと NonEmptyString transform 出力を再 parse できない） */
const EventDbPfBranchSchemaA = EventDbSchema.extend({
  event_payment: pfEventPaymentDb,
  enterprise_id: z.null(),
})

const EventDbEnterpriseBranchSchemaA = EventDbSchema.extend({
  event_payment: z.literal('enterprise_subsidy'),
  enterprise_id: z.string().nonempty(),
  enterprise_subsidy_settings: EnterpriseSubsidySettingsDbSchema,
})

/** A: Db 層 discriminatedUnion 試作 */
export const EventDbSchemaVariantA = z.discriminatedUnion('event_payment', [
  EventDbPfBranchSchemaA,
  EventDbEnterpriseBranchSchemaA,
])

// --- 却下方式 B: extend のみ（optional 汚染の比較用） ---

export const EventWriteExtendOnlySchemaB = EventWriteCoreAppSchema.extend({
  event_payment: z.enum(EVENT_PAYMENT_VALUES),
  enterprise_id: z.string().optional(),
  enterprise_subsidy_settings: EnterpriseSubsidySettingsAppSchema.optional(),
})
