/** EventEdit ウィザード各 Step の v-form ルールと同等のモーダル用メッセージ収集 */

type FieldValidator = (value: unknown) => boolean | string

type TranslateFn = (key: string, params?: unknown[]) => string

const OFF_AMOUNT_STEP = 100

export type EventBasicInfoValidationFields = {
  event_postalcode: string
  event_address_base: string
  event_address_detail: string
  event_place_url: string
}

export type CollectEventBasicInfoValidationMessagesInput = {
  event: EventBasicInfoValidationFields
  requiredValidator: FieldValidator
  postalCodeValidator: FieldValidator
  urlValidator: FieldValidator
  t: TranslateFn
}

/**
 * Step 1 開催場所の v-form ルールと同等のチェックを行い、モーダル表示用メッセージを返す。
 */
export function collectEventBasicInfoValidationMessages(input: CollectEventBasicInfoValidationMessagesInput): string[] {
  const { event, requiredValidator, postalCodeValidator, urlValidator, t } = input
  const messages: string[] = []

  if (requiredValidator(event.event_postalcode) !== true) {
    messages.push(t('event_edit.step1_validation.postalcode_missing'))
  } else if (postalCodeValidator(event.event_postalcode) !== true) {
    messages.push(t('event_edit.step1_validation.postalcode_invalid'))
  }
  if (requiredValidator(event.event_address_base) !== true) {
    messages.push(t('event_edit.step1_validation.address_base_missing'))
  }
  if (requiredValidator(event.event_address_detail) !== true) {
    messages.push(t('event_edit.step1_validation.address_detail_missing'))
  }
  if (urlValidator(event.event_place_url) !== true) {
    messages.push(t('event_edit.step1_validation.place_url_invalid'))
  }

  return messages
}

export type EventDetailValidationFields = {
  event_name: string
  event_desc: string
  event_max_people: number
  event_payment: string
  members: string[]
  members_visible_min_count?: number
  bill_fullname: string
  bill_email: string
  community_bill_settings?: { type: 'free' | 'discount'; off_amount?: number }
}

export type CollectEventDetailValidationMessagesInput = {
  event: EventDetailValidationFields
  hasCoverImage: boolean
  isEnterpriseMode: boolean
  requiredValidator: FieldValidator
  requiredHtmlValidator: FieldValidator
  positiveIntegerValidator: FieldValidator
  emailValidator: FieldValidator
  t: TranslateFn
}

const validateOffAmountForModal = (v: number | string | undefined, t: TranslateFn): string | null => {
  if (v == null || v === '') {
    return t('event_edit.step4_validation.off_amount_missing')
  }
  const num = Number(v)
  if (!Number.isInteger(num) || num <= 0) {
    return t('event_edit.step4_validation.off_amount_invalid')
  }
  if (num % OFF_AMOUNT_STEP !== 0) {
    return t('event_edit.step4_validation.off_amount_step')
  }
  return null
}

/**
 * Step 4 イベント詳細の v-form ルールと同等のチェックを行い、モーダル表示用メッセージを返す。
 */
export function collectEventDetailValidationMessages(input: CollectEventDetailValidationMessagesInput): string[] {
  const {
    event,
    hasCoverImage,
    isEnterpriseMode,
    requiredValidator,
    requiredHtmlValidator,
    positiveIntegerValidator,
    emailValidator,
    t,
  } = input
  const messages: string[] = []

  if (requiredValidator(event.event_name) !== true) {
    messages.push(t('event_edit.step4_validation.event_name_missing'))
  }
  if (!hasCoverImage) {
    messages.push(t('event_edit.step4_validation.event_cover_missing'))
  }
  if (requiredHtmlValidator(event.event_desc) !== true) {
    messages.push(t('event_edit.step4_validation.event_desc_missing'))
  }
  if (requiredValidator(event.event_max_people) !== true) {
    messages.push(t('event_edit.step4_validation.max_people_missing'))
  } else if (positiveIntegerValidator(String(event.event_max_people)) !== true) {
    messages.push(t('event_edit.step4_validation.max_people_invalid'))
  } else if (event.event_max_people < event.members.length) {
    messages.push(t('event_detail.error_max_people', [event.members.length]))
  }

  if (
    !isEnterpriseMode &&
    event.members_visible_min_count != null &&
    event.event_max_people > 0 &&
    event.members_visible_min_count > event.event_max_people
  ) {
    messages.push(t('event_edit.step4_validation.members_visible_threshold_exceeds_max_people'))
  }

  if (!isEnterpriseMode && event.event_payment === 'community_bill') {
    if (requiredValidator(event.bill_fullname) !== true) {
      messages.push(t('event_edit.step4_validation.bill_fullname_missing'))
    }
    if (requiredValidator(event.bill_email) !== true) {
      messages.push(t('event_edit.step4_validation.bill_email_missing'))
    } else if (emailValidator(event.bill_email) !== true) {
      messages.push(t('event_edit.step4_validation.bill_email_invalid'))
    }
    if (event.community_bill_settings?.type === 'discount') {
      const offAmountMessage = validateOffAmountForModal(event.community_bill_settings.off_amount, t)
      if (offAmountMessage != null) {
        messages.push(offAmountMessage)
      }
    }
  }

  return messages
}
