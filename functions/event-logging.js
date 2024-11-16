import functions from 'firebase-functions'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const db = getFirestore()

/**
 * 再帰的にオブジェクトや配列を比較する関数
 */
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true

  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false
  }

  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) return false

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false
    }
  }

  return true
}

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
    if (beforeValue instanceof Timestamp && afterValue instanceof Timestamp) {
      if (!beforeValue.isEqual(afterValue)) {
        differences[key] = afterValue
      }
    } else if (typeof beforeValue === 'object' && typeof afterValue === 'object') {
      // オブジェクトや配列の深い比較
      if (!deepEqual(beforeValue, afterValue)) {
        differences[key] = afterValue
      }
    } else if (beforeValue !== afterValue) {
      differences[key] = afterValue
    }
  }

  return differences
}

const write_log = async (communityId, eventId, differences, updated_by) => {
  const logRef = db.collection(`communities/${communityId}/events/${eventId}/logs`)
  differences['updated_by'] = updated_by
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
