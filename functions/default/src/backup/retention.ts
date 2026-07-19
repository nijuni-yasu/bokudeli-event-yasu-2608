import { Storage, type GetFilesOptions } from '@google-cloud/storage'
import { DateTime } from 'luxon'
import { createModuleLogger } from '../utils/logger.js'
import {
  BACKUP_TIMEZONE,
  FIRESTORE_EXPORT_METADATA_FILE,
  FIRESTORE_RETENTION,
  STORAGE_BACKUP_INPROGRESS_DIR,
  STORAGE_BACKUP_SUCCESS_MARKER,
  STORAGE_RETENTION,
  getFirestoreBackupBucketName,
  getProjectId,
  getStorageBackupBucketName,
  isRetentionDryRun,
  type BackupTier,
} from './constants.js'

const logger = createModuleLogger('backup')

const TIER_PREFIXES: BackupTier[] = ['daily', 'weekly', 'monthly']

const LEGACY_EXPORT_FOLDER_PATTERN = /^\d{4}-\d{2}-\d{2}T/

export type RetentionEntry = {
  prefix: string
  sortKey: string
}

export const parseFirestoreExportFolderSortKey = (exportPrefix: string): string | null => {
  const folderName = exportPrefix.replace(/\/$/, '').split('/').pop()
  if (folderName == null || !LEGACY_EXPORT_FOLDER_PATTERN.test(folderName)) {
    return null
  }
  return folderName.slice(0, 10)
}

