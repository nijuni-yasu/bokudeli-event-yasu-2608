import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'
import { Event } from '../schemas/Event.js'
import { EventMenu } from '../schemas/EventMenu.js'
import { PartnerShop } from '../schemas/PartnerShop.js'
import { User } from '../schemas/User.js'
import { UserPersonalInformation } from '../schemas/UserPersonalInformation.js'
import { EVENT_RESERVATION_LEAD_TIME_DAYS } from '../constants/eventReservation.js'
import {
  ReservationRequestReasonCode,
  validateReservationRequest,
  ValidateReservationRequestInput,
} from './validateReservationRequest.js'

const tokyoStation = { longitude: 139.767125, latitude: 35.681236 }
const osakaStation = { longitude: 135.502165, latitude: 34.693738 }

/** JST 2026/06/01（月）09:00 のエポックを「いま」として基準とする */
function nowJst(): number {
  return DateTime.fromObject({ year: 2026, month: 6, day: 1, hour: 9, minute: 0 }, { zone: 'Asia/Tokyo' }).toMillis()
}

/** リードタイムを満たす最短の開催開始（JST 2026/06/04 12:00） */
function validEventStart(): number {
  return DateTime.fromObject({ year: 2026, month: 6, day: 4, hour: 12, minute: 0 }, { zone: 'Asia/Tokyo' }).toMillis()
}

function makeShop(shopId: string, lat: number, lon: number, overrides: Partial<PartnerShop> = {}): PartnerShop {
  return new PartnerShop('partner1', shopId, {
    shop_address_latitude: lat,
    shop_address_longitude: lon,
    is_approved: true,
    is_open: true,
    shop_name: `Shop ${shopId}`,
    ...overrides,
  })
}

function makeEvent(overrides: Partial<Event> = {}): Event {
  const start = validEventStart()
  return new Event('event1', {
    community_id: 'community1',
    community_name: 'コミュニティ1',
    community_account: 'community1',
    event_postalcode: '1000005',
    event_address_base: '東京都千代田区丸の内',
    event_start_datetime: start,
    event_end_datetime: start + 60 * 60 * 1000,
    event_deadline_datetime: start - 24 * 60 * 60 * 1000,
    partner_id: 'partner1',
    shop_id: 'shop1',
    shop_name: 'Shop shop1',
    event_name: 'テストイベント',
    event_payment: 'user_advance',
    event_max_people: 25,
    organizer_fullname: '主催者 太郎',
    organizer_company: 'テスト株式会社',
    organizer_email: 'organizer@example.com',
    organizer_phone_personal: '090-1234-5678',
    organizer_memo: '受取場所: 1F ロビー',
    is_public: true,
    is_deleted: false,
    members: [],
    created_at: nowJst() - 24 * 60 * 60 * 1000,
    created_by: 'handleUser',
    ...overrides,
  })
}

function makeMenu(menuId: string, overrides: Partial<EventMenu> = {}): EventMenu {
  return new EventMenu('event1', menuId, {
    menu_name: `Menu ${menuId}`,
    menu_description: `Desc ${menuId}`,
    menu_price: 1000,
    is_sold_out: false,
    is_selected: true,
    menu_sort_number: 0,
    ...overrides,
  })
}

function makeUser(overrides: Partial<User> = {}): User {
  return new User('handleUser', {
    user_name: '申請者 太郎',
    user_image_url: 'https://example.com/image.png',
    ...overrides,
  })
}

function makePersonalInformation(overrides: Partial<UserPersonalInformation> = {}): UserPersonalInformation {
  return new UserPersonalInformation('handleUser', {
    user_email: 'applicant@example.com',
    ...overrides,
  })
}

function buildInput(overrides: Partial<ValidateReservationRequestInput> = {}): ValidateReservationRequestInput {
  const shop = makeShop('shop1', tokyoStation.latitude, tokyoStation.longitude)
  return {
    event: makeEvent(),
    handleUserId: 'handleUser',
    user: makeUser(),
    personalInformation: makePersonalInformation(),
    authEmail: null,
    eventMenus: [makeMenu('menu1')],
    partnerShops: [shop],
    location: tokyoStation,
    nowMillis: nowJst(),
    ...overrides,
  }
}

