import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import { getStorage } from 'firebase-admin/storage'
import sharp from 'sharp'
import type { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import { sortEventMemberOrdersForPartnerDetail } from '@shokujii/common/utils/eventMemberOrderSort.js'
import {
  isGoogleProfileImageUrl,
  isGoogleUnavailableAvatarHash,
  normalizeGoogleProfileImageUrl,
} from '@shokujii/common/utils/googleProfileImage.js'
import { createModuleLogger } from './logger.js'
import type { ShokujiiUser } from '../stores/user.js'

/** PDF 用プロフィール画像の一辺（px） */
const NAMES_PRINT_PHOTO_SIZE_PX = 300
/** 名札に載せるユーザー名の最大文字数 */
const NAMES_PRINT_MAX_USER_NAME_LENGTH = 14
/** 名札に載せるメニュー名の最大文字数（超過時は … を付与） */
const NAMES_PRINT_MAX_MENU_NAME_LENGTH = 28
/** テンプレート 1 行あたりの列数 */
const NAMES_PRINT_COLUMNS_PER_ROW = 4

const logger = createModuleLogger('namesPrintPdf')

const namesPrintAssetsDir = (): string => path.join(process.cwd(), 'assets', 'namesPrint')

const readDefaultProfileBase64 = (): string => {
  const p = path.join(namesPrintAssetsDir(), 'default_profile.png')
  const buf = fs.readFileSync(p)
  return `data:image/png;base64,${buf.toString('base64')}`
}

const readBlankProfileBase64 = (): string => {
  const p = path.join(namesPrintAssetsDir(), 'blank_profile.jpeg')
  const buf = fs.readFileSync(p)
  return `data:image/jpeg;base64,${buf.toString('base64')}`
}

const downloadImageFromGcs = async (gsUrl: string): Promise<Buffer | null> => {
  try {
    const storage = getStorage()
    const bucketName = gsUrl.split('/')[2]
    const filePath = gsUrl.split('/').slice(3).join('/')
    const bucket = storage.bucket(bucketName)
    const file = bucket.file(filePath)
    const [imageBuffer] = await file.download()
    return imageBuffer
  } catch (error) {
    logger.warn('Error downloading image from GCS', { error: String(error) })
    return null
  }
}

const resizeAndCropImage = async (imageBuffer: Buffer, targetWidth: number, targetHeight: number): Promise<string> => {
  try {
    const metadata = await sharp(imageBuffer).metadata()
    const originalWidth = metadata.width
    const originalHeight = metadata.height
    if (originalWidth == null || originalHeight == null) {
      throw new Error('missing image dimensions')
    }
    const originalAspectRatio = originalWidth / originalHeight
    const targetAspectRatio = targetWidth / targetHeight

    let resizeOptions: sharp.ResizeOptions
    let extractOptions: sharp.Region | null = null

    if (originalAspectRatio > targetAspectRatio) {
      const newHeight = targetHeight
      const newWidth = Math.round(newHeight * originalAspectRatio)
      resizeOptions = { width: newWidth, height: newHeight, fit: 'fill' }
      const extractX = Math.max(0, Math.round((newWidth - targetWidth) / 2))
      extractOptions = { left: extractX, top: 0, width: targetWidth, height: targetHeight }
    } else if (originalAspectRatio < targetAspectRatio) {
      const newWidth = targetWidth
      const newHeight = Math.round(newWidth / originalAspectRatio)
      resizeOptions = { width: newWidth, height: newHeight, fit: 'fill' }
      const extractY = Math.max(0, Math.round((newHeight - targetHeight) / 2))
      extractOptions = { left: 0, top: extractY, width: targetWidth, height: targetHeight }
    } else {
      resizeOptions = {
        width: targetWidth,
        height: targetHeight,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      }
    }

    let image = sharp(imageBuffer).resize(resizeOptions)
    if (extractOptions != null) {
      image = image.extract(extractOptions)
    }
    const processedBuffer = await image.jpeg().toBuffer()
    return `data:image/jpeg;base64,${processedBuffer.toString('base64')}`
  } catch (error) {
    logger.warn('Error processing image', { error: String(error) })
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
      logger.warn('Fallback resize failed', { error: String(fallbackError) })
      return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
    }
  }
}

