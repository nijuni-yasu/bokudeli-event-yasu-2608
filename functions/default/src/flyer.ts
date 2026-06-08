import path from 'path'
import { pipeline } from 'stream/promises'
import axios from 'axios'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { getAuth } from 'firebase-admin/auth'
import { onRequest, HttpsError } from 'firebase-functions/https'
import { convertHtmlToPlaneText } from '@shokujii/common/utils/converter.js'
import { getEventCoverStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { getEvent } from './stores/event.js'
import { PdfGenerator } from './utils/PdfGenerator.js'
import { createModuleLogger } from './utils/logger.js'
import { getEventUrl, convertStoragePathToURL } from './utils/urls.js'

const logger = createModuleLogger('flyer')

const SUPPORTED_SIZES = new Set(['A4', 'A5'])

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

const getImageAsBase64 = async (
  url: string | undefined,
  targetWidth = 1200,
  targetHeight = 630,
): Promise<string | null> => {
  if (url == null || url === '') {
    return null
  }

  try {
    const response = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer' })
    const imageBuffer = Buffer.from(response.data)
    return await resizeAndCropImage(imageBuffer, targetWidth, targetHeight)
  } catch (error) {
    logger.error('Error fetching image', { error: String(error), url })
    return null
  }
}

const resizeAndCropImage = async (
  imageBuffer: Buffer,
  targetWidth: number,
  targetHeight: number,
): Promise<string | null> => {
  try {
    const metadata = await sharp(imageBuffer).metadata()
    if (metadata.width == null || metadata.height == null) {
      return null
    }

    const originalAspectRatio = metadata.width / metadata.height
    const targetAspectRatio = targetWidth / targetHeight

    let resizeOptions: sharp.ResizeOptions = {}
    let extractOptions: sharp.Region = { left: 0, top: 0, width: 0, height: 0 }

    if (originalAspectRatio > targetAspectRatio) {
      const newHeight = targetHeight
      const newWidth = Math.round(newHeight * originalAspectRatio)
      resizeOptions = { width: newWidth, height: newHeight, fit: 'fill' }
      extractOptions = {
        left: Math.round((newWidth - targetWidth) / 2),
        top: 0,
        width: targetWidth,
        height: targetHeight,
      }
    } else if (originalAspectRatio < targetAspectRatio) {
      const newWidth = targetWidth
      const newHeight = Math.round(newWidth / originalAspectRatio)
      resizeOptions = { width: newWidth, height: newHeight, fit: 'fill' }
      extractOptions = {
        left: 0,
        top: Math.round((newHeight - targetHeight) / 2),
        width: targetWidth,
        height: targetHeight,
      }
    } else {
      resizeOptions = {
        width: targetWidth,
        height: targetHeight,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      }
    }

    let sharpInstance = sharp(imageBuffer).resize(resizeOptions)
    if (extractOptions.width > 0 && extractOptions.height > 0) {
      sharpInstance = sharpInstance.extract(extractOptions)
    }

    const processedBuffer = await sharpInstance.jpeg().toBuffer()
    return `data:image/jpeg;base64,${processedBuffer.toString('base64')}`
  } catch (error) {
    logger.error('Error processing image', { error: String(error) })
    try {
      const simpleResized = await sharp(imageBuffer)
        .resize(targetWidth, targetHeight, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .jpeg()
        .toBuffer()
      return `data:image/jpeg;base64,${simpleResized.toString('base64')}`
    } catch (fallbackError) {
      logger.error('Fallback resize failed', { error: String(fallbackError) })
      return null
    }
  }
}

const generateQRCodeAsBase64 = async (text: string): Promise<string | null> => {
  try {
    const qrBuffer = await QRCode.toBuffer(text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
    return `data:image/png;base64,${qrBuffer.toString('base64')}`
  } catch (error) {
    logger.error('Error generating QR code', { error: String(error) })
    return null
  }
}

export const flyer = onRequest(
  {
    cors: CORS_ORIGINS,
    timeoutSeconds: 120,
    memory: '1GiB',
    secrets: ['PDF_SERVICES_CLIENT_ID', 'PDF_SERVICES_CLIENT_SECRET'],
  },
  async (req, res) => {
    const authHeader = req.headers.authorization ?? ''
    if (!authHeader.startsWith('JWT ')) {
      throw new HttpsError('unauthenticated', 'JWT token is required')
    }

    const idToken = authHeader.split('JWT ')[1]!
    const decodedToken = await getAuth().verifyIdToken(idToken)

    const [, eventId] = req.path.split('/')
    if (!eventId) {
      res.status(400).send('Bad Request')
      return
    }

    const sizeParam = typeof req.query.size === 'string' ? req.query.size : 'A4'
    const size = SUPPORTED_SIZES.has(sizeParam) ? sizeParam : 'A4'
    logger.info('flyer request', { uid: decodedToken.uid, eventId, size })

    const event = await getEvent(eventId)
    if (event == null) {
      res.status(404).send('Event not found')
      return
    }

    const eventDesc = convertHtmlToPlaneText(event.event_desc ?? '')
    const eventCoverUrl = convertStoragePathToURL(getEventCoverStoragePath(event.community_id, event.id))
    const eventCoverUrlBase64Image = await getImageAsBase64(eventCoverUrl)
    const eventPath = getEventUrl(event.community_account, eventId)
    const qrCodeBase64 = await generateQRCodeAsBase64(eventPath)

    const jsonDataForMerge = {
      eventCoverUrlBase64Image,
      eventDesc,
      qrCodeBase64,
    }

    const templatePath = path.join('templates', `flyer${size}.docx`)
    const pdfGenerator = new PdfGenerator()
    const readableStream = await pdfGenerator.executeDocumentMergeForStream(templatePath, jsonDataForMerge)

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