export const parseStorageBackupFolderSortKey = (tier: BackupTier, prefix: string): string | null => {
  const folderName = prefix.replace(/\/$/, '').split('/').pop()
  if (folderName == null) {
    return null
  }
  if (tier === 'monthly') {
    return /^\d{4}-\d{2}$/.test(folderName) ? folderName : null
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(folderName) ? folderName : null
}

export const selectPrefixesToDelete = (entries: RetentionEntry[], keepCount: number): string[] => {
  if (entries.length <= keepCount) {
    return []
  }
  const sorted = [...entries].sort((a, b) => a.sortKey.localeCompare(b.sortKey))
  return sorted.slice(0, sorted.length - keepCount).map((entry) => entry.prefix)
}

export const isStorageBackupEligibleForRetention = (
  hasSuccessMarker: boolean,
  hasInprogressSubfolder: boolean,
  hasLegacyContent: boolean,
): boolean => {
  if (hasSuccessMarker) {
    return true
  }
  if (hasInprogressSubfolder) {
    return false
  }
  return hasLegacyContent
}

export const isIncompleteStorageBackupRun = (hasSuccessMarker: boolean, hasInprogressSubfolder: boolean): boolean =>
  !hasSuccessMarker && hasInprogressSubfolder

const getPrefixesFromApiResponse = (apiResponse: unknown): string[] => {
  if (typeof apiResponse !== 'object' || apiResponse == null || !('prefixes' in apiResponse)) {
    return []
  }
  const prefixes = apiResponse.prefixes
  if (!Array.isArray(prefixes)) {
    return []
  }
  return prefixes.filter((entry): entry is string => typeof entry === 'string')
}

const listFolderPrefixes = async (bucketName: string, prefix: string): Promise<string[]> => {
  const storage = new Storage()
  const bucket = storage.bucket(bucketName)
  const collected: string[] = []
  let query: GetFilesOptions = { prefix, delimiter: '/', autoPaginate: false }

  do {
    const [, nextQuery, apiResponse] = await bucket.getFiles(query)
    collected.push(...getPrefixesFromApiResponse(apiResponse))
    query = nextQuery ?? { prefix, delimiter: '/', autoPaginate: false }
  } while (query.pageToken != null)

  return collected
}

const hasFirestoreExportMetadata = async (bucketName: string, folderPrefix: string): Promise<boolean> => {
  const storage = new Storage()
  const metadataPath = `${folderPrefix}${FIRESTORE_EXPORT_METADATA_FILE}`
  const [exists] = await storage.bucket(bucketName).file(metadataPath).exists()
  return exists
}

const deletePrefixRecursive = async (bucketName: string, prefix: string, dryRun: boolean): Promise<void> => {
  if (dryRun) {
    logger.info('Retention dry-run: would delete prefix', { bucketName, prefix })
    return
  }
  await new Storage().bucket(bucketName).deleteFiles({ prefix, force: true })
  logger.info('Deleted backup prefix', { bucketName, prefix })
}

const cleanupFirestoreTier = async (bucketName: string, tier: BackupTier, dryRun: boolean): Promise<void> => {
  const tierPrefix = `${tier}/`
  const prefixes = await listFolderPrefixes(bucketName, tierPrefix)
  const entries: RetentionEntry[] = []

  for (const prefix of prefixes) {
    if (!(await hasFirestoreExportMetadata(bucketName, prefix))) {
      logger.warn('Skipping Firestore export prefix without metadata', { prefix })
      continue
    }
    const sortKey = parseFirestoreExportFolderSortKey(prefix)
    if (sortKey == null) {
      continue
    }
    entries.push({ prefix, sortKey })
  }

  const toDelete = selectPrefixesToDelete(entries, FIRESTORE_RETENTION[tier])
  for (const prefix of toDelete) {
    await deletePrefixRecursive(bucketName, prefix, dryRun)
  }
}

const cleanupLegacyFirestoreRootExports = async (bucketName: string, dryRun: boolean): Promise<void> => {
  const rootPrefixes = await listFolderPrefixes(bucketName, '')
  const legacyPrefixes = rootPrefixes.filter(
    (prefix) => !TIER_PREFIXES.some((tier) => prefix === `${tier}/` || prefix.startsWith(`${tier}/`)),
  )

  const entries: RetentionEntry[] = []
  for (const prefix of legacyPrefixes) {
    if (!(await hasFirestoreExportMetadata(bucketName, prefix))) {
      continue
    }
    const sortKey = parseFirestoreExportFolderSortKey(prefix)
    if (sortKey == null) {
      continue
    }
    entries.push({ prefix, sortKey })
  }

  const toDelete = selectPrefixesToDelete(entries, FIRESTORE_RETENTION.daily)
  for (const prefix of toDelete) {
    await deletePrefixRecursive(bucketName, prefix, dryRun)
  }
}

const hasStorageBackupSuccessMarker = async (bucketName: string, runPrefix: string): Promise<boolean> => {
  const markerPath = `${runPrefix}${STORAGE_BACKUP_SUCCESS_MARKER}`
  const [exists] = await new Storage().bucket(bucketName).file(markerPath).exists()
  return exists
}

const hasStorageBackupInprogressSubfolder = async (bucketName: string, runPrefix: string): Promise<boolean> => {
  const subPrefixes = await listFolderPrefixes(bucketName, runPrefix)
  return subPrefixes.some((prefix) => prefix === `${runPrefix}${STORAGE_BACKUP_INPROGRESS_DIR}/`)
}

const hasLegacyStorageBackupContent = async (bucketName: string, runPrefix: string): Promise<boolean> => {
  const [files] = await new Storage().bucket(bucketName).getFiles({ prefix: runPrefix, maxResults: 1 })
  return files.length > 0
}

const cleanupStorageTier = async (bucketName: string, tier: BackupTier, dryRun: boolean): Promise<void> => {
  const tierPrefix = `${tier}/`
  const prefixes = await listFolderPrefixes(bucketName, tierPrefix)
  const entries: RetentionEntry[] = []

  for (const prefix of prefixes) {
    const sortKey = parseStorageBackupFolderSortKey(tier, prefix)
    if (sortKey == null) {
      continue
    }

    const hasSuccessMarker = await hasStorageBackupSuccessMarker(bucketName, prefix)
    const hasInprogressSubfolder = await hasStorageBackupInprogressSubfolder(bucketName, prefix)

    if (isIncompleteStorageBackupRun(hasSuccessMarker, hasInprogressSubfolder)) {
      logger.warn('Deleting incomplete Storage backup run', { prefix })
      await deletePrefixRecursive(bucketName, prefix, dryRun)
      continue
    }

    const hasLegacyContent = hasSuccessMarker ? false : await hasLegacyStorageBackupContent(bucketName, prefix)

    if (!isStorageBackupEligibleForRetention(hasSuccessMarker, hasInprogressSubfolder, hasLegacyContent)) {
      continue
    }

    entries.push({ prefix, sortKey })
  }

  const toDelete = selectPrefixesToDelete(entries, STORAGE_RETENTION[tier])
  for (const prefix of toDelete) {
    await deletePrefixRecursive(bucketName, prefix, dryRun)
  }
}

export const runBackupRetentionCleanup = async (): Promise<void> => {
  const projectId = getProjectId()
  const dryRun = isRetentionDryRun()
  const firestoreBucketName = getFirestoreBackupBucketName(projectId)
  const storageBucketName = getStorageBackupBucketName(projectId)

  logger.info('Starting backup retention cleanup', {
    dryRun,
    firestoreBucketName,
    storageBucketName,
    now: DateTime.now().setZone(BACKUP_TIMEZONE).toISO(),
  })

  for (const tier of TIER_PREFIXES) {
    await cleanupFirestoreTier(firestoreBucketName, tier, dryRun)
    await cleanupStorageTier(storageBucketName, tier, dryRun)
  }

  await cleanupLegacyFirestoreRootExports(firestoreBucketName, dryRun)

  logger.info('Backup retention cleanup finished', { dryRun })
}
