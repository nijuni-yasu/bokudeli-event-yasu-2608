import { onCall, HttpsError } from 'firebase-functions/https'
import { CommunityForm } from '@shokujii/common/schemas/CommunityForm.js'
import { EventFormConfig, cloneFormFields } from '@shokujii/common/schemas/EventFormConfig.js'
import {
  ArchiveCommunityFormRequestSchema,
  ClearEventFormConfigRequestSchema,
  CreateCommunityFormRequestSchema,
  DuplicateCommunityFormRequestSchema,
  GetCommunityFormRequestSchema,
  GetEventFormConfigRequestSchema,
  GetEventFormPresenceRequestSchema,
  GetEventFormResponseRequestSchema,
  ListCommunityFormsRequestSchema,
  ListEventFormResponsesRequestSchema,
  SetEventFormFromCommunityRequestSchema,
  UpdateCommunityFormRequestSchema,
  UpdateEventFormConfigRequestSchema,
  type ArchiveCommunityFormResponse,
  type ClearEventFormConfigResponse,
  type CreateCommunityFormResponse,
  type DuplicateCommunityFormResponse,
  type EventFormResponseListItem,
  type GetCommunityFormResponse,
  type GetEventFormConfigResponse,
  type GetEventFormPresenceResponse,
  type GetEventFormResponseResponse,
  type ListCommunityFormsResponse,
  type ListEventFormResponsesResponse,
  type SetEventFormFromCommunityResponse,
  type UpdateCommunityFormResponse,
  type UpdateEventFormConfigResponse,
} from '@shokujii/common/apis/form.js'
import { formatFormAnswerDisplay } from '@shokujii/common/utils/validateFormAnswers.js'
import { normalizeFormFields } from '@shokujii/common/utils/normalizeFormFields.js'
import { createModuleLogger } from './utils/logger.js'
import {
  assertEventFormEditable,
  requireAuthUid,
  requireCommunityManager,
  requirePfEventForForm,
  toCommunityFormDetail,
  toEventFormConfigDto,
} from './utils/formAccess.js'
import { getEventEnterpriseId } from './utils/enterpriseSubsidyOrders.js'
import { getEventInCommunity } from './stores/event.js'
import { getOrders } from './stores/memberOrder.js'
import { getUser } from './stores/user.js'
import {
  createCommunityForm as createCommunityFormDoc,
  deleteEventFormConfig,
  getCommunityForm,
  getEventFormConfig,
  getFormResponse,
  listCommunityForms,
  listFormResponses,
  saveCommunityForm,
  saveEventFormConfig,
} from './stores/form.js'

const logger = createModuleLogger('formAdmin')

function parseOrThrow<T>(schema: { parse: (value: unknown) => T }, data: unknown): T {
  try {
    return schema.parse(data)
  } catch {
    throw new HttpsError('invalid-argument', '必須パラメータが不足しています')
  }
}

export const listCommunityFormsCallable = onCall(async (request): Promise<ListCommunityFormsResponse> => {
  const uid = await requireAuthUid(request.auth?.uid)
  const { community_id } = parseOrThrow(ListCommunityFormsRequestSchema, request.data)
  await requireCommunityManager(community_id, uid)
  const forms = await listCommunityForms(community_id)
  return {
    forms: forms
      .sort((a, b) => b.updated_at - a.updated_at)
      .map((form) => ({
        form_id: form.id,
        name: form.name,
        description: form.description,
        purpose: form.purpose,
        archived: form.archived,
        field_count: form.fields.length,
        updated_at: form.updated_at,
      })),
  }
})

export const getCommunityFormCallable = onCall(async (request): Promise<GetCommunityFormResponse> => {
  const uid = await requireAuthUid(request.auth?.uid)
  const { community_id, form_id } = parseOrThrow(GetCommunityFormRequestSchema, request.data)
  await requireCommunityManager(community_id, uid)
  const form = await getCommunityForm(community_id, form_id)
  if (form == null) {
    throw new HttpsError('not-found', 'フォームが見つかりません')
  }
  return { form: toCommunityFormDetail(form) }
})

export const createCommunityForm = onCall(async (request): Promise<CreateCommunityFormResponse> => {
  const uid = await requireAuthUid(request.auth?.uid)
  const data = parseOrThrow(CreateCommunityFormRequestSchema, request.data)
  await requireCommunityManager(data.community_id, uid)
  const normalized = normalizeFormFields(data.fields)
  if (!normalized.ok) {
    throw new HttpsError('invalid-argument', normalized.message)
  }
  const form = new CommunityForm('', {
    community_id: data.community_id,
    name: data.name,
    description: data.description ?? '',
    purpose: data.purpose ?? '',
    fields: normalized.fields,
    archived: false,
    created_by: uid,
    updated_by: uid,
  })
  const created = await createCommunityFormDoc(data.community_id, form)
  logger.info('コミュニティフォームを作成した', { communityId: data.community_id, formId: created.id, userId: uid })
  return { form: toCommunityFormDetail(created) }
})

