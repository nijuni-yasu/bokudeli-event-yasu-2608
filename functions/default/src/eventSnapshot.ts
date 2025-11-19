import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getPartner } from './stores/partner.js'
import { getEvent } from './stores/event.js'

/**
 * パートナーのメニューをイベントのメニューコレクションにスナップショットとしてコピー
 * @param partnerId - パートナーID
 * @param eventId - イベントID
 * @param startDatetime - イベント開始日時（ミリ秒）
 */
const makeMenuSnapshot = async (partnerId: string, eventId: string, startDatetime: number): Promise<void> =>
  getFirestore().runTransaction(async (transaction) => {
    const partner = await getPartner(partnerId)
    const event = await getEvent(eventId, transaction)
    if (partner == null || event == null) {
      throw new Error(`Partner ${partnerId} or Event ${eventId} not found`)
    }
    const partnerMenus = await partner.getMenus(transaction)
    const eventMenus = await event.getMenus(transaction)
    // 既存のメニューを削除
    await Promise.all(
      eventMenus.map(async (menu) => {
        await event.deleteMenu(menu, transaction)
      }),
    )

    // パートナーのメニューをコピー（期間が重なるもののみ）
    await Promise.all(
      partnerMenus.map(async (menu) => {
        const menuDateStart = menu.menu_date_start
        const menuDateEnd = menu.menu_date_end

        // メニューの日付が未設定、またはイベント開始時刻がメニューの期間内の場合はコピー
        if (
          menuDateStart == null ||
          menuDateEnd == null ||
          (menuDateStart <= startDatetime && startDatetime <= menuDateEnd)
        ) {
          await event.saveMenu(menu, transaction)
        }
      }),
    )
  })

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
    const startDatetime = (after.get('event_start_datetime') as Timestamp | undefined)?.toMillis() ?? null
    const partnerId = after.get('partner_id') as string | undefined
    const communityId = after.get('community_id') as string | undefined
    const eventId = after.id
    const eventName = after.get('event_name') as string | undefined

    // 必須パラメータのチェック
    if (!partnerId || !startDatetime) {
      console.warn(
        `Missing required parameters: partnerId=${partnerId}, communityId=${communityId}, eventId=${eventId}, startDatetime=${startDatetime}`,
      )
      return
    }

    try {
      await makeMenuSnapshot(partnerId, eventId, startDatetime)
    } catch (error) {
      console.warn(`Community: ${communityId}, Event: ${eventId}, EventName: ${eventName}`, error)
    }
  },
)
