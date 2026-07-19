import firestore from '@google-cloud/firestore'
import { DateTime } from 'luxon'
import { createModuleLogger } from '../utils/logger.js'
import { BACKUP_TIMEZONE, buildFirestoreExportOutputUriPrefix, getProjectId, type BackupTier } from './constants.js'

const logger = createModuleLogger('backup')

const adminClient = new firestore.v1.FirestoreAdminClient()

export const exportFirestore = async (tier: BackupTier): Promise<void> => {
  const projectId = getProjectId()
  const databaseName = adminClient.databasePath(projectId, '(default)')
  const startedAt = DateTime.now().setZone(BACKUP_TIMEZONE)
  const outputUriPrefix = buildFirestoreExportOutputUriPrefix(projectId, tier, startedAt)

  logger.info('Starting Firestore export', { tier, outputUriPrefix })

  let operation
  try {
    ;[operation] = await adminClient.exportDocuments({
      name: databaseName,
      outputUriPrefix,
      collectionIds: [],
    })
  } catch (err) {
    logger.error('Firestore exportDocuments failed', { tier, outputUriPrefix, err })
    throw err
  }

  if (operation.name == null) {
    throw new Error('Firestore export operation name is missing')
  }

  logger.info('Firestore export operation started', { tier, operationName: operation.name })

  try {
    await operation.promise()
  } catch (err) {
    logger.error('Firestore export operation failed', { tier, operationName: operation.name, outputUriPrefix, err })
    throw err
  }

  logger.info('Firestore export completed', { tier, operationName: operation.name })
}
