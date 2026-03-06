import crypto from 'crypto'
import path from 'path'
import { PassThrough, pipeline, Writable } from 'stream'
import { getAuth } from 'firebase-admin/auth'
import { onRequest, HttpsError } from 'firebase-functions/https'
import { defineList } from 'firebase-functions/params'
import { Storage } from '@google-cloud/storage'
import { convertNumberToYen } from '@shokujii/common/utils/converter.js'
import {
  convertToDate,
  convertToDuration,
  convertDateToId,
  getLastDayOfNextMonth,
} from '@shokujii/common/utils/datetime.js'
import {
  CUTOFF_UNIX_TIME_2025_11_01_JST,
  calculateInvoiceFee,
  calculateOrdersTotal,
} from '@shokujii/common/utils/invoice.js'
import { getEvent, getAcceptingOrderEventsByEndTime, type ShokujiiEvent } from './stores/event.js'
import { getCommunity, type ShokujiiCommunity } from './stores/community.js'
import { getEventUrl, getEventBillInvoiceDirectUrl } from './utils/urls.js'
import { DEFAULT_FROM, SUPPORT_MAIL } from './utils/mail.js'
import { createModuleLogger } from './utils/logger.js'
import * as sgMail from './utils/sendgrid.js'
import { PdfGenerator } from './utils/PdfGenerator.js'

const CORS = defineList('CORS')
const logger = createModuleLogger('eventBillInvoice')

const INVOICE_BUCKET_NAME = `gs://${process.env.GCLOUD_PROJECT}-invoice`

const TEMPLATE_PATH = path.join('templates', 'eventBillInvoice.docx')
const TEMPLATE2_PATH = path.join('templates', 'eventBillInvoice2.docx')

/** 請求書テンプレートの明細行数（1ページに収まるよう調整。不足分は空行でパディング） */
const INVOICE_ITEMS_PADDING = 12

const generateRandomBase64UrlSafeString = (byteLength = 32): string =>
  crypto.randomBytes(byteLength).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const getInvoiceFile = (eventId: string, invoiceId: string) => {
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
 * ReadableStream のデータを複数の WritableStream に同時にパイプする
 */
const pipeToStreams = (readable: NodeJS.ReadableStream, ...writables: Writable[]): Promise<void> =>
  new Promise((resolve, reject) => {
    const passThrough = new PassThrough()
    let remaining = writables.length
    for (const writable of writables) {
      passThrough.pipe(writable)
      writable.on('finish', () => {
        if (--remaining === 0) resolve()
      })
      writable.on('error', reject)
    }
    passThrough.on('error', reject)
    readable.on('error', (err) => {
      passThrough.destroy(err instanceof Error ? err : new Error(String(err)))
      reject(err)
    })
    readable.pipe(passThrough)
  })

/**
 * Cloud Storage から既存の請求書PDFを取得し writableStream にパイプする
 */
const getEventBillInvoice = async (eventId: string, invoiceId: string, writableStream: Writable): Promise<void> => {
  const file = getInvoiceFile(eventId, invoiceId)
  const [exists] = await file.exists()
  if (!exists) {
    throw new Error(`File not found in bucket: ${file.name}`)
  }
  return new Promise((resolve, reject) => {
    pipeline(file.createReadStream(), writableStream, (err) => {
      if (err) reject(err)
      else resolve()
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

  // メニュー別集計（テンプレートの items 生成用）
  const menuMap = new Map<string, { name: string; price: number; count: number; totalPrice: number }>()
  for (const order of orders) {
    for (const menu of order.menus) {
      const menuTotal = menu.price * menu.count
      const existing = menuMap.get(menu.menu_id)
      if (existing != null) {
        existing.count += menu.count
        existing.totalPrice += menuTotal
      } else {
        menuMap.set(menu.menu_id, {
          name: menu.name.substring(0, 21) + '(※)',
          price: menu.price,
          count: menu.count,
          totalPrice: menuTotal,
        })
      }
    }
  }

  // 請求手数料
  const isAfterCutoff = event.event_start_datetime >= CUTOFF_UNIX_TIME_2025_11_01_JST
  const fee = calculateInvoiceFee(tax08Inclusive, event.event_start_datetime)
  const tax10Inclusive = fee
  const templatePath = isAfterCutoff ? TEMPLATE2_PATH : TEMPLATE_PATH

  // テンプレート用明細行
  const items: { name: string; count: number | string; price: string; totalPrice: string }[] = Array.from(
    menuMap.values(),
  ).map((m) => ({
    name: m.name,
    count: m.count,
    price: convertNumberToYen(m.price),
    totalPrice: convertNumberToYen(m.totalPrice),
  }))

  if (isAfterCutoff) {
    items.push({
      name: '請求書払い手数料',
      count: 1,
      price: convertNumberToYen(fee),
      totalPrice: convertNumberToYen(fee),
    })
  }

  while (items.length < 14) {
    items.push({ name: '', count: '', price: '', totalPrice: '' })
  }

  // 税計算
  const total = tax08Inclusive + tax10Inclusive
  const tax8SubTotal = Math.floor(tax08Inclusive / 1.08)
  const tax8 = tax08Inclusive - tax8SubTotal
  const tax10SubTotal = Math.floor(tax10Inclusive / 1.1)
  const tax10 = tax10Inclusive - tax10SubTotal
  const tax = tax8 + tax10
  const subTotal = tax8SubTotal + tax10SubTotal

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
    subTotal: convertNumberToYen(subTotal),
    tax: convertNumberToYen(tax),
    total: convertNumberToYen(total),
    tax10SubTotal: convertNumberToYen(tax10SubTotal),
    tax10: convertNumberToYen(tax10),
    tax8SubTotal: convertNumberToYen(tax8SubTotal),
    tax8: convertNumberToYen(tax8),
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
    cors: CORS,
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

    if (event.event_payment !== 'community_bill' || event.event_start_datetime > Date.now()) {
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
