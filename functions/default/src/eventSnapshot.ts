import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

/**
 * パートナーのメニューをイベントのメニューコレクションにスナップショットとしてコピー
 * @param partnerId - パートナーID
 * @param communityId - コミュニティID
 * @param eventId - イベントID
 * @param startDatetime - イベント開始日時（ミリ秒）
 */
const makeMenuSnapshot = async (
  partnerId: string,
  communityId: string,
  eventId: string,
  startDatetime: number | null,
): Promise<void> => {
  const db = getFirestore()
  const sourceCollectionRef = db.collection('partners').doc(partnerId).collection('menus')
  const targetCollectionRef = db
    .collection('communities')
    .doc(communityId)
    .collection('events')
    .doc(eventId)
    .collection('menus')

  await db.runTransaction(async (transaction) => {
    const targetSnapshot = await transaction.get(targetCollectionRef)
    const sourceSnapshot = await transaction.get(sourceCollectionRef)

    // 既存のメニューを削除
    targetSnapshot.docs.forEach((doc) => {
      transaction.delete(doc.ref)
    })

    // パートナーのメニューをコピー（期間が重なるもののみ）
    sourceSnapshot.docs.forEach((doc) => {
      const menuDateStart = doc.get('menu_date_start') as Timestamp | undefined
      const menuDateEnd = doc.get('menu_date_end') as Timestamp | undefined

      const menuDateStartMillis = menuDateStart?.toMillis()
      const menuDateEndMillis = menuDateEnd?.toMillis()

      // メニューの日付が未設定、またはイベント開始時刻がメニューの期間内の場合はコピー
      if (
        menuDateStartMillis == null ||
        menuDateEndMillis == null ||
        (menuDateStartMillis! <= startDatetime! && startDatetime! <= menuDateEndMillis!)
      ) {
        transaction.set(targetCollectionRef.doc(doc.id), doc.data())
      }
    })
  })
}

/**
 * イベント作成・更新時に、パートナーのメニューをイベントのメニューコレクションにスナップショットとしてコピー
 */
export const makeShopSnapshotToEvent = onDocumentWritten(
  {
    document: 'communities/{communityId}/events/{eventId}',
    region: 'asia-northeast1',
  },
  async (change) => {
    if (!change.data) {
      console.warn('Change data is undefined')
      return
    }

    const before = change.data.before
    const after = change.data.after

    if (!after?.exists) {
      return
    }

    const beforeStatus = before?.get('event_status')?.value
    const afterStatus = after.get('event_status')?.value

    // ステータスがaccepting_orderからaccepting_orderに変更された場合は何もしない
    if (beforeStatus === 'accepting_order' && afterStatus === 'accepting_order') {
      return
    }

    // ステータスがaccepting_orderから他のステータスに変更された場合は警告を出して処理を継続
    if (beforeStatus === 'accepting_order' && afterStatus !== 'accepting_order') {
      const communityId = after.get('community_id') as string | undefined
      const eventId = after.id
      console.warn(
        `Event status changed from accepting_order to ${afterStatus}\n` +
          `Community: ${communityId}, Event: ${eventId}`,
      )
    }

    // イベントデータを取得
    const afterStartDatetime = (after.get('event_start_datetime') as Timestamp | undefined)?.toMillis() ?? null
    const partnerId = after.get('partner_id') as string | undefined
    const communityId = after.get('community_id') as string | undefined
    const eventId = after.id
    const eventName = after.get('event_name') as string | undefined

    // 必須パラメータのチェック
    if (!partnerId || !communityId) {
      console.warn(
        `Missing required parameters: partnerId=${partnerId}, communityId=${communityId}, eventId=${eventId}`,
      )
      return
    }

    try {
      await makeMenuSnapshot(partnerId, communityId, eventId, afterStartDatetime)
    } catch (error) {
      console.warn(`Community: ${communityId}, Event: ${eventId}, EventName: ${eventName}`, error)
    }
  },
)
