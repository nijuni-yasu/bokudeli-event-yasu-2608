import { HttpsError } from 'firebase-functions/https'
import type { Transaction } from 'firebase-admin/firestore'
import { FormResponse } from '@shokujii/common/schemas/FormResponse.js'
import type { FormCheckoutAttempt } from '@shokujii/common/schemas/FormCheckoutAttempt.js'
import type { EventFormConfig } from '@shokujii/common/schemas/EventFormConfig.js'
import {
  getEventFormConfig,
  getFormCheckoutAttempt,
  getFormResponse,
  saveFormCheckoutAttempt,
  saveFormResponse,
} from '../stores/form.js'
import { getEventEnterpriseId } from './enterpriseSubsidyOrders.js'
import type { ShokujiiEvent } from '../stores/event.js'

export async function loadEventFormConfigIfPf(
  event: ShokujiiEvent,
  transaction?: Transaction,
): Promise<EventFormConfig | undefined> {
  if (getEventEnterpriseId(event) != null) {
    return undefined
  }
  return getEventFormConfig(event.community_id, event.id, transaction)
}

export async function requireAttemptForLatestForm(params: {
  event: ShokujiiEvent
  userId: string
  attemptId: string | undefined
  config: EventFormConfig
  transaction: Transaction
}): Promise<FormCheckoutAttempt> {
  if (params.attemptId == null || params.attemptId === '') {
    throw new HttpsError('failed-precondition', '事前アンケートの回答が必要です')
  }
  const attempt = await getFormCheckoutAttempt(
    params.event.community_id,
    params.event.id,
    params.attemptId,
    params.transaction,
  )
  if (attempt == null || attempt.user_id !== params.userId) {
    throw new HttpsError('failed-precondition', '事前アンケートの回答が見つかりません')
  }
  if (attempt.status === 'consumed') {
    throw new HttpsError('failed-precondition', 'この回答はすでに使用されています')
  }
  if (attempt.definition_version !== params.config.definition_version) {
    throw new HttpsError('failed-precondition', '設問が更新されています。回答画面でやり直してください')
  }
  return attempt
}

export type FormConfirmPlan =
  | { kind: 'none' }
  | { kind: 'reuse'; existing: FormResponse }
  | { kind: 'apply'; attempt: FormCheckoutAttempt; existing?: FormResponse }

export async function planFormConfirmation(params: {
  event: ShokujiiEvent
  userId: string
  attemptId: string | undefined
  transaction: Transaction
}): Promise<FormConfirmPlan> {
  const config = await loadEventFormConfigIfPf(params.event, params.transaction)
  if (config == null) {
    return { kind: 'none' }
  }
  const existing = await getFormResponse(params.event.community_id, params.event.id, params.userId, params.transaction)
  if (params.attemptId != null && params.attemptId !== '') {
    const attempt = await requireAttemptForLatestForm({
      event: params.event,
      userId: params.userId,
      attemptId: params.attemptId,
      config,
      transaction: params.transaction,
    })
    return { kind: 'apply', attempt, existing }
  }
  if (existing != null && existing.definition_version === config.definition_version) {
    return { kind: 'reuse', existing }
  }
  throw new HttpsError('failed-precondition', '事前アンケートの回答が必要です')
}

export async function applyAttemptToConfirmedResponse(params: {
  event: ShokujiiEvent
  userId: string
  attempt: FormCheckoutAttempt
  transaction: Transaction
  existing?: FormResponse
  ignoreDefinitionMismatch?: boolean
}): Promise<void> {
  const existing =
    params.existing ??
    (await getFormResponse(params.event.community_id, params.event.id, params.userId, params.transaction))
  if (existing != null && existing.revision > params.attempt.revision_basis) {
    params.attempt.status = 'consumed'
    await saveFormCheckoutAttempt(params.event.community_id, params.event.id, params.attempt, params.transaction)
    return
  }
  if (
    params.ignoreDefinitionMismatch !== true &&
    existing != null &&
    existing.definition_version > params.attempt.definition_version
  ) {
    params.attempt.status = 'consumed'
    await saveFormCheckoutAttempt(params.event.community_id, params.event.id, params.attempt, params.transaction)
    return
  }

  const now = Date.now()
  const nextRevision = (existing?.revision ?? 0) + 1
  const confirmed = new FormResponse(params.userId, {
    user_id: params.userId,
    definition_version: params.attempt.definition_version,
    revision: nextRevision,
    answers: params.attempt.answers,
    answered_at: existing?.answered_at ?? now,
    updated_at: now,
  })
  await saveFormResponse(params.event.community_id, params.event.id, confirmed, params.transaction)
  params.attempt.status = 'consumed'
  await saveFormCheckoutAttempt(params.event.community_id, params.event.id, params.attempt, params.transaction)
}
