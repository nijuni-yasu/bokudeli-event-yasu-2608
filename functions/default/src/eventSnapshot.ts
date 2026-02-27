import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { createModuleLogger } from './utils/logger.js'
import { getPartner } from './stores/partner.js'
import { getEvent } from './stores/event.js'
import { convertPartnerMenusToEventMenus } from '@shokujii/common/utils/eventMenuConverter.js'

const logger = createModuleLogger('eventSnapshot')

/**
 * 最新の PartnerMenu を EventMenu にスナップショットとしてコピー
 * EventMenuのis_selected状態を保持する
 * @param partnerId - パートナーID
 * @param eventId - イベントID
 * @param startDatetime - イベント開始日時（ミリ秒）
 * @param selectedMenuIds - 選択するmenu_idの配列。省略時は既存EventMenuのis_selected状態から引き継ぐ
 */
export const makeMenuSnapshot = async (
  partnerId: string,
  eventId: string,
  startDatetime: number,
  selectedMenuIds?: string[],
): Promise<void> =>
  getFirestore().runTransaction(async (transaction) => {
    const partner = await getPartner(partnerId)
    const event = await getEvent(eventId, transaction)
    if (partner == null || event == null) {
      throw new Error(`Partner ${partnerId} or Event ${eventId} not found`)
    }

    const partnerMenus = await partner.getMenus(transaction)
    const existingEventMenus = await event.getMenus(transaction)

    // 既存のメニューを削除
    await Promise.all(
      existingEventMenus.map(async (menu) => {
        await event.deleteMenu(menu, transaction)
      }),
    )

    // selectedMenuIds が指定されていない場合は既存EventMenuのis_selected状態から引き継ぐ
    const effectiveSelectedMenuIds =
      selectedMenuIds ?? existingEventMenus.filter((m) => m.is_selected).map((m) => m.menu_id)
    const eventMenusToSave = convertPartnerMenusToEventMenus(
      partnerMenus,
      eventId,
      startDatetime,
      effectiveSelectedMenuIds,
    )

    // 生成したEventMenusを保存
    await Promise.all(
      eventMenusToSave.map(async (eventMenu) => {
        await event.saveMenu(eventMenu, transaction)
      }),
    )
  })

/**
 * 飲食店承認/却下時に、PartnerMenuをEventMenuにコピー
 * 飲食店の承認: applying_reservation → accepting_order
 * 飲食店の却下: applying_reservation → in_draft
 * 上記以外のステータス変更では実行されない（主催者による更新時はCallable Functionを使用）
 */
export const makeShopSnapshotToEvent = onDocumentWritten(
  {
    document: 'communities/{communityId}/events/{eventId}',
    region: 'asia-northeast1',
  },
  async (change) => {
    if (!change.data) {
      logger.warn('Change data is undefined')
      return
    }

    const before = change.data.before
    const after = change.data.after

    if (!after?.exists) {
      return
    }

    const beforeStatus = before?.get('event_status')?.value
    const afterStatus = after.get('event_status')?.value

    // 飲食店による承認または却下の場合のみ実行
    const isShopApproval = beforeStatus === 'applying_reservation' && afterStatus === 'accepting_order'
    const isShopRejection = beforeStatus === 'applying_reservation' && afterStatus === 'in_draft'

    if (!isShopApproval && !isShopRejection) {
      return
    }

    // イベントデータを取得
    const startDatetime = (after.get('event_start_datetime') as Timestamp | undefined)?.toMillis() ?? null
    const partnerId = after.get('partner_id') as string | undefined
    const communityId = after.get('community_id') as string | undefined
    const eventId = after.id

    // 必須パラメータのチェック
    if (!partnerId || startDatetime == null) {
      logger.warn('Missing required parameters', {
        partnerId,
        communityId,
        eventId,
        startDatetime,
      })
      return
    }

    try {
      await makeMenuSnapshot(partnerId, eventId, startDatetime)
    } catch (error) {
      logger.error('Failed to make menu snapshot', {
        communityId,
        eventId,
        error,
      })
      throw error
    }
  },
)
