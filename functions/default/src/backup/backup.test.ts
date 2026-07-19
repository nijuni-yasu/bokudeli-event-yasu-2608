import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import {
  formatBackupDateLabel,
  buildFirestoreExportOutputUriPrefix,
  buildStorageBackupRunPrefix,
  buildStorageBackupSuccessMarkerPath,
  buildStorageBackupWorkPrefix,
  getFirestoreExportUriPrefix,
} from './constants.js'
import {
  isIncompleteStorageBackupRun,
  isStorageBackupEligibleForRetention,
  parseFirestoreExportFolderSortKey,
  parseStorageBackupFolderSortKey,
  selectPrefixesToDelete,
} from './retention.js'
import { buildStorageBackupDestinationPrefix } from './storageCopy.js'

describe('backup retention', () => {
  it('selectPrefixesToDelete keeps newest entries by sortKey', () => {
    const entries = [
      { prefix: 'daily/2026-06-01T02:00:00_1/', sortKey: '2026-06-01' },
      { prefix: 'daily/2026-06-02T02:00:00_2/', sortKey: '2026-06-02' },
      { prefix: 'daily/2026-06-03T02:00:00_3/', sortKey: '2026-06-03' },
    ]
    expect(selectPrefixesToDelete(entries, 2)).toEqual(['daily/2026-06-01T02:00:00_1/'])
  })

  it('parseFirestoreExportFolderSortKey extracts date from export folder', () => {
    expect(parseFirestoreExportFolderSortKey('daily/2026-06-03T17:00:07_99530/')).toBe('2026-06-03')
    expect(parseFirestoreExportFolderSortKey('weekly/invalid/')).toBeNull()
  })

  it('parseStorageBackupFolderSortKey validates folder labels', () => {
    expect(parseStorageBackupFolderSortKey('daily', 'daily/2026-06-03/')).toBe('2026-06-03')
    expect(parseStorageBackupFolderSortKey('monthly', 'monthly/2026-06/')).toBe('2026-06')
    expect(parseStorageBackupFolderSortKey('monthly', 'monthly/2026-06-03/')).toBeNull()
  })

  it('isStorageBackupEligibleForRetention requires _SUCCESS for in-progress runs', () => {
    expect(isStorageBackupEligibleForRetention(true, true, false)).toBe(true)
    expect(isStorageBackupEligibleForRetention(false, true, false)).toBe(false)
    expect(isStorageBackupEligibleForRetention(false, false, true)).toBe(true)
    expect(isIncompleteStorageBackupRun(false, true)).toBe(true)
    expect(isIncompleteStorageBackupRun(true, true)).toBe(false)
  })
})

describe('backup paths', () => {
  it('getFirestoreExportUriPrefix includes tier prefix', () => {
    expect(getFirestoreExportUriPrefix('my-project', 'daily')).toBe('gs://my-project-firestore-backups/daily/')
  })

  it('buildFirestoreExportOutputUriPrefix appends run folder under tier', () => {
    const startedAt = DateTime.fromISO('2026-06-03T17:00:00', { zone: 'Asia/Tokyo' })
    expect(buildFirestoreExportOutputUriPrefix('my-project', 'daily', startedAt)).toBe(
      'gs://my-project-firestore-backups/daily/2026-06-03T17:00:00/',
    )
  })

  it('formatBackupDateLabel formats monthly as YYYY-MM', () => {
    expect(formatBackupDateLabel('monthly', '2026-06-03')).toBe('2026-06')
    expect(formatBackupDateLabel('daily', '2026-06-03')).toBe('2026-06-03')
  })

  it('buildStorageBackupDestinationPrefix uses JST schedule time', () => {
    expect(buildStorageBackupDestinationPrefix('daily', '2026-06-02T17:15:00.000Z')).toBe('daily/2026-06-03')
    expect(buildStorageBackupDestinationPrefix('monthly', '2026-05-31T18:15:00.000Z')).toBe('monthly/2026-06')
  })

  it('buildStorageBackupWorkPrefix and success marker paths', () => {
    expect(buildStorageBackupRunPrefix('daily', '2026-07-19')).toBe('daily/2026-07-19')
    expect(buildStorageBackupWorkPrefix('daily', '2026-07-19')).toBe('daily/2026-07-19/_inprogress')
    expect(buildStorageBackupSuccessMarkerPath('daily', '2026-07-19')).toBe('daily/2026-07-19/_SUCCESS')
  })
})
