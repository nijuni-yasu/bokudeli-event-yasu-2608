import { Event, EventDbSchema, ReservationRequiredSchema, convertEventToDb } from '../schemas/Event.js'
import { EventMenu } from '../schemas/EventMenu.js'
import { PartnerShop } from '../schemas/PartnerShop.js'
import { User } from '../schemas/User.js'
import { UserPersonalInformation } from '../schemas/UserPersonalInformation.js'
import { isValidEmail, isValidPhone } from './contactFormat.js'
import { isInShopTime } from './datetime.js'
import { EventLocationLatLng, isPartnerShopIdInDeliveryRange } from './partnerShopDeliverable.js'
import { getReservationLeadTimeMinMillis } from './reservationLeadTime.js'

/**
 * 予約申請バリデーションの不合格理由コード。
 * 表示順は配列順に従う（開催日時 → 店舗 → メニュー → 申請者 → 主催者/DB）。
 */
export const RESERVATION_REQUEST_REASON_CODES = [
  'EVENT_START_PAST',
  'EVENT_START_LEAD_TIME',
  'SHOP_NOT_FOUND',
  'SHOP_NOT_APPROVED',
  'SHOP_CLOSED',
  'SHOP_NOT_OPEN',
  'SHOP_NOT_IN_DELIVERY_AREA',
  'NO_ORDERABLE_MENU_SELECTED',
  'APPLICANT_USER_NAME_MISSING',
  'APPLICANT_USER_IMAGE_MISSING',
  'APPLICANT_EMAIL_MISSING',
  'ORGANIZER_FULLNAME_MISSING',
  'ORGANIZER_COMPANY_MISSING',
  'ORGANIZER_EMAIL_MISSING',
  'ORGANIZER_EMAIL_INVALID',
  'ORGANIZER_PHONE_PERSONAL_MISSING',
  'ORGANIZER_PHONE_PERSONAL_INVALID',
  'ORGANIZER_PHONE_COMPANY_INVALID',
  'ORGANIZER_MEMO_MISSING',
  'EVENT_DB_INVALID',
] as const

export type ReservationRequestReasonCode = (typeof RESERVATION_REQUEST_REASON_CODES)[number]

const REASON_CODE_ORDER: Partial<Record<ReservationRequestReasonCode, number>> = Object.fromEntries(
  RESERVATION_REQUEST_REASON_CODES.map((c, i) => [c, i] as const),
)

const ORGANIZER_PATH_TO_REASON: Record<string, ReservationRequestReasonCode> = {
  organizer_fullname: 'ORGANIZER_FULLNAME_MISSING',
  organizer_company: 'ORGANIZER_COMPANY_MISSING',
  organizer_email: 'ORGANIZER_EMAIL_MISSING',
  organizer_phone_personal: 'ORGANIZER_PHONE_PERSONAL_MISSING',
  organizer_memo: 'ORGANIZER_MEMO_MISSING',
}

export type ValidateReservationRequestInput = {
  event: Event
  handleUserId: string
  user: User
  personalInformation: UserPersonalInformation
  authEmail: string | null
  eventMenus: EventMenu[]
  partnerShops: PartnerShop[]
  location: EventLocationLatLng
  nowMillis: number
}

export type ValidateReservationRequestResult = { ok: true } | { ok: false; reasonCodes: ReservationRequestReasonCode[] }

/**
 * 予約申請可否の集約バリデーション（純関数）。
 * EventEdit.vue の予約申請ボタン押下時、および将来の Cloud Functions から共通で呼ぶ。
 *
 * 入力は全て必須。データ未取得（partnerShops 未ロード等）は UI 側で予約ボタン無効化により防ぐ前提。
 * 戻り値は理由コードのみで、UI 向けメッセージへの変換は base/src/utils/reservationRequestMessages.ts が担当する。
 */
export function validateReservationRequest(input: ValidateReservationRequestInput): ValidateReservationRequestResult {
  const { event, handleUserId, user, personalInformation, authEmail, eventMenus, partnerShops, location, nowMillis } =
    input
  const reasons = new Set<ReservationRequestReasonCode>()

  validateEventStart(event.event_start_datetime, nowMillis, reasons)
  validateShop(event.shop_id, event.event_start_datetime, partnerShops, location, reasons)
  validateMenus(eventMenus, reasons)
  validateApplicant(user, personalInformation, authEmail, reasons)
  validateEventDbAndOrganizer(event, handleUserId, reasons)

  if (reasons.size === 0) {
    return { ok: true }
  }
  const sorted = [...reasons].sort((a, b) => (REASON_CODE_ORDER[a] ?? 0) - (REASON_CODE_ORDER[b] ?? 0))
  return { ok: false, reasonCodes: sorted }
}

