import { onCall, HttpsError } from 'firebase-functions/https'
import type { EventCopyRequest, EventCopyResponse } from '@shokujii/common/apis/eventCopy.js'
import { isInShopTime } from '@shokujii/common/utils/datetime.js'
import { getCommunity } from './stores/community.js'
import { getEvent, saveEvent, ShokujiiEvent } from './stores/event.js'
import { getPartner } from './stores/partner.js'
import { makeMenuSnapshot } from './eventSnapshot.js'

export const eventCopy = onCall<EventCopyRequest, Promise<EventCopyResponse>>(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in')
  }
  const { uid } = request.auth
  const { srcEventId, startTime } = request.data

  // 入力バリデーション
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
  const [community, partner] = await Promise.all([getCommunity(srcEvent.community_id), getPartner(srcEvent.partner_id)])
  if (!(await community?.hasRole(uid, 'manager'))) {
    throw new HttpsError('permission-denied', 'Forbidden')
  }
  if (partner === undefined) {
    throw new HttpsError('not-found', 'Partner not found')
  }
  const shop = await partner.getShop(srcEvent.shop_id)
  if (shop === undefined) {
    throw new HttpsError('not-found', 'Shop not found')
  }
  if (!isInShopTime(startTime, shop)) {
    throw new HttpsError('invalid-argument', 'Event time is not in shop time')
  }
  const now = Date.now()
  const newEvent = new ShokujiiEvent(null, {
    // スプレッド構文を使うとコピーすべきでないフィールドが混ざってしまうので、
    // 必要なフィールドを明示的に指定する
    community_id: srcEvent.community_id,
    community_name: srcEvent.community_name,
    community_account: srcEvent.community_account,
    is_public: srcEvent.is_public,
    event_payment: srcEvent.event_payment,
    event_max_people: srcEvent.event_max_people,
    event_postalcode: srcEvent.event_postalcode,
    event_address: srcEvent.event_address,
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

    // 更新するもの
    event_name: `${srcEvent.event_name} (Copy)`, // TODO: multilang
    event_status: {
      value: 'in_draft',
      shop_comment: '',
    },
    // とりあえず、いまのところは画像実体のコピーを行わないが将来的に修正する必要があるので注意
    // https://github.com/nijuniinc/bokudeli-event-new/issues/1655#issuecomment-3866496037
    event_cover_url: srcEvent.event_cover_url,
    event_start_datetime: startTime,
    event_end_datetime: startTime + srcEvent.event_end_datetime - srcEvent.event_start_datetime,
    event_deadline_datetime: startTime + srcEvent.event_deadline_datetime - srcEvent.event_start_datetime,
    members: [],
    created_at: now,
    updated_at: now,
    created_by: uid,
    updated_by: uid,
  })
  await saveEvent(uid, newEvent)

  // コピー元EventMenuのis_selected状態を引き継いで新規イベントにメニューをコピー
  const srcEventMenus = await srcEvent.getMenus()
  const selectedMenuIds = srcEventMenus.filter((m) => m.is_selected).map((m) => m.menu_id)
  await makeMenuSnapshot(srcEvent.partner_id, newEvent.id, startTime, selectedMenuIds)

  return {
    newEventId: newEvent.id,
  }
})
