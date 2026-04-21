/**
 * Dynamic Template + personalizations による一括メール送信（同一メッセージ設定・宛先ごとに dynamicTemplateData）。
 *
 * このファイルを使用するには、呼び出し元の Cloud Function のオプションに
 * `secrets: ['SENDGRID_API_KEY']` を指定すること。
 *
 * 仕様: documents/06_メール通知/メール_一括送信_personalizations.md（v1）
 */
import sgMail from '@sendgrid/mail'
import type { ClientResponse, MailDataRequired } from '@sendgrid/mail'
import type { PersonalizationData } from '@sendgrid/helpers/classes/personalization'
import { defineSecret } from 'firebase-functions/params'
import { createModuleLogger } from './logger.js'

const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY')

const logger = createModuleLogger('sendgridBulk')

/** SendGrid personalizations の 1 リクエストあたりの最大件数 */
const BATCH_SIZE = 1000

/** letter.ts の個別送信と同程度の簡易チェック。無効宛先は personalizations に含めず除外する */
const BASIC_EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** {@link BASIC_EMAIL_FORMAT_REGEX} に基づきメールアドレス形式が妥当か判定する */
const isValidEmailFormat = (email: string): boolean => BASIC_EMAIL_FORMAT_REGEX.test(email)

/** 初回 429 後の待ちで Retry-After が無いときの待機ミリ秒（1 段のみ・最大 1 回再試行） */
const DEFAULT_429_BACKOFF_MS = 1000

export interface SendDynamicTemplateBulkMessage {
  from: MailDataRequired['from']
  templateId: string
  subject?: string
  replyTo?: MailDataRequired['replyTo']
  /** 全バッチ共通の BCC（各バッチで同一 `message` を渡すことで全宛先に同じ BCC が付く） */
  bcc?: MailDataRequired['bcc']
  asm?: MailDataRequired['asm']
  categories?: MailDataRequired['categories']
  mailSettings?: MailDataRequired['mailSettings']
  trackingSettings?: MailDataRequired['trackingSettings']
}

export interface SendDynamicTemplateBulkRecipient {
  to: string | { email: string; name?: string }
  /** SendGrid Dynamic Template に渡すテンプレ用データ（JSON 互換のキー値） */
  dynamicTemplateData: Record<string, unknown>
}

/** ログ用（PII を載せすぎない） */
export interface SendDynamicTemplateBulkContext {
  feature?: string
  eventId?: string
  communityId?: string
  letterId?: string
  [key: string]: string | number | undefined
}

export interface SendDynamicTemplateBulkError {
  batchIndex: number
  recipientCount: number
  reason: string
  statusCode?: number
  retryCountOn429: 0 | 1
}

export interface SendDynamicTemplateBulkResult {
  batchesAttempted: number
  batchesSucceeded: number
  /** 送信 API を試みたバッチのうち失敗した件数（共通設定不正のみのときは 0） */
  batchesFailed: number
  totalRecipientsAccepted: number
  /** 共通設定不正・バッチ送信失敗・personalizations 組み立て失敗など。空でなければ呼び出し側でログ検討 */
  errors: SendDynamicTemplateBulkError[]
}

/** 指定ミリ秒だけ非同期で待機する（HTTP 429 再試行前の待機など） */
const sleepMs = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

/** SendGrid の宛先表示名に使えない文字（含む場合は名前を落とす） */
const INVALID_NAME_CHARS = /[;,]/

/**
 * 宛先 `to` の解析結果。判別共用体。
 * {@link filterValidRecipients} と {@link normalizeToEmailData} の判定の唯一のソース。
 */
type ParsedRecipientTo = { kind: 'empty' } | { kind: 'invalidFormat' } | { kind: 'ok'; email: string; name?: string }

/**
 * 宛先 `to`（文字列またはオブジェクト）を解析し、空・形式不正・有効に分類する。
 * ランタイムで壊れたオブジェクト（`null`・非オブジェクト・`email` 非文字列など）は empty 扱い。
 */
const parseRecipientTo = (to: SendDynamicTemplateBulkRecipient['to']): ParsedRecipientTo => {
  if (typeof to === 'string') {
    const email = to.trim()
    if (email === '') {
      return { kind: 'empty' }
    }
    if (!isValidEmailFormat(email)) {
      return { kind: 'invalidFormat' }
    }
    return { kind: 'ok', email }
  }
  if (to === null || typeof to !== 'object') {
    return { kind: 'empty' }
  }
  const raw = to as { email?: unknown; name?: unknown }
  if (typeof raw.email !== 'string') {
    return { kind: 'empty' }
  }
  const email = raw.email.trim()
  if (email === '') {
    return { kind: 'empty' }
  }
  if (!isValidEmailFormat(email)) {
    return { kind: 'invalidFormat' }
  }
  if (typeof raw.name === 'string' && raw.name !== '') {
    return { kind: 'ok', email, name: raw.name }
  }
  return { kind: 'ok', email }
}

