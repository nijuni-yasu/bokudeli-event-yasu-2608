import { Storage, type File, type GetFilesOptions } from '@google-cloud/storage'
import { getStorage } from 'firebase-admin/storage'
import { DateTime } from 'luxon'
import { createModuleLogger } from '../utils/logger.js'
import {
  BACKUP_TIMEZONE,
  buildStorageBackupDestPrefix,
  formatBackupDateLabel,
  getProjectId,
  getStorageBackupBucketName,
  type BackupTier,
} from './constants.js'

const logger = createModuleLogger('backup')

const PAGE_SIZE = 500
const COPY_CONCURRENCY = 10

const chunkFiles = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

const copyFilesInParallel = async (
  files: File[],
  destBucket: ReturnType<Storage['bucket']>,
  destPrefix: string,
): Promise<number> => {
  const copyTargets = files.filter((file) => !file.name.endsWith('/'))
  let copiedCount = 0

  for (const chunk of chunkFiles(copyTargets, COPY_CONCURRENCY)) {
    await Promise.all(
      chunk.map(async (file) => {
        const destPath = `${destPrefix}/${file.name}`
        await file.copy(destBucket.file(destPath))
      }),
    )
    copiedCount += chunk.length
  }

  return copiedCount
}

export const copyDefaultStorageBucket = async (tier: BackupTier, scheduleTimeIso: string): Promise<number> => {
  const projectId = getProjectId()
  const sourceBucketName = getStorage().bucket().name
  const destBucketName = getStorageBackupBucketName(projectId)
  const dateLabel = formatBackupDateLabel(
    tier,
    DateTime.fromISO(scheduleTimeIso, { zone: BACKUP_TIMEZONE }).toISODate() ?? scheduleTimeIso,
  )
  const destPrefix = buildStorageBackupDestPrefix(tier, dateLabel)

  logger.info('Starting Storage backup copy', { tier, sourceBucketName, destBucketName, destPrefix })

  const storage = new Storage()
  const sourceBucket = storage.bucket(sourceBucketName)
  const destBucket = storage.bucket(destBucketName)

  let copiedCount = 0
  let query: GetFilesOptions = { autoPaginate: false, maxResults: PAGE_SIZE }

  do {
    const [files, nextQuery] = await sourceBucket.getFiles(query)
    copiedCount += await copyFilesInParallel(files, destBucket, destPrefix)
    query = nextQuery ?? { autoPaginate: false, maxResults: PAGE_SIZE }
  } while (query.pageToken != null)

  logger.info('Storage backup copy completed', { tier, destPrefix, copiedCount })
  return copiedCount
}

export const buildStorageBackupDestinationPrefix = (tier: BackupTier, scheduleTimeIso: string): string => {
  const dateLabel = formatBackupDateLabel(
    tier,
    DateTime.fromISO(scheduleTimeIso, { zone: BACKUP_TIMEZONE }).toISODate() ?? scheduleTimeIso,
  )
  return buildStorageBackupDestPrefix(tier, dateLabel)
}
