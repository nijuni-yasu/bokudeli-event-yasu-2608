import type { EventPayment } from '@shokujii/common/schemas/Event.js'

export type EventPaymentUiStrategy = {
  isEnterpriseMode: boolean
  forbiddenPayments: EventPayment[]
  defaultPaymentWhenDraft?: EventPayment
}

export const PF_EVENT_PAYMENT_UI_STRATEGY: EventPaymentUiStrategy = {
  isEnterpriseMode: false,
  forbiddenPayments: [],
}

export const ENTERPRISE_EVENT_PAYMENT_UI_STRATEGY: EventPaymentUiStrategy = {
  isEnterpriseMode: true,
  forbiddenPayments: ['community_bill', 'user_on_day'],
  defaultPaymentWhenDraft: 'enterprise_subsidy',
}

export function eventPaymentUiStrategyFromEnterpriseId(
  enterpriseId: string | null | undefined,
): EventPaymentUiStrategy {
  if (enterpriseId != null && enterpriseId !== '') {
    return ENTERPRISE_EVENT_PAYMENT_UI_STRATEGY
  }
  return PF_EVENT_PAYMENT_UI_STRATEGY
}
