import { Timestamp } from 'firebase-admin/firestore'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import isEqual from 'lodash/isEqual.js'
import { addEventChangeLog } from './stores/event.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('eventLog')

type FirestoreEventData = Record<string, unknown> | null

const calculateDifferences = (before: FirestoreEventData, after: FirestoreEventData): Record<string, unknown> => {
  if (before == null && after != null) {
    return after
  }

  if (before != null && after == null) {
    return {}
  }

  if (before == null || after == null) {
    return {}
  }

  const differences: Record<string, unknown> = {}
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  for (const key of keys) {
    const beforeValue = before[key]
    const afterValue = after[key]
    if (!isEqual(beforeValue, afterValue)) {
      differences[key] = afterValue
    }
  }

  return differences
}

/**
 * イベントドキュメントの変更差分を `events/{eventId}/logs` に記録する。
 * legacy `log_event_status` から移行。export 名は維持する。
 */
export const log_event_status = onDocumentWritten(
  {
    document: 'communities/{communityId}/events/{eventId}',
    region: 'asia-northeast1',
  },
  async (event) => {
    const before = event.data?.before.exists ? (event.data.before.data() as Record<string, unknown>) : null
    const after = event.data?.after.exists ? (event.data.after.data() as Record<string, unknown>) : null

    const differences = calculateDifferences(before, after)
    const { communityId, eventId } = event.params

    if (Object.keys(differences).length === 0) {
      logger.info('no change', { communityId, eventId })
      return
    }

    const updatedBy = typeof after?.updated_by === 'string' ? after.updated_by : ''
    if (updatedBy === '') {
      logger.warn('updated_by is missing, skip log write', { communityId, eventId })
      return
    }

    if (differences.updated_at == null) {
      differences.updated_at = Timestamp.now()
    }

    await addEventChangeLog(communityId, eventId, differences, updatedBy)
  },
)
