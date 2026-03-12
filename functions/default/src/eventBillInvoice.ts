import crypto from 'crypto'
import path from 'path'
import { PassThrough, pipeline, Writable } from 'stream'
import { getAuth } from 'firebase-admin/auth'
import { onRequest, HttpsError } from 'firebase-functions/https'
import { DateTime } from 'luxon'
import { Storage } from '@google-cloud/storage'
import { convertNumberToYen } from '@shokujii/common/utils/converter.js'
import {
  convertToDate,
  convertToDuration,
  convertDateToId,
  getLastDayOfNextMonth,
} from '@shokujii/common/utils/datetime.js'
import {
  isEventAfterInvoiceFeeCutoff,
  calculateOrdersTotal,
  calculateInvoiceTaxBreakdown,
  aggregateOrderMenus,
} from '@shokujii/common/utils/invoice.js'
import { getEvent, getAcceptingOrderEventsByEndTime, type ShokujiiEvent } from './stores/event.js'
import { getCommunity, type ShokujiiCommunity } from './stores/community.js'
import { getEventUrl, getEventBillInvoiceDirectUrl } from './utils/urls.js'
import { DEFAULT_FROM, SUPPORT_MAIL } from './utils/mail.js'
import { createModuleLogger } from './utils/logger.js'
import * as sgMail from './utils/sendgrid.js'
import { PdfGenerator } from './utils/PdfGenerator.js'

const logger = createModuleLogger('eventBillInvoice')
const CORS_ORIGINS: string[] = (() => {
  const raw = process.env.CORS
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})()

const INVOICE_BUCKET_NAME = `gs://${process.env.GCLOUD_PROJECT}-invoice`

const TEMPLATE_PATH = path.join('templates', 'eventBillInvoice.docx')
const TEMPLATE2_PATH = path.join('templates', 'eventBillInvoice2.docx')

/** 請求書テンプレートの明細行数（1ページに収まるよう調整。不足分は空行でパディング） */
const INVOICE_ITEMS_PADDING = 12

const generateRandomBase64UrlSafeString = (byteLength = 32): string =>
  crypto.randomBytes(byteLength).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const getInvoiceFile = (eventId: string, invoiceId: string): ReturnType<ReturnType<Storage['bucket']>['file']> => {
  const storage = new Storage()
  const bucket = storage.bucket(INVOICE_BUCKET_NAME)
  return bucket.file(`${eventId}/${invoiceId}`)
}

const getInvoiceId = async (eventId: string): Promise<string | null> => {
  const storage = new Storage()
  const bucket = storage.bucket(INVOICE_BUCKET_NAME)
  const [files] = await bucket.getFiles({ prefix: `${eventId}/` })
  if (files.length === 1) {
    return files[0].name.replace(`${eventId}/`, '')
  }
  return null
}

/**
 * ReadableStream のデータを複数の WritableStream に同時にパイプする。
 * 各 writable の finish または close のどちらかで完了扱いとする。
 * HTTP レスポンス（res）はクライアント切断時に finish を発火せず close のみになることがあるため、
 * close も待機することで Promise のハングを防ぐ。
 * いずれかでエラーが発生した場合は全ストリームを destroy して reject する。
 */
const pipeToStreams = (readable: NodeJS.ReadableStream, ...writables: Writable[]): Promise<void> =>
  new Promise((resolve, reject) => {
    const passThrough = new PassThrough()
    let remaining = writables.length
    let settled = false

    const settleWithError = (err: unknown) => {
      if (settled) return
      settled = true
      passThrough.destroy()
      for (const w of writables) w.destroy()
      const r = readable as { destroy?: (err?: Error) => void }
      if (typeof r.destroy === 'function') r.destroy()
      reject(err)
    }

    const onWritableDone = () => {
      if (settled) return
      if (--remaining === 0) {
        settled = true
        resolve()
      }
    }

    for (const writable of writables) {
      passThrough.pipe(writable)
      let done = false
      const once = () => {
        if (done) return
        done = true
        onWritableDone()
      }
      writable.once('finish', once)
      writable.once('close', once)
      writable.on('error', settleWithError)
    }
    passThrough.on('error', settleWithError)
    readable.on('error', (err) => {
      passThrough.destroy(err instanceof Error ? err : new Error(String(err)))
      settleWithError(err)
    })
    readable.pipe(passThrough)
  })

