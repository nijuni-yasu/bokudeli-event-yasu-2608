import crypto from 'crypto'
import path from 'path'
import { PassThrough, pipeline, Writable } from 'stream'
import { getAuth } from 'firebase-admin/auth'
import { onRequest, HttpsError } from 'firebase-functions/https'
import { Storage } from '@google-cloud/storage'
import { buildEnterpriseInvoiceMergeData } from '@shokujii/common/utils/enterpriseInvoice.js'
import { getEnterpriseById } from './stores/enterprise.js'
import { getBillingSnapshot } from './stores/enterpriseBillingSnapshot.js'
import { getInvoiceFileMeta, setInvoiceFileMeta } from './stores/enterpriseInvoiceFile.js'
import { assertEnterpriseAdminFromUid } from './utils/enterpriseAuthHelpers.js'
import { createModuleLogger } from './utils/logger.js'
import { PdfGenerator } from './utils/PdfGenerator.js'

const logger = createModuleLogger('enterpriseBillInvoice')

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
const TEMPLATE_PATH = path.join('templates', 'enterpriseBillInvoice.docx')

const generateRandomBase64UrlSafeString = (byteLength = 32): string =>
  crypto.randomBytes(byteLength).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const getInvoiceStoragePrefix = (enterpriseId: string, yearMonth: string): string =>
  `enterprises/${enterpriseId}/${yearMonth}`

const getInvoiceFile = (
  enterpriseId: string,
  yearMonth: string,
  invoiceId: string,
): ReturnType<ReturnType<Storage['bucket']>['file']> => {
  const storage = new Storage()
  const bucket = storage.bucket(INVOICE_BUCKET_NAME)
  return bucket.file(`${getInvoiceStoragePrefix(enterpriseId, yearMonth)}/${invoiceId}`)
}

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

const streamInvoicePdf = async (
  enterpriseId: string,
  yearMonth: string,
  invoiceId: string,
  writableStream: Writable,
): Promise<void> => {
  const file = getInvoiceFile(enterpriseId, yearMonth, invoiceId)
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
        settle(null)
      }
    })
    pipeline(readable, writableStream, (err) => {
      settle(err)
    })
  })
}

const resolveCachedInvoiceId = async (enterpriseId: string, yearMonth: string): Promise<string | null> => {
  const meta = await getInvoiceFileMeta(enterpriseId, yearMonth)
  return meta?.gcs_id ?? null
}

