import { DateTime } from 'luxon'

export type BackupTier = 'daily' | 'weekly' | 'monthly'

export const BACKUP_TIMEZONE = 'Asia/Tokyo'

export const FIRESTORE_RETENTION: Record<BackupTier, number> = {
  daily: 14,
  weekly: 12,
  monthly: 24,
}

export const STORAGE_RETENTION: Record<BackupTier, number> = {
  daily: 7,
  weekly: 8,
  monthly: 12,
}

export const FIRESTORE_EXPORT_METADATA_FILE = 'overall_export_metadata'

export const STORAGE_BACKUP_INPROGRESS_DIR = '_inprogress'

export const STORAGE_BACKUP_SUCCESS_MARKER = '_SUCCESS'

export const getProjectId = (): string => {
  const projectId = process.env.GCLOUD_PROJECT
  if (projectId == null || projectId === '') {
    throw new Error('GCLOUD_PROJECT is not set')
  }
  return projectId
}

export const getFirestoreBackupBucketName = (projectId: string): string => `${projectId}-firestore-backups`

export const getStorageBackupBucketName = (projectId: string): string => `${projectId}-storage-backups`

export const getFirestoreExportUriPrefix = (projectId: string, tier: BackupTier): string =>
  `gs://${getFirestoreBackupBucketName(projectId)}/${tier}/`

export const buildFirestoreExportOutputUriPrefix = (
  projectId: string,
  tier: BackupTier,
  startedAt: DateTime,
): string => {
  const runFolder = startedAt.setZone(BACKUP_TIMEZONE).toFormat("yyyy-MM-dd'T'HH:mm:ss")
  return `${getFirestoreExportUriPrefix(projectId, tier)}${runFolder}/`
}

export const isRetentionDryRun = (): boolean => process.env.BACKUP_RETENTION_DRY_RUN === 'true'

export const buildStorageBackupRunPrefix = (tier: BackupTier, dateLabel: string): string => `${tier}/${dateLabel}`

export const buildStorageBackupWorkPrefix = (tier: BackupTier, dateLabel: string): string =>
  `${buildStorageBackupRunPrefix(tier, dateLabel)}/${STORAGE_BACKUP_INPROGRESS_DIR}`

export const buildStorageBackupSuccessMarkerPath = (tier: BackupTier, dateLabel: string): string =>
  `${buildStorageBackupRunPrefix(tier, dateLabel)}/${STORAGE_BACKUP_SUCCESS_MARKER}`

export const formatBackupDateLabel = (tier: BackupTier, isoDate: string): string => {
  switch (tier) {
    case 'daily':
    case 'weekly':
      return isoDate.slice(0, 10)
    case 'monthly':
      return isoDate.slice(0, 7)
  }
}