const resolvePhotoUrl = async (url: string | undefined): Promise<string> => {
  if (url != null && typeof url === 'string' && url.startsWith('gs://')) {
    const imageBuffer = await downloadImageFromGcs(url)
    if (imageBuffer == null) {
      return readDefaultProfileBase64()
    }
    return resizeAndCropImage(imageBuffer, NAMES_PRINT_PHOTO_SIZE_PX, NAMES_PRINT_PHOTO_SIZE_PX)
  }

  if (url == null || typeof url !== 'string' || !url.startsWith('https://')) {
    return readDefaultProfileBase64()
  }

  try {
    const fetchUrl = isGoogleProfileImageUrl(url) ? normalizeGoogleProfileImageUrl(url, 500) : url
    const response = await fetch(fetchUrl)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const photoBuffer = Buffer.from(arrayBuffer)
    if (isGoogleProfileImageUrl(url)) {
      const hashHex = createHash('sha256').update(photoBuffer).digest('hex')
      if (isGoogleUnavailableAvatarHash(hashHex)) {
        return readDefaultProfileBase64()
      }
    }
    return resizeAndCropImage(photoBuffer, NAMES_PRINT_PHOTO_SIZE_PX, NAMES_PRINT_PHOTO_SIZE_PX)
  } catch (error) {
    logger.warn('Error fetching image', { error: String(error) })
    return readDefaultProfileBase64()
  }
}

export type NamesPrintMenuRow = {
  userId: string
  /** NFKC 済みメニュー名（legacy の menu 表示と同様） */
  menuName: string
}

export const buildSortedMenuRows = (orders: EventMemberOrder[]): NamesPrintMenuRow[] => {
  const sorted = sortEventMemberOrdersForPartnerDetail(orders)
  return sorted.map((o) => ({
    userId: o.user_id,
    menuName: o.menu_name.normalize('NFKC'),
  }))
}

export type ValidNameRow = {
  name: string
  menu: string
  photo: string
}

export const buildValidNameRows = async (
  rows: NamesPrintMenuRow[],
  userById: Map<string, ShokujiiUser>,
): Promise<ValidNameRow[]> => {
  return Promise.all(
    rows.map(async (row) => {
      const user = userById.get(row.userId)
      const rawName = user?.user_name ?? ''
      const name =
        rawName.length > NAMES_PRINT_MAX_USER_NAME_LENGTH ? rawName.slice(0, NAMES_PRINT_MAX_USER_NAME_LENGTH) : rawName
      const menu =
        row.menuName.length > NAMES_PRINT_MAX_MENU_NAME_LENGTH
          ? `${row.menuName.slice(0, NAMES_PRINT_MAX_MENU_NAME_LENGTH)}…`
          : row.menuName
      const photoUrl = user?.user_image_url
      const photo = await resolvePhotoUrl(photoUrl !== '' ? photoUrl : undefined)
      return { name, menu, photo }
    }),
  )
}

/** Adobe Document Merge 用 JSON（legacy namesprint の shape と同一） */
export const createTemplateMergeData = (
  filteredValidNames: ValidNameRow[],
): { d: Record<string, string | number>[] } => {
  const templateData: { d: Record<string, string | number>[] } = { d: [] }
  const getDefault = readDefaultProfileBase64
  const getBlank = readBlankProfileBase64

  for (let i = 0; i < filteredValidNames.length; i += NAMES_PRINT_COLUMNS_PER_ROW) {
    const group: Record<string, string | number> = {}
    for (let j = 0; j < NAMES_PRINT_COLUMNS_PER_ROW && i + j < filteredValidNames.length; j++) {
      const person = filteredValidNames[i + j]!
      const num = j + 1
      group[`index${num}`] = i + j + 1
      group[`name${num}`] = person.name.normalize('NFKC')
      group[`menu${num}`] = person.menu.normalize('NFKC')
      group[`photo${num}`] = person.photo || getDefault()
    }
    for (
      let j = filteredValidNames.length % NAMES_PRINT_COLUMNS_PER_ROW;
      j < NAMES_PRINT_COLUMNS_PER_ROW && i + NAMES_PRINT_COLUMNS_PER_ROW > filteredValidNames.length;
      j++
    ) {
      const num = j + 1
      group[`index${num}`] = i + j + 1
      group[`name${num}`] = ' '
      group[`menu${num}`] = ' '
      group[`photo${num}`] = getBlank()
    }
    templateData.d.push(group)
  }

  return templateData
}
