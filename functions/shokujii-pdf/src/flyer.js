import path from 'path'
import { getAuth } from 'firebase-admin/auth'
import { onRequest, HttpsError } from 'firebase-functions/v2/https'
import { defineList, defineString } from 'firebase-functions/params'
import { makePdf } from './utils/makePdf.js'
import axios from 'axios'
import sharp from 'sharp'
import QRCode from 'qrcode'
import { db } from './firebase.js'
import { getEvent } from './utils/eventUtils.js'
import { convertHtmlToPlaneText } from './utils/converter.js'
import './options/index.js'

const CORS = defineList('CORS')
const EVENT_HOST = defineString('EVENT_HOST')

// 画像URLからBase64エンコードされた文字列を取得する関数（更新版）
const getImageAsBase64 = async (url, targetWidth = 1200, targetHeight = 630) => {
  if (!url || typeof url !== 'string') {
    return null
  }

  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    const imageBuffer = Buffer.from(response.data)

    // 画像をリサイズ・クロップ
    return await resizeAndCropImage(imageBuffer, targetWidth, targetHeight)
  } catch (error) {
    console.error('Error fetching image:', error)
    return null
  }
}

// 画像をリサイズ・クロップする関数
const resizeAndCropImage = async (imageBuffer, targetWidth, targetHeight) => {
  try {
    // 元の画像のメタデータを取得
    const metadata = await sharp(imageBuffer).metadata()
    const originalAspectRatio = metadata.width / metadata.height
    const targetAspectRatio = targetWidth / targetHeight

    let resizeOptions = {}
    let extractOptions = {}

    if (originalAspectRatio > targetAspectRatio) {
      // 横長の画像の場合
      const newHeight = targetHeight
      const newWidth = Math.round(newHeight * originalAspectRatio)

      resizeOptions = {
        width: newWidth,
        height: newHeight,
        fit: 'fill',
      }

      // 中央部分を切り抜く
      const extractX = Math.round((newWidth - targetWidth) / 2)
      extractOptions = {
        left: extractX,
        top: 0,
        width: targetWidth,
        height: targetHeight,
      }
    } else if (originalAspectRatio < targetAspectRatio) {
      // 縦長の画像の場合
      const newWidth = targetWidth
      const newHeight = Math.round(newWidth / originalAspectRatio)

      resizeOptions = {
        width: newWidth,
        height: newHeight,
        fit: 'fill',
      }

      // 中央部分を切り抜く
      const extractY = Math.round((newHeight - targetHeight) / 2)
      extractOptions = {
        left: 0,
        top: extractY,
        width: targetWidth,
        height: targetHeight,
      }
    } else {
      // アスペクト比が同じ場合は単純にリサイズ
      resizeOptions = {
        width: targetWidth,
        height: targetHeight,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }, // 白背景
      }
    }

    // 画像の処理
    const processedBuffer = await sharp(imageBuffer).resize(resizeOptions).extract(extractOptions).toBuffer()

    return `data:image/jpeg;base64,${processedBuffer.toString('base64')}`
  } catch (error) {
    console.error('Error processing image:', error)
    // エラー時は元の画像をそのままBase64エンコード
    try {
      const simpleResized = await sharp(imageBuffer)
        .resize(targetWidth, targetHeight, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .toBuffer()
      return `data:image/jpeg;base64,${simpleResized.toString('base64')}`
    } catch (fallbackError) {
      console.error('Fallback resize failed:', fallbackError)
      // 最後の手段として元の画像をそのままBase64エンコード
      return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
    }
  }
}

// QRコードをBase64に変換する関数
const generateQRCodeAsBase64 = async (text) => {
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
    console.error('Error generating QR code:', error)
    return null
  }
}

export const flyer = onRequest({ cors: CORS }, async (req, res) => {
  const authHeader = req.headers.authorization ?? ''
  if (!authHeader.startsWith('JWT ')) {
    throw new HttpsError('unauthenticated', 'JWT token is required')
  }

  const idToken = authHeader.split('JWT ')[1]
  const decodedToken = await getAuth().verifyIdToken(idToken)
  const uid = decodedToken.uid

  const [, eventId] = req.path.split('/')
  const size = req.query.size || 'A4' // デフォルトはA4
  console.info(`uid: ${uid}, eventId: ${eventId}, size: ${size}`)

  const jsonDataForMerge = await db.runTransaction(async (transaction) => {
    const event = await getEvent(transaction, eventId)
    if (!event) {
      res.status(404).send('Event not found')
      return
    }
    const eventData = event.data()
    const eventDesc = convertHtmlToPlaneText(eventData.event_desc)

    const eventCoverUrl = eventData.event_cover_url
    const eventCoverUrlBase64Image = await getImageAsBase64(eventCoverUrl)
    const eventPath = `${EVENT_HOST}/c/test_f/e/${eventId}`
    const qrCodeBase64 = await generateQRCodeAsBase64(eventPath)

    // PDF生成に必要なデータを整形
    const data = {
      eventCoverUrlBase64Image,
      eventDesc,
      qrCodeBase64,
    }

    // console.log('data:', data)
    return data
  })

  // サイズに応じてテンプレートやPDF設定を変更
  const templatePath = path.join('template', `flyer${size}.docx`)

  // PDFを生成してレスポンスとして返す
  res.status(200).setHeader('Content-Type', 'application/pdf')
  makePdf(templatePath, jsonDataForMerge, res)
})