export const updateCommunityForm = onCall(async (request): Promise<UpdateCommunityFormResponse> => {
  const uid = await requireAuthUid(request.auth?.uid)
  const data = parseOrThrow(UpdateCommunityFormRequestSchema, request.data)
  await requireCommunityManager(data.community_id, uid)
  const existing = await getCommunityForm(data.community_id, data.form_id)
  if (existing == null) {
    throw new HttpsError('not-found', 'フォームが見つかりません')
  }
  const normalized = normalizeFormFields(data.fields, existing.fields)
  if (!normalized.ok) {
    throw new HttpsError('invalid-argument', normalized.message)
  }
  const updated = new CommunityForm(existing.id, {
    ...existing,
    name: data.name,
    description: data.description ?? '',
    purpose: data.purpose ?? '',
    fields: normalized.fields,
    archived: data.archived ?? existing.archived,
    updated_by: uid,
  })
  await saveCommunityForm(data.community_id, updated)
  return { form: toCommunityFormDetail(updated) }
})

export const duplicateCommunityForm = onCall(async (request): Promise<DuplicateCommunityFormResponse> => {
  const uid = await requireAuthUid(request.auth?.uid)
  const { community_id, form_id } = parseOrThrow(DuplicateCommunityFormRequestSchema, request.data)
  await requireCommunityManager(community_id, uid)
  const existing = await getCommunityForm(community_id, form_id)
  if (existing == null) {
    throw new HttpsError('not-found', 'フォームが見つかりません')
  }
  const duplicated = new CommunityForm('', {
    community_id,
    name: `${existing.name} のコピー`,
    description: existing.description,
    purpose: existing.purpose,
    fields: cloneFormFields(existing.fields),
    archived: false,
    created_by: uid,
    updated_by: uid,
  })
  const created = await createCommunityFormDoc(community_id, duplicated)
  return { form: toCommunityFormDetail(created) }
})

export const archiveCommunityForm = onCall(async (request): Promise<ArchiveCommunityFormResponse> => {
  const uid = await requireAuthUid(request.auth?.uid)
  const { community_id, form_id, archived } = parseOrThrow(ArchiveCommunityFormRequestSchema, request.data)
  await requireCommunityManager(community_id, uid)
  const existing = await getCommunityForm(community_id, form_id)
  if (existing == null) {
    throw new HttpsError('not-found', 'フォームが見つかりません')
  }
  const updated = new CommunityForm(existing.id, { ...existing, archived, updated_by: uid })
  await saveCommunityForm(community_id, updated)
  return { form: toCommunityFormDetail(updated) }
})

export const getEventFormPresence = onCall(async (request): Promise<GetEventFormPresenceResponse> => {
  const { community_id, event_id } = parseOrThrow(GetEventFormPresenceRequestSchema, request.data)
  const event = await getEventInCommunity(community_id, event_id)
  if (event == null) {
    throw new HttpsError('not-found', 'イベントが見つかりません')
  }
  if (getEventEnterpriseId(event) != null) {
    return { has_form: false }
  }
  const config = await getEventFormConfig(community_id, event_id)
  return { has_form: config != null }
})

export const getEventFormConfigCallable = onCall(async (request): Promise<GetEventFormConfigResponse> => {
  const uid = await requireAuthUid(request.auth?.uid)
  const { community_id, event_id } = parseOrThrow(GetEventFormConfigRequestSchema, request.data)
  await requireCommunityManager(community_id, uid)
  await requirePfEventForForm(community_id, event_id)
  const config = await getEventFormConfig(community_id, event_id)
  return { config: config == null ? null : toEventFormConfigDto(config) }
})

export const setEventFormFromCommunity = onCall(async (request): Promise<SetEventFormFromCommunityResponse> => {
  const uid = await requireAuthUid(request.auth?.uid)
  const { community_id, event_id, form_id } = parseOrThrow(SetEventFormFromCommunityRequestSchema, request.data)
  await requireCommunityManager(community_id, uid)
  const event = await requirePfEventForForm(community_id, event_id)
  assertEventFormEditable(event)
  const form = await getCommunityForm(community_id, form_id)
  if (form == null || form.archived) {
    throw new HttpsError('not-found', 'フォームが見つかりません')
  }
  const existing = await getEventFormConfig(community_id, event_id)
  const config = new EventFormConfig('current', {
    source_form_id: form.id,
    definition_version: (existing?.definition_version ?? 0) + 1,
    purpose: form.purpose,
    fields: cloneFormFields(form.fields),
  })
  await saveEventFormConfig(community_id, event_id, config)
  logger.info('イベントへフォームを設定した', {
    communityId: community_id,
    eventId: event_id,
    formId: form.id,
    userId: uid,
  })
  return { config: toEventFormConfigDto(config) }
})

