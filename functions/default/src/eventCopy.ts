import { getStorage } from 'firebase-admin/storage'
import { onCall, HttpsError } from 'firebase-functions/https'
import type { EventCopyRequest, EventCopyResponse } from '@shokujii/common/apis/eventCopy.js'
import type { PartnerShop } from '@shokujii/common/schemas/PartnerShop.js'
import { formatCopyEventDateSuffix, isInShopTime } from '@shokujii/common/utils/datetime.js'
import { buildMinimumParticipantsForEventCopy } from '@shokujii/common/utils/minimumParticipants.js'
import { getEventCoverStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { getConfigGlobal } from './stores/config.js'
import { getCommunity } from './stores/community.js'
import { getEvent, saveEvent, ShokujiiEvent } from './stores/event.js'
import { getPartner } from './stores/partner.js'
import { savePartnerMenusToEventMenus } from './eventMenusSnapshot.js'
import { createModuleLogger } from './utils/logger.js'
import { assertEnterpriseEventPaymentAllowed } from './utils/enterpriseSubsidyOrders.js'

const logger = createModuleLogger('eventCopy')

/** enterprise_id 付きイベントの支払い方式をエンプラ版で許可された値に正規化する */
export const normalizeEnterpriseEventPaymentForCopy = (
  enterpriseId: string | null | undefined,
  eventPayment: ShokujiiEvent['event_payment'],
  communityBillSettings: ShokujiiEvent['community_bill_settings'],
): {
  event_payment: ShokujiiEvent['event_payment']
  community_bill_settings: ShokujiiEvent['community_bill_settings']
} => {
  if (enterpriseId == null || enterpriseId === '') {
    return { event_payment: eventPayment, community_bill_settings: communityBillSettings }
  }
  if (eventPayment === 'community_bill' || eventPayment === 'user_on_day') {
    return { event_payment: 'enterprise_subsidy', community_bill_settings: undefined }
  }
  return { event_payment: eventPayment, community_bill_settings: communityBillSettings }
}

const copyEventImage = async (srcEvent: ShokujiiEvent, newEventId: string) => {
  const srcPath = getEventCoverStoragePath(srcEvent.community_id, srcEvent.id)
  const destPath = getEventCoverStoragePath(srcEvent.community_id, newEventId)
  const bucket = getStorage().bucket()
  // srcPath が存在しなかった場合のエラーハンドリングは呼び出し元で行う
  return await bucket.file(srcPath).copy(destPath)
}

/**
 * 認証・権限チェック済みのコンテキストで 1 件イベントをコピーする。
 * eventCopy / eventCopyRepeat から利用する。
 */
export const copyEventCore = async (
  uid: string,
  srcEvent: ShokujiiEvent,
  shop: PartnerShop,
  startTime: number,
): Promise<{ newEventId: string }> => {
  if (!isInShopTime(startTime, shop)) {
    throw new HttpsError('invalid-argument', 'Event time is not in shop time')
  }
  const now = Date.now()
  const normalizedPayment = normalizeEnterpriseEventPaymentForCopy(
    srcEvent.enterprise_id,
    srcEvent.event_payment,
    srcEvent.community_bill_settings,
  )
  const newDeadlineDatetime = startTime + srcEvent.event_deadline_datetime - srcEvent.event_start_datetime
  const newEvent = new ShokujiiEvent(null, {
    // スプレッド構文を使うとコピーすべきでないフィールドが混ざってしまうので、
    // 必要なフィールドを明示的に指定する
    community_id: srcEvent.community_id,
    community_name: srcEvent.community_name,
    community_account: srcEvent.community_account,
    is_public: srcEvent.is_public,
    event_payment: normalizedPayment.event_payment,
    community_bill_settings: normalizedPayment.community_bill_settings,
    enterprise_id: srcEvent.enterprise_id,
    event_max_people: srcEvent.event_max_people,
    event_postalcode: srcEvent.event_postalcode,
    event_address_base: srcEvent.event_address_base,
    event_address_detail: srcEvent.event_address_detail,
    partner_id: srcEvent.partner_id,
    shop_id: srcEvent.shop_id,
    shop_name: srcEvent.shop_name,
    event_desc: srcEvent.event_desc,
    organizer_fullname: srcEvent.organizer_fullname,
    organizer_company: srcEvent.organizer_company,
    organizer_phone_personal: srcEvent.organizer_phone_personal,
    organizer_phone_company: srcEvent.organizer_phone_company,
    organizer_email: srcEvent.organizer_email,
    organizer_memo: srcEvent.organizer_memo,
    event_sns_hash_tag: srcEvent.event_sns_hash_tag,
    bill_fullname: srcEvent.bill_fullname,
    bill_email: srcEvent.bill_email,
    event_place: srcEvent.event_place,
    event_place_url: srcEvent.event_place_url,
    subdomain_tags: srcEvent.subdomain_tags,
    ...(srcEvent.enterprise_id == null || srcEvent.enterprise_id === '') &&
    srcEvent.members_visible_min_count != null
      ? { members_visible_min_count: srcEvent.members_visible_min_count }
      : {},

    // 更新するもの
    event_name: `${srcEvent.event_name} ${formatCopyEventDateSuffix(startTime)}`, // TODO: multilang
    event_status: {
      value: 'in_draft',
      shop_comment: '',
    },
    event_start_datetime: startTime,
    event_end_datetime: startTime + srcEvent.event_end_datetime - srcEvent.event_start_datetime,
    event_deadline_datetime: newDeadlineDatetime,
    minimum_participants: buildMinimumParticipantsForEventCopy(srcEvent.minimum_participants, newDeadlineDatetime),
    members: [],
    created_at: now,
    updated_at: now,
    created_by: uid,
    updated_by: uid,
  })

  assertEnterpriseEventPaymentAllowed(newEvent)

  try {
    await copyEventImage(srcEvent, newEvent.id)
  } catch (error) {
    logger.error('Failed to copy event image', { error })
  }

  await saveEvent(uid, newEvent)

  const srcEventMenus = await srcEvent.getMenus()
  const selectedMenuIds = srcEventMenus.filter((m) => m.is_selected).map((m) => m.menu_id)
  await savePartnerMenusToEventMenus(
    srcEvent.partner_id,
    newEvent.id,
    srcEvent.community_id,
    startTime,
    selectedMenuIds,
  )

  return {
    newEventId: newEvent.id,
  }
}

export const eventCopy = onCall<EventCopyRequest, Promise<EventCopyResponse>>(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in')
  }
  const { uid } = request.auth
  const { srcEventId, startTime } = request.data

  if (typeof srcEventId !== 'string' || srcEventId.trim() === '') {
    throw new HttpsError('invalid-argument', 'srcEventId must be a non-empty string')
  }
  if (typeof startTime !== 'number' || !Number.isFinite(startTime)) {
    throw new HttpsError('invalid-argument', 'startTime must be a valid number')
  }

  const srcEvent = await getEvent(srcEventId)
  if (srcEvent === undefined) {
    throw new HttpsError('not-found', 'Event not found')
  }
  const [community, partner, config] = await Promise.all([
    getCommunity(srcEvent.community_id),
    getPartner(srcEvent.partner_id),
    getConfigGlobal(),
  ])
  const isSupport = config?.isSupport(uid) ?? false
  const isManager = community != null && (await community.hasRole(uid, 'manager'))
  if (!isSupport && !isManager) {
    throw new HttpsError('permission-denied', 'Forbidden')
  }
  if (community == null) {
    throw new HttpsError('not-found', 'Community not found')
  }
  if (partner === undefined) {
    throw new HttpsError('not-found', 'Partner not found')
  }
  const shop = await partner.getShop(srcEvent.shop_id)
  if (shop === undefined) {
    throw new HttpsError('not-found', 'Shop not found')
  }

  const { newEventId } = await copyEventCore(uid, srcEvent, shop, startTime)
  return {
    newEventId,
  }
})