/**
 * Cloud Storage から既存の請求書PDFを取得し writableStream にパイプする。
 * クライアント切断時（writable の close のみ発火）でも Promise が解決するようにする。
 */
const getEventBillInvoice = async (eventId: string, invoiceId: string, writableStream: Writable): Promise<void> => {
  const file = getInvoiceFile(eventId, invoiceId)
  const [exists] = await file.exists()
  if (!exists) {
    throw new Error(`File not found in bucket: ${file.name}`)
  }
  return new Promise((resolve, reject) => {
    let settled = false
    const settle = (err: Error | null | undefined) => {
      if (settled) return
      settled = true
      if (err != null) reject(err)
      else resolve()
    }

    const readable = file.createReadStream()
    writableStream.once('close', () => {
      if (!settled) {
        readable.destroy()
        settle(null) // クライアント切断時は完了扱い（resolve）で関数を終了させる
      }
    })
    pipeline(readable, writableStream, (err) => {
      settle(err)
    })
  })
}

/**
 * 請求書PDFを生成し Cloud Storage に保存する。
 * writableStream が指定された場合は HTTP レスポンスにもパイプする。
 */
const createEventBillInvoice = async (
  community: ShokujiiCommunity,
  event: ShokujiiEvent,
  writableStream?: Writable,
): Promise<string> => {
  const existingInvoiceId = await getInvoiceId(event.id)
  if (existingInvoiceId != null) {
    if (writableStream != null) {
      await getEventBillInvoice(event.id, existingInvoiceId, writableStream)
    }
    return existingInvoiceId
  }

  const orders = await event.getOrders('ordered')
  const tax08Inclusive = calculateOrdersTotal(orders)
  const menuSummary = aggregateOrderMenus(orders)

  // 請求手数料・税内訳
  const isAfterCutoff = isEventAfterInvoiceFeeCutoff(event.event_start_datetime)
  const taxBreakdown = calculateInvoiceTaxBreakdown(tax08Inclusive, event.event_start_datetime)
  const templatePath = isAfterCutoff ? TEMPLATE2_PATH : TEMPLATE_PATH

  // テンプレート用明細行
  const items: { name: string; count: number | string; price: string; totalPrice: string }[] = menuSummary.map((m) => ({
    name: m.name.substring(0, 21) + '(※)',
    count: m.count,
    price: convertNumberToYen(m.price),
    totalPrice: convertNumberToYen(m.totalPrice),
  }))

  if (isAfterCutoff) {
    items.push({
      name: '請求書払い手数料',
      count: 1,
      price: convertNumberToYen(taxBreakdown.tax10Inclusive),
      totalPrice: convertNumberToYen(taxBreakdown.tax10Inclusive),
    })
  }

  while (items.length < INVOICE_ITEMS_PADDING) {
    items.push({ name: '', count: '', price: '', totalPrice: '' })
  }

  const jsonDataForMerge = {
    number: convertDateToId(event.event_end_datetime),
    date: convertToDate(event.event_end_datetime),
    companyName: event.organizer_company,
    companyPersonName: event.bill_fullname,
    companyPostalCode: community.community_postalcode,
    companyAddress: community.community_address,
    companyPhoneNumber: community.community_phone,
    title: event.event_name.substring(0, 18),
    items,
    subTotal: convertNumberToYen(taxBreakdown.subTotal),
    tax: convertNumberToYen(taxBreakdown.tax),
    total: convertNumberToYen(taxBreakdown.total),
    tax10SubTotal: convertNumberToYen(taxBreakdown.tax10SubTotal),
    tax10: convertNumberToYen(taxBreakdown.tax10),
    tax8SubTotal: convertNumberToYen(taxBreakdown.tax8SubTotal),
    tax8: convertNumberToYen(taxBreakdown.tax8),
    deadline: convertToDate(getLastDayOfNextMonth(event.event_end_datetime)),
    eventName: event.event_name,
    eventDate: convertToDuration(event.event_start_datetime, event.event_end_datetime),
    shopName: event.shop_name,
    eventUrl: getEventUrl(event.community_account, event.id),
  }

  // PDF 生成
  const generatedInvoiceId = generateRandomBase64UrlSafeString()
  const pdfGenerator = new PdfGenerator()
  const readableStream = await pdfGenerator.executeDocumentMergeForStream(templatePath, jsonDataForMerge)
  const storageWriteStream = getInvoiceFile(event.id, generatedInvoiceId).createWriteStream()

  if (writableStream != null) {
    await pipeToStreams(readableStream, storageWriteStream, writableStream)
  } else {
    await pipeToStreams(readableStream, storageWriteStream)
  }

  return generatedInvoiceId
}

