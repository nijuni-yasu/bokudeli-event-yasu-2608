import type { EventDraftPreparer } from '@shokujii/base/stores/eventDraft.js'
import { prepareEnterpriseEventDraft, preparePfEventDraft } from '@shokujii/base/stores/eventDraft.js'

export type EventStoreOptions = {
  /** PF / enterprise 向け: member_orders の collectionGroup クエリに enterprise_id フィルタを追加。未指定キー = フィルタなし（partner） */
  ordersEnterpriseId?: string | null
  /** PF / enterprise 向け: events の collectionGroup クエリに enterprise_id フィルタを追加。未指定キー = フィルタなし（partner） */
  eventsEnterpriseId?: string | null
  /** 下書き保存前の event 補正（enterprise subsidy スナップショット等） */
  draftPreparer?: EventDraftPreparer
}

export const buildEventStoreOptions = (enterpriseId: string | null | undefined): EventStoreOptions => {
  if (enterpriseId != null && enterpriseId !== '') {
    return {
      ordersEnterpriseId: enterpriseId,
      eventsEnterpriseId: enterpriseId,
      draftPreparer: prepareEnterpriseEventDraft,
    }
  }
  return {
    ordersEnterpriseId: null,
    eventsEnterpriseId: null,
    draftPreparer: preparePfEventDraft,
  }
}

/**
 * inject / provide から得た enterpriseId を EventStoreOptions に変換する。
 * 非空 string のみ tenant 固定。それ以外は `{}`（app の setDefaultEventStoreOptions を merge 利用）。
 */
export const resolveEventStoreOptionsFromInjectedEnterpriseId = (
  enterpriseId: string | undefined,
): EventStoreOptions => {
  if (enterpriseId != null && enterpriseId !== '') {
    return buildEventStoreOptions(enterpriseId)
  }
  return {}
}