export const createEnterpriseBillInvoice = async (
  enterpriseId: string,
  yearMonth: string,
  writableStream?: Writable,
): Promise<string> => {
  const snapshot = await getBillingSnapshot(enterpriseId, yearMonth)
  if (snapshot == null || snapshot.billing_status !== 'final') {
    throw new HttpsError('failed-precondition', '確定済みの請求データがありません')
  }
  if (snapshot.total_billing_amount <= 0) {
    throw new HttpsError('failed-precondition', '請求金額が 0 円のため請求書を発行できません')
  }

  const cachedInvoiceId = await resolveCachedInvoiceId(enterpriseId, yearMonth)
  if (cachedInvoiceId != null) {
    if (writableStream != null) {
      await streamInvoicePdf(enterpriseId, yearMonth, cachedInvoiceId, writableStream)
    }
    return cachedInvoiceId
  }

  const enterprise = await getEnterpriseById(enterpriseId)
  if (enterprise == null) {
    throw new HttpsError('not-found', 'enterprise not found')
  }

  const jsonDataForMerge = buildEnterpriseInvoiceMergeData({
    enterpriseId,
    companyName: enterprise.company_name,
    snapshot: {
      year_month: snapshot.year_month,
      active_account_count: snapshot.active_account_count,
      unit_price: snapshot.unit_price,
      platform_fee_amount: snapshot.platform_fee_amount,
      is_trial: snapshot.is_trial,
      meal_billing_amount: snapshot.meal_billing_amount,
      total_billing_amount: snapshot.total_billing_amount,
      snapshot_at: snapshot.snapshot_at,
      billing_status: snapshot.billing_status,
    },
  })

  const generatedInvoiceId = generateRandomBase64UrlSafeString()
  const pdfGenerator = new PdfGenerator()
  const readableStream = await pdfGenerator.executeDocumentMergeForStream(TEMPLATE_PATH, jsonDataForMerge)
  const storageWriteStream = getInvoiceFile(enterpriseId, yearMonth, generatedInvoiceId).createWriteStream()

  if (writableStream != null) {
    await pipeToStreams(readableStream, storageWriteStream, writableStream)
  } else {
    await pipeToStreams(readableStream, storageWriteStream)
  }

  const setResult = await setInvoiceFileMeta(enterpriseId, yearMonth, generatedInvoiceId)
  if (setResult === 'already_exists') {
    const existingInvoiceId = await resolveCachedInvoiceId(enterpriseId, yearMonth)
    if (existingInvoiceId != null && existingInvoiceId !== generatedInvoiceId) {
      logger.info('Concurrent invoice generation resolved to existing meta', {
        enterpriseId,
        yearMonth,
        generatedInvoiceId,
        existingInvoiceId,
      })
      try {
        await getInvoiceFile(enterpriseId, yearMonth, generatedInvoiceId).delete({ ignoreNotFound: true })
      } catch (deleteError) {
        logger.warn('Concurrent invoice generation orphan cleanup failed', {
          enterpriseId,
          yearMonth,
          generatedInvoiceId,
          deleteError,
        })
      }
      return existingInvoiceId
    }
  }

  return generatedInvoiceId
}

export const enterpriseBillInvoice = onRequest(
  {
    cors: CORS_ORIGINS,
    timeoutSeconds: 120,
    secrets: ['PDF_SERVICES_CLIENT_ID', 'PDF_SERVICES_CLIENT_SECRET'],
  },
  async (req, res) => {
    const [, enterpriseId] = req.path.split('/')
    if (enterpriseId == null || enterpriseId === '') {
      res.status(400).send('Bad Request')
      return
    }

    const yearMonth = req.query.year_month
    if (typeof yearMonth !== 'string' || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      res.status(400).send('Bad Request')
      return
    }

    // invoiceId 付きアクセスは認証不要で既存 PDF を返却（04_請求 §3.3・PF eventBillInvoice 同趣旨）
    const invoiceId = req.query.id
    if (typeof invoiceId === 'string') {
      try {
        res.status(200).setHeader('Content-Type', 'application/pdf')
        await streamInvoicePdf(enterpriseId, yearMonth, invoiceId, res)
      } catch {
        if (!res.headersSent) {
          res.status(404).send('Invoice not found')
        }
      }
      return
    }

    const authHeader = req.headers.authorization ?? ''
    if (!authHeader.startsWith('JWT ')) {
      res.status(401).send('JWT token is required')
      return
    }

    let uid: string
    let decodedToken: Record<string, unknown>
    try {
      const idToken = authHeader.split('JWT ')[1]
      const decoded = await getAuth().verifyIdToken(idToken)
      uid = decoded.uid
      decodedToken = decoded as Record<string, unknown>
    } catch {
      res.status(401).send('Invalid JWT token')
      return
    }

    try {
      await assertEnterpriseAdminFromUid(uid, decodedToken, enterpriseId)

      res.status(200).setHeader('Content-Type', 'application/pdf')
      await createEnterpriseBillInvoice(enterpriseId, yearMonth, res)
    } catch (error) {
      logger.error('Failed to create enterprise bill invoice', { enterpriseId, yearMonth, error })
      if (!res.headersSent) {
        if (error instanceof HttpsError) {
          const status = error.code === 'failed-precondition' ? 412 : error.code === 'permission-denied' ? 403 : 500
          res.status(status).send(error.message)
          return
        }
        res.status(500).send('Internal Server Error')
      }
    }
  },
)
