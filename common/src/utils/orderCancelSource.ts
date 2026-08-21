import type { EventMemberOrderCancelSourceType } from '../schemas/EventMemberOrder.js'

/** 一括中止コアの initiator（functions の CancelEventBulkInitiator と同一） */
export const BULK_CANCEL_INITIATOR_VALUES = ['minimum_participants', 'organizer_manual', 'support'] as const
export type BulkCancelInitiator = (typeof BULK_CANCEL_INITIATOR_VALUES)[number]

export function cancelSourceFromBulkInitiator(initiator: BulkCancelInitiator): EventMemberOrderCancelSourceType {
  switch (initiator) {
    case 'minimum_participants':
      return 'event_minimum_participants'
    case 'organizer_manual':
    case 'support':
      return 'event_organizer'
  }
}

/** 注文キャンセル理由からユーザー向け i18n キーを返す */
export function orderCanceledLabelI18nKey(
  cancelSource: EventMemberOrderCancelSourceType | undefined,
  eventCanceled: boolean,
): 'user_event_card.canceled' | 'user_event_card.canceled_event' | 'user_event_card.canceled_reject' {
  const source: EventMemberOrderCancelSourceType =
    cancelSource ?? (eventCanceled ? 'event_minimum_participants' : 'user')
  switch (source) {
    case 'event_minimum_participants':
    case 'event_organizer':
      return 'user_event_card.canceled_event'
    case 'organizer_reject':
      return 'user_event_card.canceled_reject'
    default:
      return 'user_event_card.canceled'
  }
}