/**
 * 解析済みの宛先を SendGrid が受け付ける `to` / `from` 互換の形に正規化する。
 * 表示名に `;` または `,` が含まれる場合は名前を落とし警告ログを出す。
 */
const normalizeToEmailData = (
  to: SendDynamicTemplateBulkRecipient['to'],
): { emailData: MailDataRequired['from']; droppedName?: boolean } | null => {
  const parsed = parseRecipientTo(to)
  if (parsed.kind !== 'ok') {
    return null
  }
  const { email, name } = parsed
  if (name !== undefined && name !== '' && INVALID_NAME_CHARS.test(name)) {
    logger.warn('Recipient name contains invalid characters for SendGrid; sending without name', {
      emailSuffix: email.length > 3 ? `***${email.slice(-3)}` : '***',
    })
    return { emailData: { email }, droppedName: true }
  }
  if (name === undefined || name === '') {
    return { emailData: { email } }
  }
  return { emailData: { email, name } }
}

/**
 * 受信者配列から SendGrid 用の `PersonalizationData[]` を組み立てる。
 * 各 `to` は {@link normalizeToEmailData} で正規化する。
 */
const buildPersonalizations = (recipients: SendDynamicTemplateBulkRecipient[]): PersonalizationData[] => {
  return recipients.map((r) => {
    const normalized = normalizeToEmailData(r.to)
    if (normalized === null) {
      throw new Error('Invalid recipient in buildPersonalizations')
    }
    return {
      to: normalized.emailData,
      dynamicTemplateData: r.dynamicTemplateData,
    }
  })
}

/**
 * 共通メッセージ設定と personalizations から `MailDataRequired` を組み立てる。
 * オプション項目（subject, replyTo 等）は定義されているときだけペイロードに含める。
 */
const buildMailPayload = (
  message: SendDynamicTemplateBulkMessage,
  personalizations: PersonalizationData[],
): MailDataRequired => {
  const payload: MailDataRequired = {
    from: message.from,
    templateId: message.templateId,
    personalizations,
  }
  if (message.subject !== undefined) {
    payload.subject = message.subject
  }
  if (message.replyTo !== undefined) {
    payload.replyTo = message.replyTo
  }
  if (message.bcc !== undefined) {
    payload.bcc = message.bcc
  }
  if (message.asm !== undefined) {
    payload.asm = message.asm
  }
  if (message.categories !== undefined) {
    payload.categories = message.categories
  }
  if (message.mailSettings !== undefined) {
    payload.mailSettings = message.mailSettings
  }
  if (message.trackingSettings !== undefined) {
    payload.trackingSettings = message.trackingSettings
  }
  return payload
}

/** SendGrid / axios 風の catch エラーから `statusCode` 等を取り出すための最小形 */
type SendGridErrorShape = {
  response?: {
    statusCode?: number
    body?: unknown
    headers?: Record<string, string | string[] | undefined>
  }
  message?: string
}

/** エラーオブジェクトから HTTP ステータスコードを取得する。取得できなければ `undefined` */
const getErrorStatusCode = (error: unknown): number | undefined => {
  if (error && typeof error === 'object' && 'response' in error) {
    const e = error as SendGridErrorShape
    return e.response?.statusCode
  }
  return undefined
}

/**
 * レスポンスヘッダの `Retry-After` をミリ秒に変換する。
 * 秒数（整数）と HTTP-date の両方に対応する。
 */
const getRetryAfterMs = (headers: Record<string, string | string[] | undefined> | undefined): number | undefined => {
  if (headers === undefined) {
    return undefined
  }
  const rawHeader = headers['retry-after'] ?? headers['Retry-After']
  const raw = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader
  if (raw === undefined || raw === '') {
    return undefined
  }
  const asSeconds = Number.parseInt(raw, 10)
  if (!Number.isNaN(asSeconds)) {
    return asSeconds * 1000
  }
  const parsed = Date.parse(raw)
  if (!Number.isNaN(parsed)) {
    return Math.max(0, parsed - Date.now())
  }
  return undefined
}

/** ログや戻り値用にエラーを人が読める文字列に整形する */
const formatSendGridErrorReason = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

