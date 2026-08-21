import { describe, expect, it } from 'vitest'
import {
  cancelSourceFromBulkInitiator,
  orderCanceledLabelI18nKey,
} from './orderCancelSource.js'

describe('cancelSourceFromBulkInitiator', () => {
  it('minimum_participants → event_minimum_participants', () => {
    expect(cancelSourceFromBulkInitiator('minimum_participants')).toBe('event_minimum_participants')
  })

  it('organizer_manual / support → event_organizer', () => {
    expect(cancelSourceFromBulkInitiator('organizer_manual')).toBe('event_organizer')
    expect(cancelSourceFromBulkInitiator('support')).toBe('event_organizer')
  })
})

describe('orderCanceledLabelI18nKey', () => {
  it('user → canceled', () => {
    expect(orderCanceledLabelI18nKey('user', false)).toBe('user_event_card.canceled')
  })

  it('event_* → canceled_event', () => {
    expect(orderCanceledLabelI18nKey('event_minimum_participants', false)).toBe('user_event_card.canceled_event')
    expect(orderCanceledLabelI18nKey('event_organizer', false)).toBe('user_event_card.canceled_event')
  })

  it('organizer_reject → canceled_reject', () => {
    expect(orderCanceledLabelI18nKey('organizer_reject', false)).toBe('user_event_card.canceled_reject')
  })

  it('undefined + eventCanceled → canceled_event（推定）', () => {
    expect(orderCanceledLabelI18nKey(undefined, true)).toBe('user_event_card.canceled_event')
  })

  it('undefined + !eventCanceled → canceled（推定）', () => {
    expect(orderCanceledLabelI18nKey(undefined, false)).toBe('user_event_card.canceled')
  })
})
