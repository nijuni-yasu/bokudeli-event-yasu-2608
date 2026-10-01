import { onCall, HttpsError } from 'firebase-functions/https'
import {
  GetOrderFormForCartRequestSchema,
  SaveOrderFormAttemptRequestSchema,
  type GetOrderFormForCartResponse,
  type SaveOrderFormAttemptResponse,
} from '@shokujii/common/apis/form.js'
import { answersToInputs, validateFormAnswers } from '@shokujii/common/utils/validateFormAnswers.js'
import { createModuleLogger } from './utils/logger.js'
import { requireAuthUid, requirePfEventForForm, visibleFieldsForNewAnswers } from './utils/formAccess.js'
import { getOrdersInCart } from './stores/memberOrder.js'
import {
  createFormCheckoutAttempt,
  getEventFormConfig,
  getFormResponse,
  listPendingFormCheckoutAttemptsForUser,
} from './stores/form.js'

const logger = createModuleLogger('formOrder')

function parseOrThrow<T>(schema: { parse: (value: unknown) => T }, data: unknown): T {
  try {
    return schema.parse(data)
  } catch {
    throw new HttpsError('invalid-argument', '必須パラメータが不足しています')
  }
}

async function requireInCart(communityId: string, eventId: string, userId: string): Promise<void> {
  const cartOrders = await getOrdersInCart(communityId, eventId, userId)
  if (cartOrders.length === 0) {
    throw new HttpsError('failed-precondition', 'カートに注文があるときだけ回答できます')
  }
}

export const getOrderFormForCart = onCall(async (request): Promise<GetOrderFormForCartResponse> => {
  const uid = await requireAuthUid(request.auth?.uid)
  const { community_id, event_id } = parseOrThrow(GetOrderFormForCartRequestSchema, request.data)
  const event = await requirePfEventForForm(community_id, event_id)
  await requireInCart(community_id, event_id, uid)

  const config = await getEventFormConfig(community_id, event_id)
  if (config == null) {
    return { has_form: false, community_name: event.community_name, purpose: '' }
  }

  const [pendingAttempts, confirmed] = await Promise.all([
    listPendingFormCheckoutAttemptsForUser(community_id, event_id, uid),
    getFormResponse(community_id, event_id, uid),
  ])
  const latestPending = pendingAttempts
    .filter((attempt) => attempt.definition_version === config.definition_version)
    .sort((a, b) => b.updated_at - a.updated_at)[0]

  const fields = visibleFieldsForNewAnswers(config.fields)
  if (latestPending != null) {
    return {
      has_form: true,
      community_name: event.community_name,
      purpose: config.purpose,
      definition_version: config.definition_version,
      fields,
      initial_answers: answersToInputs(latestPending.answers),
      source: 'attempt',
    }
  }
  if (confirmed != null) {
    return {
      has_form: true,
      community_name: event.community_name,
      purpose: config.purpose,
      definition_version: config.definition_version,
      fields,
      initial_answers: answersToInputs(confirmed.answers),
      source: 'confirmed',
    }
  }
  return {
    has_form: true,
    community_name: event.community_name,
    purpose: config.purpose,
    definition_version: config.definition_version,
    fields,
    initial_answers: [],
    source: 'empty',
  }
})

export const saveOrderFormAttempt = onCall(async (request): Promise<SaveOrderFormAttemptResponse> => {
  const uid = await requireAuthUid(request.auth?.uid)
  const data = parseOrThrow(SaveOrderFormAttemptRequestSchema, request.data)
  await requirePfEventForForm(data.community_id, data.event_id)
  await requireInCart(data.community_id, data.event_id, uid)

  const config = await getEventFormConfig(data.community_id, data.event_id)
  if (config == null) {
    throw new HttpsError('failed-precondition', 'このイベントにフォームはありません')
  }
  const validated = validateFormAnswers({
    fields: config.fields,
    answers: data.answers,
    definitionVersion: config.definition_version,
    expectedDefinitionVersion: data.definition_version,
  })
  if (!validated.ok) {
    return { attempt_id: '', issues: validated.issues }
  }

  const confirmed = await getFormResponse(data.community_id, data.event_id, uid)
  const attempt = await createFormCheckoutAttempt(data.community_id, data.event_id, {
    user_id: uid,
    definition_version: config.definition_version,
    revision_basis: confirmed?.revision ?? 0,
    answers: validated.answers,
    status: 'pending',
  })
  logger.info('注文フローの回答試行を保存した', {
    communityId: data.community_id,
    eventId: data.event_id,
    userId: uid,
    attemptId: attempt.id,
  })
  return { attempt_id: attempt.id }
})
