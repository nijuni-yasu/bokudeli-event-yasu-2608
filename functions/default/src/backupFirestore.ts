import firestore from '@google-cloud/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('backupFirestore')

const client = new firestore.v1.FirestoreAdminClient()

/**
 * Firestore の定期エクスポート（毎日 2:00 JST）。
 * legacy `scheduled_firestore_export` から移行。Storage バックアップ追加時は `backupStorage` 等と並ぶ命名。
 */
export const backupFirestore = onSchedule(
  {
    schedule: '0 2 * * *',
    timeZone: 'Asia/Tokyo',
    region: 'asia-northeast1',
  },
  async () => {
    const projectId = process.env.GCLOUD_PROJECT
    if (projectId == null || projectId === '') {
      throw new Error('GCLOUD_PROJECT is not set')
    }

    const exportBucket = `gs://${projectId}-firestore-backups`
    const databaseName = client.databasePath(projectId, '(default)')

    try {
      const [response] = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix: exportBucket,
        collectionIds: [],
      })
      logger.info('Firestore export started', { operationName: response.name, exportBucket })
    } catch (err) {
      logger.error('Export operation failed', { error: String(err) })
      throw new Error('Export operation failed')
    }
  },
)