function validateEventStart(eventStartMillis: number, nowMillis: number, reasons: Set<ReservationRequestReasonCode>) {
  if (eventStartMillis < nowMillis) {
    reasons.add('EVENT_START_PAST')
    return
  }
  const leadTimeMin = getReservationLeadTimeMinMillis(nowMillis)
  if (eventStartMillis < leadTimeMin) {
    reasons.add('EVENT_START_LEAD_TIME')
  }
}

function validateShop(
  shopId: string,
  eventStartMillis: number,
  partnerShops: PartnerShop[],
  location: EventLocationLatLng,
  reasons: Set<ReservationRequestReasonCode>,
) {
  if (shopId === '') {
    reasons.add('SHOP_NOT_FOUND')
    return
  }
  const shop = partnerShops.find((s) => s.shop_id === shopId)
  if (shop == null) {
    reasons.add('SHOP_NOT_FOUND')
    return
  }
  if (!shop.is_approved) {
    reasons.add('SHOP_NOT_APPROVED')
    return
  }
  if (!shop.is_open) {
    reasons.add('SHOP_CLOSED')
    return
  }
  if (!isInShopTime(eventStartMillis, shop)) {
    reasons.add('SHOP_NOT_OPEN')
  }
  if (!isPartnerShopIdInDeliveryRange(shopId, location, partnerShops)) {
    reasons.add('SHOP_NOT_IN_DELIVERY_AREA')
  }
}

function validateMenus(eventMenus: EventMenu[], reasons: Set<ReservationRequestReasonCode>) {
  const orderable = eventMenus.filter((m) => m.is_selected && !m.is_sold_out)
  if (orderable.length === 0) {
    reasons.add('NO_ORDERABLE_MENU_SELECTED')
  }
}

function validateApplicant(
  user: User,
  personalInformation: UserPersonalInformation,
  authEmail: string | null,
  reasons: Set<ReservationRequestReasonCode>,
) {
  if (user.user_name === '') {
    reasons.add('APPLICANT_USER_NAME_MISSING')
  }
  if (user.user_image_url === '') {
    reasons.add('APPLICANT_USER_IMAGE_MISSING')
  }
  const personalEmail = personalInformation.user_email
  const fallbackEmail = authEmail ?? ''
  if (personalEmail === '' && fallbackEmail === '') {
    reasons.add('APPLICANT_EMAIL_MISSING')
  }
}

function validateEventDbAndOrganizer(event: Event, handleUserId: string, reasons: Set<ReservationRequestReasonCode>) {
  // EventDbSchema は主催者フィールドを NonEmptyStringSchema.optional() として扱い、
  // convertEventToDb 経由で空文字は FieldValue.delete() に変換されるため、ここで主催者個別の理由コードは付かない。
  // dbResult に issue があれば全て EVENT_DB_INVALID として一括扱いする。
  const dbResult = EventDbSchema.safeParse(convertEventToDb(event, handleUserId))
  if (!dbResult.success) {
    reasons.add('EVENT_DB_INVALID')
  }

  const reservationResult = ReservationRequiredSchema.safeParse({
    organizer_fullname: event.organizer_fullname,
    organizer_company: event.organizer_company,
    organizer_email: event.organizer_email,
    organizer_phone_personal: event.organizer_phone_personal,
    organizer_memo: event.organizer_memo,
  })
  if (!reservationResult.success) {
    for (const issue of reservationResult.error.issues) {
      const code = ORGANIZER_PATH_TO_REASON[issue.path.join('.')]
      if (code != null) {
        reasons.add(code)
      }
    }
  }

  validateOrganizerFormats(event, reasons)
}

function validateOrganizerFormats(event: Event, reasons: Set<ReservationRequestReasonCode>) {
  const email = event.organizer_email ?? ''
  if (email.trim() !== '' && !isValidEmail(email)) {
    reasons.add('ORGANIZER_EMAIL_INVALID')
  }

  const phonePersonal = event.organizer_phone_personal ?? ''
  if (phonePersonal.trim() !== '' && !isValidPhone(phonePersonal)) {
    reasons.add('ORGANIZER_PHONE_PERSONAL_INVALID')
  }

  const phoneCompany = event.organizer_phone_company ?? ''
  if (phoneCompany.trim() !== '' && !isValidPhone(phoneCompany)) {
    reasons.add('ORGANIZER_PHONE_COMPANY_INVALID')
  }
}
