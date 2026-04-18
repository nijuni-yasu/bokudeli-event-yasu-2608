import path from 'path'
import { pipeline } from 'stream/promises'
import { getAuth } from 'firebase-admin/auth'
import { onRequest, HttpsError } from 'firebase-functions/https'
import { getEvent } from './stores/event.js'
import { getUsersByUserIds } from './stores/user.js'
import { PdfGenerator } from './utils/PdfGenerator.js'
import { createModuleLogger } from './utils/logger.js'
import { buildSortedMenuRows, buildValidNameRows, createTemplateMergeData } from './utils/namesPrintPdf.js'

const logger = createModuleLogger('namesprint')

const TEMPLATE_PATH = path.join('templates', 'namesPrint.docx')

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

export const namesprint = onRequest(
  {
    cors: CORS_ORIGINS,
    timeoutSeconds: 120,
    memory: '1GiB',
    secrets: ['PDF_SERVICES_CLIENT_ID', 'PDF_SERVICES_CLIENT_SECRET'],
  },
  async (req, res) => {
    const [, eventId] = req.path.split('/')
    if (!eventId) {
      res.status(400).send('Bad Request')
      return
    }

    const authHeader = req.headers.authorization ?? ''
    if (!authHeader.startsWith('JWT ')) {
      throw new HttpsError('unauthenticated', 'JWT token is required')
    }

    const idToken = authHeader.split('JWT ')[1]!
    const decodedToken = await getAuth().verifyIdToken(idToken)
    logger.info('namesprint request', { uid: decodedToken.uid, eventId })

    const event = await getEvent(eventId)
    if (event == null) {
      res.status(404).send('Event not found')
      return
    }

    const orders = await event.getOrders('ordered')
    const rows = buildSortedMenuRows(orders)
    const userIds = [...new Set(rows.map((r) => r.userId))]
    const userById = await getUsersByUserIds(userIds)

    const validNames = await buildValidNameRows(rows, userById)
    const filtered = validNames.filter((item) => Boolean(item.name) || Boolean(item.menu))

    const jsonDataForMerge = createTemplateMergeData(filtered)

    const pdfGenerator = new PdfGenerator()
    const readableStream = await pdfGenerator.executeDocumentMergeForStream(TEMPLATE_PATH, jsonDataForMerge)

    res.status(200).setHeader('Content-Type', 'application/pdf')
    try {
      await pipeline(readableStream, res)
    } catch (err) {
      logger.error('PDF stream failed', { error: String(err) })
      if (!res.headersSent) {
        res.status(500).send('PDF generation failed')
      }
    }
  },
)
