import { assertEnterpriseEventDraftStrict } from '@shokujii/common/schemas/eventWrite.js'
import type { BokudeliEvent } from '@shokujii/base/stores/event.js'

export type EventDraftPreparer = (event: BokudeliEvent, communityEnterpriseId?: string | null) => Promise<void>

/** PF / partner: enterprise 向け補正なし */
export const preparePfEventDraft: EventDraftPreparer = async () => {}

/** enterprise コミュニティ向け: payment 補正（補助設定は Enterprise 履歴から開催月解決） */
export const prepareEnterpriseEventDraft: EventDraftPreparer = async (event, communityEnterpriseId) => {
  const enterpriseId = event.enterprise_id ?? communityEnterpriseId
  if (enterpriseId == null || enterpriseId === '') {
    return
  }
  if (event.enterprise_id == null || event.enterprise_id === '') {
    event.enterprise_id = enterpriseId
  }
  const status = event.event_status?.value
  if (status != null && status !== 'in_draft') {
    return
  }
  if (event.event_payment == null) {
    event.event_payment = 'enterprise_subsidy'
  }
  if (event.event_payment === 'community_bill' || event.event_payment === 'user_on_day') {
    event.event_payment = 'enterprise_subsidy'
    event.community_bill_settings = undefined
  }
  if (event.event_payment !== 'enterprise_subsidy') {
    return
  }
  assertEnterpriseEventDraftStrict(event)
}

export function eventDraftPreparerFromEnterpriseId(enterpriseId: string | null | undefined): EventDraftPreparer {
  if (enterpriseId != null && enterpriseId !== '') {
    return prepareEnterpriseEventDraft
  }
  return preparePfEventDraft
}
