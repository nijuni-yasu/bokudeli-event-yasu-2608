import { describe, expect, it } from 'vitest'
import {
  collectEventBasicInfoValidationMessages,
  collectEventDetailValidationMessages,
} from './eventEditValidationMessages.js'

const alwaysValid = () => true
const alwaysRequiredFail = () => 'required'
const t = (key: string, params?: unknown[]) =>
  params != null && params.length > 0 ? `${key}:${String(params[0])}` : key

describe('collectEventBasicInfoValidationMessages', () => {
  it('必須未入力の開催場所項目を列挙する', () => {
    const messages = collectEventBasicInfoValidationMessages({
      event: {
        event_postalcode: '',
        event_address_base: '',
        event_address_detail: '',
        event_place_url: '',
      },
      requiredValidator: alwaysRequiredFail,
      postalCodeValidator: alwaysValid,
      urlValidator: alwaysValid,
      t,
    })

    expect(messages).toEqual([
      'event_edit.step1_validation.postalcode_missing',
      'event_edit.step1_validation.address_base_missing',
      'event_edit.step1_validation.address_detail_missing',
    ])
  })

  it('郵便番号形式不正と会場URL不正を返す', () => {
    const messages = collectEventBasicInfoValidationMessages({
      event: {
        event_postalcode: '123',
        event_address_base: '東京都千代田区',
        event_address_detail: '1-1',
        event_place_url: 'not-a-url',
      },
      requiredValidator: alwaysValid,
      postalCodeValidator: () => 'invalid postal',
      urlValidator: () => 'invalid url',
      t,
    })

    expect(messages).toEqual([
      'event_edit.step1_validation.postalcode_invalid',
      'event_edit.step1_validation.place_url_invalid',
    ])
  })
})

describe('collectEventDetailValidationMessages', () => {
  it('必須未入力のイベント詳細項目を列挙する', () => {
    const messages = collectEventDetailValidationMessages({
      event: {
        event_name: '',
        event_desc: '',
        event_max_people: 0,
        event_payment: 'user_advance',
        members: [],
        bill_fullname: '',
        bill_email: '',
      },
      hasCoverImage: false,
      isEnterpriseMode: false,
      requiredValidator: alwaysRequiredFail,
      requiredHtmlValidator: alwaysRequiredFail,
      positiveIntegerValidator: alwaysValid,
      emailValidator: alwaysValid,
      t,
    })

    expect(messages).toEqual([
      'event_edit.step4_validation.event_name_missing',
      'event_edit.step4_validation.event_cover_missing',
      'event_edit.step4_validation.event_desc_missing',
      'event_edit.step4_validation.max_people_missing',
    ])
  })

  it('community_bill 時の請求先とおごり金額を検証する', () => {
    const requiredIfEmpty = (v: unknown) => (v === '' ? 'required' : true)

    const messages = collectEventDetailValidationMessages({
      event: {
        event_name: 'タイトル',
        event_desc: '<p>本文</p>',
        event_max_people: 10,
        event_payment: 'community_bill',
        members: [],
        bill_fullname: '',
        bill_email: 'invalid',
        community_bill_settings: { type: 'discount', off_amount: 50 },
      },
      hasCoverImage: true,
      isEnterpriseMode: false,
      requiredValidator: requiredIfEmpty,
      requiredHtmlValidator: alwaysValid,
      positiveIntegerValidator: alwaysValid,
      emailValidator: () => 'invalid email',
      t,
    })

    expect(messages).toEqual([
      'event_edit.step4_validation.bill_fullname_missing',
      'event_edit.step4_validation.bill_email_invalid',
      'event_edit.step4_validation.off_amount_step',
    ])
  })

  it('表示開始人数が定員を超える場合にエラーを返す', () => {
    const messages = collectEventDetailValidationMessages({
      event: {
        event_name: 'タイトル',
        event_desc: '<p>本文</p>',
        event_max_people: 4,
        event_payment: 'user_advance',
        members: [],
        members_visible_min_count: 10,
        bill_fullname: '',
        bill_email: '',
      },
      hasCoverImage: true,
      isEnterpriseMode: false,
      requiredValidator: alwaysValid,
      requiredHtmlValidator: alwaysValid,
      positiveIntegerValidator: alwaysValid,
      emailValidator: alwaysValid,
      t,
    })

    expect(messages).toEqual(['event_edit.step4_validation.members_visible_threshold_exceeds_max_people'])
  })
})