export const eventBillInvoice = onRequest(
  {
    cors: CORS_ORIGINS,
    timeoutSeconds: 120,
    secrets: ['PDF_SERVICES_CLIENT_ID', 'PDF_SERVICES_CLIENT_SECRET'],
  },
  async (req, res) => {
    const [, eventId] = req.path.split('/')
    if (!eventId) {
      res.status(400).send('Bad Request')
      return
    }

    // invoiceId 付きアクセスは認証不要で既存PDFを返却
    const invoiceId = req.query.id
    if (typeof invoiceId === 'string') {
      try {
        res.status(200).setHeader('Content-Type', 'application/pdf')
        await getEventBillInvoice(eventId, invoiceId, res)
      } catch {
        if (!res.headersSent) {
          res.status(404).send('Invoice not found')
        }
      }
      return
    }

    // JWT 認証
    const authHeader = req.headers.authorization ?? ''
    if (!authHeader.startsWith('JWT ')) {
      throw new HttpsError('unauthenticated', 'JWT token is required')
    }

    const idToken = authHeader.split('JWT ')[1]
    const decodedToken = await getAuth().verifyIdToken(idToken)
    const uid = decodedToken.uid

    const event = await getEvent(eventId)
    if (event == null) {
      res.status(404).send('Event not found')
      return
    }

    if (event.event_payment !== 'community_bill' || event.event_start_datetime > DateTime.now().toMillis()) {
      res.status(404).send('Event not found')
      return
    }

    const community = await getCommunity(event.community_id)
    if (community == null) {
      res.status(404).send('Community not found')
      return
    }

    const isManager = await community.hasRole(uid, 'manager')
    if (!isManager) {
      res.status(403).send('Forbidden')
      return
    }

    res.status(200).setHeader('Content-Type', 'application/pdf')
    await createEventBillInvoice(community, event, res)
  },
)

const EVENT_INVOICE_TEMPLATE_ID = 'd-48e3179255834b8bb895cd995b1aac28'

/**
 * イベント終了後に請求書PDFを生成し、主催者にメールで送信する（ポーリング用）
 */
export async function sendInvoiceMailToOrganizers(start: number, end: number): Promise<void> {
  const events = await getAcceptingOrderEventsByEndTime(start, end)
  const billEvents = events.filter((event) => event.event_payment === 'community_bill')

  await Promise.all(
    billEvents.map(async (event) => {
      try {
        const community = await getCommunity(event.community_id)
        if (community == null) {
          logger.warn(`Community not found: ${event.community_id}`)
          return
        }

        const to = event.bill_email?.trim()
        if (!to) {
          logger.warn(`bill_email is empty, skipping invoice mail: event_id=${event.id}`)
          return
        }

        const invoiceId = await createEventBillInvoice(community, event)

        const cc = event.organizer_email?.trim()

        await sgMail.send({
          to,
          from: DEFAULT_FROM,
          cc: cc && cc !== to ? cc : undefined,
          bcc: SUPPORT_MAIL,
          templateId: EVENT_INVOICE_TEMPLATE_ID,
          dynamicTemplateData: {
            company: event.organizer_company,
            person: event.bill_fullname,
            event_name: event.event_name,
            event_invoice_url: getEventBillInvoiceDirectUrl(event.id, invoiceId),
          },
        })
        logger.info('Invoice mail sent', { eventId: event.id, to })
      } catch (err) {
        logger.warn('Failed to send invoice mail', {
          error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
          eventId: event.id,
        })
      }
    }),
  )
}
