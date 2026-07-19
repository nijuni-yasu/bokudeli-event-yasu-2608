import { onSchedule } from 'firebase-functions/v2/scheduler'
import { exportFirestore } from './firestoreExport.js'
import { runBackupRetentionCleanup } from './retention.js'
import { copyDefaultStorageBucket } from './storageCopy.js'

const BACKUP_SCHEDULE_OPTIONS = {
  region: 'asia-northeast1' as const,
  timeZone: 'Asia/Tokyo',
  memory: '2GiB' as const,
  timeoutSeconds: 1800,
}

const RETENTION_SCHEDULE_OPTIONS = {
  region: 'asia-northeast1' as const,
  timeZone: 'Asia/Tokyo',
  memory: '512MiB' as const,
  timeoutSeconds: 540,
}

export const firestoreExportDaily = onSchedule({ ...BACKUP_SCHEDULE_OPTIONS, schedule: '0 2 * * *' }, async () => {
  await exportFirestore('daily')
})

export const firestoreExportWeekly = onSchedule({ ...BACKUP_SCHEDULE_OPTIONS, schedule: '30 2 * * 0' }, async () => {
  await exportFirestore('weekly')
})

export const firestoreExportMonthly = onSchedule({ ...BACKUP_SCHEDULE_OPTIONS, schedule: '0 3 1 * *' }, async () => {
  await exportFirestore('monthly')
})

export const storageBackupDaily = onSchedule({ ...BACKUP_SCHEDULE_OPTIONS, schedule: '15 2 * * *' }, async (event) => {
  await copyDefaultStorageBucket('daily', event.scheduleTime)
})

export const storageBackupWeekly = onSchedule({ ...BACKUP_SCHEDULE_OPTIONS, schedule: '45 2 * * 0' }, async (event) => {
  await copyDefaultStorageBucket('weekly', event.scheduleTime)
})

export const storageBackupMonthly = onSchedule(
  { ...BACKUP_SCHEDULE_OPTIONS, schedule: '15 3 1 * *' },
  async (event) => {
    await copyDefaultStorageBucket('monthly', event.scheduleTime)
  },
)

export const backupRetentionCleanup = onSchedule({ ...RETENTION_SCHEDULE_OPTIONS, schedule: '0 4 * * *' }, async () => {
  await runBackupRetentionCleanup()
})