describe('validateReservationRequest - 全条件 OK', () => {
  it('全項目が揃っていれば ok: true を返す', () => {
    const result = validateReservationRequest(buildInput())
    expect(result).toEqual({ ok: true })
  })
})

describe('validateReservationRequest - 開催日時', () => {
  it('過去日付なら EVENT_START_PAST', () => {
    const result = validateReservationRequest(
      buildInput({
        event: makeEvent({ event_start_datetime: nowJst() - 60 * 60 * 1000 }),
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toContain('EVENT_START_PAST')
    expect(result.reasonCodes).not.toContain('EVENT_START_LEAD_TIME')
  })

  it('リードタイム未満なら EVENT_START_LEAD_TIME', () => {
    const tooSoon = DateTime.fromObject(
      { year: 2026, month: 6, day: 3, hour: 23, minute: 59 },
      { zone: 'Asia/Tokyo' },
    ).toMillis()
    const result = validateReservationRequest(buildInput({ event: makeEvent({ event_start_datetime: tooSoon }) }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toContain('EVENT_START_LEAD_TIME')
  })

  it(`JST 当日 0:00 + ${EVENT_RESERVATION_LEAD_TIME_DAYS} 日の境界は EVENT_START_LEAD_TIME を出さない`, () => {
    const boundary = DateTime.fromObject(
      { year: 2026, month: 6, day: 4, hour: 0, minute: 0 },
      { zone: 'Asia/Tokyo' },
    ).toMillis()
    const result = validateReservationRequest(buildInput({ event: makeEvent({ event_start_datetime: boundary }) }))
    if (result.ok) return
    expect(result.reasonCodes).not.toContain('EVENT_START_LEAD_TIME')
    expect(result.reasonCodes).not.toContain('EVENT_START_PAST')
  })
})

describe('validateReservationRequest - 店舗', () => {
  it('shop_id が空文字なら SHOP_NOT_FOUND（店舗未選択を明示）', () => {
    const result = validateReservationRequest(buildInput({ event: makeEvent({ shop_id: '' }) }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toContain('SHOP_NOT_FOUND')
    expect(result.reasonCodes).not.toContain('SHOP_NOT_APPROVED')
    expect(result.reasonCodes).not.toContain('SHOP_CLOSED')
    expect(result.reasonCodes).not.toContain('SHOP_NOT_OPEN')
    expect(result.reasonCodes).not.toContain('SHOP_NOT_IN_DELIVERY_AREA')
  })

  it('shop_id がマスタにないと SHOP_NOT_FOUND（営業・配達は判定しない）', () => {
    const result = validateReservationRequest(
      buildInput({
        partnerShops: [makeShop('otherShop', tokyoStation.latitude, tokyoStation.longitude)],
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toContain('SHOP_NOT_FOUND')
    expect(result.reasonCodes).not.toContain('SHOP_NOT_APPROVED')
    expect(result.reasonCodes).not.toContain('SHOP_CLOSED')
    expect(result.reasonCodes).not.toContain('SHOP_NOT_OPEN')
    expect(result.reasonCodes).not.toContain('SHOP_NOT_IN_DELIVERY_AREA')
  })

  it('is_approved が false なら SHOP_NOT_APPROVEDのみ店舗系で返す', () => {
    const result = validateReservationRequest(
      buildInput({
        partnerShops: [makeShop('shop1', tokyoStation.latitude, tokyoStation.longitude, { is_approved: false })],
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toEqual(['SHOP_NOT_APPROVED'])
  })

  it('ドキュメントの is_open が false なら SHOP_CLOSEDのみ店舗系で返す', () => {
    const result = validateReservationRequest(
      buildInput({
        partnerShops: [makeShop('shop1', tokyoStation.latitude, tokyoStation.longitude, { is_open: false })],
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toEqual(['SHOP_CLOSED'])
  })

  it('開始時刻が営業時間外なら SHOP_NOT_OPEN（距離が範囲内なら SHOP_NOT_IN_DELIVERY_AREA は付かない）', () => {
    const earlyMorning = DateTime.fromObject(
      { year: 2026, month: 6, day: 4, hour: 5, minute: 0 },
      { zone: 'Asia/Tokyo' },
    ).toMillis()
    const result = validateReservationRequest(buildInput({ event: makeEvent({ event_start_datetime: earlyMorning }) }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toContain('SHOP_NOT_OPEN')
    expect(result.reasonCodes).not.toContain('SHOP_NOT_IN_DELIVERY_AREA')
  })

  it('店舗が配達圏外なら SHOP_NOT_IN_DELIVERY_AREA', () => {
    const result = validateReservationRequest(
      buildInput({
        partnerShops: [makeShop('shop1', osakaStation.latitude, osakaStation.longitude)],
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toContain('SHOP_NOT_IN_DELIVERY_AREA')
  })
})

describe('validateReservationRequest - メニュー', () => {
  it('注文可能メニューが 0 件なら NO_ORDERABLE_MENU_SELECTED', () => {
    const result = validateReservationRequest(buildInput({ eventMenus: [] }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toContain('NO_ORDERABLE_MENU_SELECTED')
  })

  it('全件売り切れなら NO_ORDERABLE_MENU_SELECTED', () => {
    const result = validateReservationRequest(buildInput({ eventMenus: [makeMenu('m1', { is_sold_out: true })] }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toContain('NO_ORDERABLE_MENU_SELECTED')
  })

  it('全件未選択なら NO_ORDERABLE_MENU_SELECTED', () => {
    const result = validateReservationRequest(buildInput({ eventMenus: [makeMenu('m1', { is_selected: false })] }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toContain('NO_ORDERABLE_MENU_SELECTED')
  })

  it('1 件でも is_selected かつ非売切なら合格', () => {
    const result = validateReservationRequest(
      buildInput({
        eventMenus: [makeMenu('m1', { is_selected: false }), makeMenu('m2', { is_sold_out: true }), makeMenu('m3')],
      }),
    )
    expect(result.ok).toBe(true)
  })
})

describe('validateReservationRequest - 申請ユーザー', () => {
  it('user_name が空なら APPLICANT_USER_NAME_MISSING', () => {
    const result = validateReservationRequest(buildInput({ user: makeUser({ user_name: '' }) }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toContain('APPLICANT_USER_NAME_MISSING')
  })

  it('user_image_url が空なら APPLICANT_USER_IMAGE_MISSING', () => {
    const result = validateReservationRequest(buildInput({ user: makeUser({ user_image_url: '' }) }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toContain('APPLICANT_USER_IMAGE_MISSING')
  })

  it('user_image_url が null（空文字に正規化）なら APPLICANT_USER_IMAGE_MISSING', () => {
    const result = validateReservationRequest(
      buildInput({ user: makeUser({ user_image_url: null as unknown as string }) }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toContain('APPLICANT_USER_IMAGE_MISSING')
  })

  it('personal email も auth email も空なら APPLICANT_EMAIL_MISSING', () => {
    const result = validateReservationRequest(
      buildInput({ personalInformation: makePersonalInformation({ user_email: '' }), authEmail: '' }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toContain('APPLICANT_EMAIL_MISSING')
  })

  it('personal email が空でも auth email があれば合格', () => {
    const result = validateReservationRequest(
      buildInput({
        personalInformation: makePersonalInformation({ user_email: '' }),
        authEmail: 'auth@example.com',
      }),
    )
    expect(result.ok).toBe(true)
  })
})

describe('validateReservationRequest - 主催者連絡先', () => {
  it.each([
    ['organizer_fullname', 'ORGANIZER_FULLNAME_MISSING'],
    ['organizer_company', 'ORGANIZER_COMPANY_MISSING'],
    ['organizer_email', 'ORGANIZER_EMAIL_MISSING'],
    ['organizer_phone_personal', 'ORGANIZER_PHONE_PERSONAL_MISSING'],
    ['organizer_memo', 'ORGANIZER_MEMO_MISSING'],
  ])('%s が空なら %s', (field, expected) => {
    const result = validateReservationRequest(buildInput({ event: makeEvent({ [field]: '' } as Partial<Event>) }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toContain(expected as ReservationRequestReasonCode)
  })

  it('全主催者項目が欠落していると 5 つ全てが列挙される', () => {
    const result = validateReservationRequest(
      buildInput({
        event: makeEvent({
          organizer_fullname: '',
          organizer_company: '',
          organizer_email: '',
          organizer_phone_personal: '',
          organizer_memo: '',
        }),
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toEqual(
      expect.arrayContaining([
        'ORGANIZER_FULLNAME_MISSING',
        'ORGANIZER_COMPANY_MISSING',
        'ORGANIZER_EMAIL_MISSING',
        'ORGANIZER_PHONE_PERSONAL_MISSING',
        'ORGANIZER_MEMO_MISSING',
      ]),
    )
  })

  it.each([
    ['organizer_email', 'abc', 'ORGANIZER_EMAIL_INVALID'],
    ['organizer_phone_personal', '12345', 'ORGANIZER_PHONE_PERSONAL_INVALID'],
    ['organizer_phone_company', '12345', 'ORGANIZER_PHONE_COMPANY_INVALID'],
  ])('%s が %s なら %s', (field, value, expected) => {
    const result = validateReservationRequest(buildInput({ event: makeEvent({ [field]: value } as Partial<Event>) }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toContain(expected as ReservationRequestReasonCode)
  })

  it('空の organizer_phone_company は形式エラーにならない', () => {
    const result = validateReservationRequest(buildInput({ event: makeEvent({ organizer_phone_company: '' }) }))
    expect(result.ok).toBe(true)
  })

  it('未入力の organizer_email では ORGANIZER_EMAIL_INVALID を付けない', () => {
    const result = validateReservationRequest(buildInput({ event: makeEvent({ organizer_email: '' }) }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toContain('ORGANIZER_EMAIL_MISSING')
    expect(result.reasonCodes).not.toContain('ORGANIZER_EMAIL_INVALID')
  })

  it('末尾空白付き organizer_email は v-form と同様に形式エラーになる', () => {
    const result = validateReservationRequest(
      buildInput({ event: makeEvent({ organizer_email: 'user@example.com ' }) }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toContain('ORGANIZER_EMAIL_INVALID')
  })

  it('空白のみの organizer_email では ORGANIZER_EMAIL_INVALID を付けない', () => {
    const result = validateReservationRequest(
      buildInput({ event: makeEvent({ organizer_email: '   ' }) }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toContain('ORGANIZER_EMAIL_MISSING')
    expect(result.reasonCodes).not.toContain('ORGANIZER_EMAIL_INVALID')
  })
})

describe('validateReservationRequest - DB 整合', () => {
  it('event_postalcode の形式が不正なら EVENT_DB_INVALID', () => {
    const result = validateReservationRequest(buildInput({ event: makeEvent({ event_postalcode: '1234' }) }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reasonCodes).toContain('EVENT_DB_INVALID')
  })
})

describe('validateReservationRequest - ソート順・重複排除', () => {
  it('複数の理由は固定順（開催日時 → 店舗 → メニュー → 申請者 → 主催者/DB）で返る', () => {
    const earlyMorning = DateTime.fromObject(
      { year: 2026, month: 6, day: 4, hour: 5, minute: 0 },
      { zone: 'Asia/Tokyo' },
    ).toMillis()
    const result = validateReservationRequest(
      buildInput({
        event: makeEvent({
          event_start_datetime: earlyMorning,
          organizer_fullname: '',
        }),
        eventMenus: [],
        user: makeUser({ user_name: '' }),
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    const codes = result.reasonCodes
    const idxShopOpen = codes.indexOf('SHOP_NOT_OPEN')
    const idxNoMenu = codes.indexOf('NO_ORDERABLE_MENU_SELECTED')
    const idxApplicant = codes.indexOf('APPLICANT_USER_NAME_MISSING')
    const idxOrganizer = codes.indexOf('ORGANIZER_FULLNAME_MISSING')
    expect(idxShopOpen).toBeGreaterThanOrEqual(0)
    expect(idxShopOpen).toBeLessThan(idxNoMenu)
    expect(idxNoMenu).toBeLessThan(idxApplicant)
    expect(idxApplicant).toBeLessThan(idxOrganizer)
  })

  it('同じ理由は重複しない', () => {
    const result = validateReservationRequest(buildInput({ event: makeEvent({ organizer_email: '' }) }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    const occurrences = result.reasonCodes.filter((c) => c === 'ORGANIZER_EMAIL_MISSING').length
    expect(occurrences).toBe(1)
  })
})