/**
 * 1 バッチ分のメールを送信する。
 * HTTP 429 のときのみ {@link getRetryAfterMs} またはデフォルト待機のあと最大 1 回再試行する（合計最大 2 回の API 呼び出し）。
 * 5xx・ネットワークエラーは再送しない。
 */
const sendSingleBatchWith429Retry = async (
  mailPayload: MailDataRequired,
): Promise<
  | { ok: true; response: [ClientResponse, object]; retryCountOn429: 0 | 1 }
  | { ok: false; reason: string; statusCode?: number; retryCountOn429: 0 | 1 }
> => {
  sgMail.setApiKey(SENDGRID_API_KEY.value())

  /** 同一ペイロードで SendGrid API に 1 回送信する */
  const attemptSend = async (): Promise<[ClientResponse, object]> => {
    return sgMail.send(mailPayload)
  }

  try {
    const response = await attemptSend()
    return { ok: true, response, retryCountOn429: 0 }
  } catch (firstError: unknown) {
    const status = getErrorStatusCode(firstError)
    if (status !== 429) {
      return {
        ok: false,
        reason: formatSendGridErrorReason(firstError),
        statusCode: status,
        retryCountOn429: 0,
      }
    }

    const e = firstError as SendGridErrorShape
    const waitMs = getRetryAfterMs(e.response?.headers) ?? DEFAULT_429_BACKOFF_MS
    await sleepMs(waitMs)

    try {
      const response = await attemptSend()
      return { ok: true, response, retryCountOn429: 1 }
    } catch (secondError: unknown) {
      return {
        ok: false,
        reason: formatSendGridErrorReason(secondError),
        statusCode: getErrorStatusCode(secondError),
        retryCountOn429: 1,
      }
    }
  }
}

/**
 * {@link parseRecipientTo} に基づき、空または形式不正の宛先を除外した受信者配列を返す。
 * 除外件数は警告ログに集計する。
 */
const filterValidRecipients = (recipients: SendDynamicTemplateBulkRecipient[]): SendDynamicTemplateBulkRecipient[] => {
  const valid: SendDynamicTemplateBulkRecipient[] = []
  let invalidEmptyCount = 0
  let invalidFormatCount = 0
  for (const r of recipients) {
    const parsed = parseRecipientTo(r.to)
    if (parsed.kind === 'empty') {
      invalidEmptyCount++
      continue
    }
    if (parsed.kind === 'invalidFormat') {
      invalidFormatCount++
      continue
    }
    valid.push(r)
  }
  if (invalidEmptyCount > 0 || invalidFormatCount > 0) {
    logger.warn('Filtered out invalid recipients', {
      invalidEmptyCount,
      invalidFormatCount,
      totalCount: recipients.length,
    })
  }
  return valid
}

/** `from` が未設定・空・空白のみでないことを検証する */
const validateFromField = (from: MailDataRequired['from']): boolean => {
  if (from === undefined || from === null) {
    return false
  }
  if (typeof from === 'string') {
    return from.trim() !== ''
  }
  if (typeof from === 'object' && 'email' in from) {
    const email = (from as { email?: string }).email
    return typeof email === 'string' && email.trim() !== ''
  }
  return false
}

/**
 * `replyTo` が未指定なら有効。文字列または `{ email }` 形式でメールが空でないことを検証する。
 * 想定外の型は不正とする。
 */
const validateReplyToField = (replyTo: MailDataRequired['replyTo'] | undefined): boolean => {
  if (replyTo === undefined) {
    return true
  }
  if (typeof replyTo === 'string') {
    return replyTo.trim() !== ''
  }
  if (typeof replyTo === 'object' && replyTo !== null && 'email' in replyTo) {
    const email = (replyTo as { email?: unknown }).email
    return typeof email === 'string' && email.trim() !== ''
  }
  return false
}

/**
 * 共通メッセージ設定の検証。sendgrid.ts の isValidMailData と同様に空・空白のみを弾く。
 * 失敗時は理由文字列を返す。
 */
const validateBulkMessage = (message: SendDynamicTemplateBulkMessage): string | null => {
  if (!validateFromField(message.from)) {
    return 'from is missing or empty'
  }
  if (typeof message.templateId !== 'string' || message.templateId.trim() === '') {
    return 'templateId is missing or empty'
  }
  if (!validateReplyToField(message.replyTo)) {
    return 'replyTo is whitespace only or invalid'
  }
  if (message.subject !== undefined && typeof message.subject === 'string' && message.subject.trim() === '') {
    return 'subject is whitespace only'
  }
  return null
}

