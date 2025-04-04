import functions from 'firebase-functions/v1'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import _ from 'lodash'

const db = getFirestore()

/**
 * 差分を計算する関数
 */
const calculateDifferences = (before, after) => {
  if (!before && after) {
    // 新規作成の場合
    return after
  }

  if (before && !after) {
    // 削除の場合
    return {}
  }

  // 更新の場合、変更点を探す
  const differences = {}
  for (const key in { ...before, ...after }) {
    const beforeValue = before[key]
    const afterValue = after[key]
    if (!_.isEqual(beforeValue, afterValue)) {
      differences[key] = afterValue
    }
  }

  return differences
}

const write_log = async (communityId, eventId, differences, updated_by) => {
  const logRef = db.collection(`communities/${communityId}/events/${eventId}/logs`)
  differences['updated_by'] = updated_by
  if (!differences['updated_at']) {
    differences['updated_at'] = Timestamp.now()
  }
  await logRef.add(differences)
}

export const log_event_status = functions
  .region('asia-northeast1')
  .firestore.document('communities/{communityId}/events/{eventId}')
  .onWrite(async (change, context) => {
    const before = change.before.exists ? change.before.data() : null
    const after = change.after.exists ? change.after.data() : null

    // 差分を計算
    const differences = calculateDifferences(before, after)

    const { communityId, eventId } = context.params
    if (Object.keys(differences).length > 0) {
      // console.log({ communityId, eventId, differences })
      write_log(communityId, eventId, differences, after['updated_by'])
    } else {
      const message = 'no change'
      console.log({ communityId, eventId, message })
    }
  })