export const updateEventFormConfig = onCall(async (request): Promise<UpdateEventFormConfigResponse> => {
  const uid = await requireAuthUid(request.auth?.uid)
  const data = parseOrThrow(UpdateEventFormConfigRequestSchema, request.data)
  await requireCommunityManager(data.community_id, uid)
  const event = await requirePfEventForForm(data.community_id, data.event_id)
  assertEventFormEditable(event)
  const existing = await getEventFormConfig(data.community_id, data.event_id)
  if (existing == null) {
    throw new HttpsError('not-found', 'イベントにフォームが設定されていません')
  }
  const normalized = normalizeFormFields(data.fields, existing.fields)
  if (!normalized.ok) {
    throw new HttpsError('invalid-argument', normalized.message)
  }
  const config = new EventFormConfig('current', {
    ...existing,
    purpose: data.purpose ?? existing.purpose,
    fields: normalized.fields,
    definition_version: existing.definition_version + 1,
  })
  await saveEventFormConfig(data.community_id, data.event_id, config)
  return { config: toEventFormConfigDto(config) }
})

export const clearEventFormConfig = onCall(async (request): Promise<ClearEventFormConfigResponse> => {
  const uid = await requireAuthUid(request.auth?.uid)
  const { community_id, event_id } = parseOrThrow(ClearEventFormConfigRequestSchema, request.data)
  await requireCommunityManager(community_id, uid)
  const event = await requirePfEventForForm(community_id, event_id)
  assertEventFormEditable(event)
  await deleteEventFormConfig(community_id, event_id)
  return { cleared: true }
})

function toResponseItem(
  userId: string,
  displayName: string,
  participation: 'confirmed' | 'canceled',
  answeredAt: number,
  updatedAt: number,
  answers: EventFormResponseListItem['answers'],
): EventFormResponseListItem {
  return {
    user_id: userId,
    display_name: displayName,
    participation,
    answered_at: answeredAt,
    updated_at: updatedAt,
    answers,
  }
}

async function buildResponseItems(communityId: string, eventId: string): Promise<EventFormResponseListItem[]> {
  const [responses, ordered, canceled] = await Promise.all([
    listFormResponses(communityId, eventId),
    getOrders(communityId, eventId, 'ordered'),
    getOrders(communityId, eventId, 'canceled'),
  ])
  const orderedUsers = new Set(ordered.map((order) => order.user_id))
  const canceledUsers = new Set(canceled.map((order) => order.user_id))
  const users = await Promise.all(responses.map((response) => getUser(response.user_id, false)))
  return responses
    .map((response, index) => {
      const participation = orderedUsers.has(response.user_id) ? 'confirmed' : 'canceled'
      const user = users[index]
      return toResponseItem(
        response.user_id,
        user?.user_name ?? response.user_id,
        participation,
        response.answered_at,
        response.updated_at,
        response.answers.map((answer) => ({
          field_id: answer.field_id,
          field_label: answer.field_label,
          display_value: formatFormAnswerDisplay(answer),
        })),
      )
    })
    .filter((item) => orderedUsers.has(item.user_id) || canceledUsers.has(item.user_id))
}

export const listEventFormResponses = onCall(async (request): Promise<ListEventFormResponsesResponse> => {
  const uid = await requireAuthUid(request.auth?.uid)
  const { community_id, event_id, filter } = parseOrThrow(ListEventFormResponsesRequestSchema, request.data)
  await requireCommunityManager(community_id, uid)
  await requirePfEventForForm(community_id, event_id)
  const items = await buildResponseItems(community_id, event_id)
  return { responses: items.filter((item) => item.participation === filter) }
})

export const getEventFormResponse = onCall(async (request): Promise<GetEventFormResponseResponse> => {
  const uid = await requireAuthUid(request.auth?.uid)
  const { community_id, event_id, user_id } = parseOrThrow(GetEventFormResponseRequestSchema, request.data)
  await requireCommunityManager(community_id, uid)
  await requirePfEventForForm(community_id, event_id)
  const items = await buildResponseItems(community_id, event_id)
  const response = items.find((item) => item.user_id === user_id)
  if (response == null) {
    const raw = await getFormResponse(community_id, event_id, user_id)
    if (raw == null) {
      throw new HttpsError('not-found', '回答が見つかりません')
    }
    throw new HttpsError('not-found', '参加確定または取消済みの回答が見つかりません')
  }
  return { response }
})