/** 配列を指定サイズのチャンクに分割する（{@link BATCH_SIZE} 上限用） */
const chunk = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}

/**
 * Dynamic Template と personalizations により一括メール送信する。
 *
 * - {@link validateBulkMessage} で共通設定を検証し、失敗時は `errors` に理由を載せて返す（`batchesFailed` は 0・バッチは未試行）
 * - {@link filterValidRecipients} で無効宛先を除外
 * - {@link BATCH_SIZE} 件ずつ {@link chunk} し、バッチは逐次送信（並列にしない）
 * - HTTP 429 のみ {@link sendSingleBatchWith429Retry} で再試行
 *
 * @param message 共通の from / templateId 等
 * @param recipients 宛先ごとの `dynamicTemplateData` を含む配列
 * @param context ログ用。PII を載せすぎないキーに留める
 */
export async function sendDynamicTemplateWithPersonalizations(
  message: SendDynamicTemplateBulkMessage,
  recipients: SendDynamicTemplateBulkRecipient[],
  context?: SendDynamicTemplateBulkContext,
): Promise<SendDynamicTemplateBulkResult> {
  const messageError = validateBulkMessage(message)
  if (messageError !== null) {
    logger.error('Invalid bulk message configuration', {
      ...context,
      reason: messageError,
    })
    return {
      batchesAttempted: 0,
      batchesSucceeded: 0,
      batchesFailed: 0,
      totalRecipientsAccepted: 0,
      errors: [
        {
          batchIndex: 0,
          recipientCount: recipients.length,
          reason: messageError,
          retryCountOn429: 0,
        },
      ],
    }
  }

  const validRecipients = filterValidRecipients(recipients)

  if (validRecipients.length === 0) {
    logger.info('No recipients to send; skipping', {
      ...context,
      originalCount: recipients.length,
    })
    return {
      batchesAttempted: 0,
      batchesSucceeded: 0,
      batchesFailed: 0,
      totalRecipientsAccepted: 0,
      errors: [],
    }
  }

  const batches = chunk(validRecipients, BATCH_SIZE)
  const totalBatches = batches.length

  let batchesAttempted = 0
  let batchesSucceeded = 0
  let batchesFailed = 0
  let totalRecipientsAccepted = 0
  const errors: SendDynamicTemplateBulkError[] = []

  for (let i = 0; i < batches.length; i++) {
    const batchIndex = i
    const batchRecipients = batches[i] ?? []
    const recipientCount = batchRecipients.length
    batchesAttempted++

    let personalizations: PersonalizationData[]
    try {
      personalizations = buildPersonalizations(batchRecipients)
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : `Failed to build personalizations: ${String(err)}`
      logger.error('Failed to build personalizations for batch', {
        ...context,
        batchIndex,
        totalBatches,
        recipientCountInBatch: recipientCount,
        reason,
      })
      batchesFailed++
      errors.push({
        batchIndex,
        recipientCount,
        reason,
        retryCountOn429: 0,
      })
      continue
    }

    const mailPayload = buildMailPayload(message, personalizations)

    const result = await sendSingleBatchWith429Retry(mailPayload)

    if (result.ok) {
      batchesSucceeded++
      totalRecipientsAccepted += recipientCount
      const statusCode = result.response[0]?.statusCode
      logger.info('SendGrid bulk batch sent', {
        ...context,
        batchIndex,
        totalBatches,
        recipientCountInBatch: recipientCount,
        statusCode,
        retryCountOn429: result.retryCountOn429,
      })
      continue
    }

    batchesFailed++
    errors.push({
      batchIndex,
      recipientCount,
      reason: result.reason,
      statusCode: result.statusCode,
      retryCountOn429: result.retryCountOn429,
    })

    logger.warn('SendGrid bulk batch failed', {
      ...context,
      batchIndex,
      totalBatches,
      recipientCountInBatch: recipientCount,
      statusCode: result.statusCode,
      retryCountOn429: result.retryCountOn429,
      reason: result.reason,
    })
  }

  if (batchesFailed > 0) {
    logger.warn('SendGrid bulk completed with failures', {
      ...context,
      batchesAttempted,
      batchesSucceeded,
      batchesFailed,
      totalRecipientsAccepted,
    })
  } else {
    logger.info('SendGrid bulk completed', {
      ...context,
      batchesAttempted,
      batchesSucceeded,
      totalRecipientsAccepted,
    })
  }

  return {
    batchesAttempted,
    batchesSucceeded,
    batchesFailed,
    totalRecipientsAccepted,
    errors,
  }
}
