import type { ReservationRequestReasonCode } from '@shokujii/common/utils/validateReservationRequest.js'

/**
 * 予約申請バリデーションの理由コードと、UI 表示に用いる i18n キーの対応表。
 * Record の型により全コードのキーがコンパイル時に揃う。
 * キーは base/src/locales/messages/ja.ts の `reservation_request_reason.*` と一致させる。
 */
const REASON_CODE_TO_I18N_KEY: Record<ReservationRequestReasonCode, string> = {
  EVENT_START_PAST: 'reservation_request_reason.event_start_past',
  EVENT_START_LEAD_TIME: 'reservation_request_reason.event_start_lead_time',
  SHOP_NOT_FOUND: 'reservation_request_reason.shop_not_found',
  SHOP_NOT_APPROVED: 'reservation_request_reason.shop_not_approved',
  SHOP_CLOSED: 'reservation_request_reason.shop_closed',
  SHOP_NOT_OPEN: 'reservation_request_reason.shop_not_open',
  SHOP_NOT_IN_DELIVERY_AREA: 'reservation_request_reason.shop_not_in_delivery_area',
  NO_ORDERABLE_MENU_SELECTED: 'reservation_request_reason.no_orderable_menu_selected',
  APPLICANT_USER_NAME_MISSING: 'reservation_request_reason.applicant_user_name_missing',
  APPLICANT_USER_IMAGE_MISSING: 'reservation_request_reason.applicant_user_image_missing',
  APPLICANT_EMAIL_MISSING: 'reservation_request_reason.applicant_email_missing',
  ORGANIZER_FULLNAME_MISSING: 'reservation_request_reason.organizer_fullname_missing',
  ORGANIZER_COMPANY_MISSING: 'reservation_request_reason.organizer_company_missing',
  ORGANIZER_EMAIL_MISSING: 'reservation_request_reason.organizer_email_missing',
  ORGANIZER_PHONE_PERSONAL_MISSING: 'reservation_request_reason.organizer_phone_personal_missing',
  ORGANIZER_MEMO_MISSING: 'reservation_request_reason.organizer_memo_missing',
  EVENT_DB_INVALID: 'reservation_request_reason.event_db_invalid',
}

/**
 * 予約申請バリデーションの理由コード配列を、UI に表示する文言配列に変換する。
 * 入力順をそのまま保つ（並び替えは validateReservationRequest 側で実施済み）。
 */
export function reasonCodesToMessages(
  reasonCodes: ReservationRequestReasonCode[],
  t: (key: string) => string,
): string[] {
  return reasonCodes.map((code) => t(REASON_CODE_TO_I18N_KEY[code]))
}
