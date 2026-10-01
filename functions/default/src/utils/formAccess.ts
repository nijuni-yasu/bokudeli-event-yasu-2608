import { HttpsError } from 'firebase-functions/https'
import { isEventFormEditableStatus } from '@shokujii/common/schemas/formFields.js'
import type { CommunityForm } from '@shokujii/common/schemas/CommunityForm.js'
import type { EventFormConfig } from '@shokujii/common/schemas/EventFormConfig.js'
import type { FormField } from '@shokujii/common/schemas/formFields.js'
import type { CommunityFormDetail, EventFormConfigDto } from '@shokujii/common/apis/form.js'
import { getCommunity } from '../stores/community.js'
import { getConfigGlobal } from '../stores/config.js'
import { getEventInCommunity } from '../stores/event.js'
import { getEventEnterpriseId } from './enterpriseSubsidyOrders.js'
import type { ShokujiiEvent } from '../stores/event.js'
import type { ShokujiiCommunity } from '../stores/community.js'

export async function requireAuthUid(uid: string | undefined): Promise<string> {
  if (uid == null) {
    throw new HttpsError('unauthenticated', '認証が必要です')
  }
  return uid
}

export async function requireCommunityManager(communityId: string, uid: string): Promise<ShokujiiCommunity> {
  const community = await getCommunity(communityId)
  if (community == null) {
    throw new HttpsError('not-found', 'コミュニティが見つかりません')
  }
  const config = await getConfigGlobal()
  const isSupport = config?.isSupport(uid) ?? false
  const isManager = await community.hasRole(uid, 'manager')
  if (!isSupport && !isManager) {
    throw new HttpsError('permission-denied', 'コミュニティ管理者のみ操作できます')
  }
  return community
}

export function assertPfEvent(event: ShokujiiEvent): void {
  if (getEventEnterpriseId(event) != null) {
    throw new HttpsError('failed-precondition', 'エンタープライズのイベントではフォームを利用できません')
  }
}

export async function requirePfEventForForm(communityId: string, eventId: string): Promise<ShokujiiEvent> {
  const event = await getEventInCommunity(communityId, eventId)
  if (event == null) {
    throw new HttpsError('not-found', 'イベントが見つかりません')
  }
  assertPfEvent(event)
  return event
}

export function assertEventFormEditable(event: ShokujiiEvent): void {
  if (event.event_status.value === 'event_canceled') {
    throw new HttpsError('failed-precondition', '中止したイベントの設問は変更できません')
  }
  if (!isEventFormEditableStatus(event.event_status.value)) {
    throw new HttpsError('failed-precondition', 'この状態のイベントでは設問を変更できません')
  }
}

export function toCommunityFormDetail(form: CommunityForm): CommunityFormDetail {
  return {
    form_id: form.id,
    name: form.name,
    description: form.description,
    purpose: form.purpose,
    archived: form.archived,
    field_count: form.fields.length,
    fields: form.fields,
    created_at: form.created_at,
    updated_at: form.updated_at,
  }
}

export function toEventFormConfigDto(config: EventFormConfig): EventFormConfigDto {
  return {
    source_form_id: config.source_form_id,
    definition_version: config.definition_version,
    purpose: config.purpose,
    fields: config.fields,
    updated_at: config.updated_at,
  }
}

export function visibleFieldsForNewAnswers(fields: FormField[]): FormField[] {
  return fields.filter((field) => !field.hidden_for_new)
}
