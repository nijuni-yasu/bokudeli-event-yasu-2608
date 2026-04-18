import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { createModuleLogger } from './utils/logger.js'
import { getPartner } from './stores/partner.js'
import { getEvent } from './stores/event.js'
import { convertPartnerMenusToEventMenus } from '@shokujii/common/utils/eventMenuConverter.js'
import { getMenuImageStoragePath, getEventMenuImageStoragePath } from '@shokujii/common/utils/storagePaths.js'

const logger = createModuleLogger('eventMenusSnapshot')

/**
 * 最新の PartnerMenu を EventMenu にスナップショットとして保存
 * EventMenuのis_selected状態を保持する
 * @param partnerId - パートナーID
 * @param eventId - イベントID
 * @param communityId - コミュニティID
 * @param startDatetime - イベント開始日時（ミリ秒）
 * @param selectedMenuIds - 選択するmenu_idの配列。省略時は既存EventMenuのis_selected状態から引き継ぐ
 */
export const savePartnerMenusToEventMenus = async (
  partnerId: string,
  eventId: string,
  communityId: string,
  startDatetime: number,
  selectedMenuIds?: string[],
): Promise<void> => {
  // partnerMenus を transaction 外で先読み（Storageコピーのために必要）
  const partner = await getPartner(partnerId)
  if (partner == null) {
    throw new Error(`Partner ${partnerId} not found`)
  }
  const partnerMenus = await partner.getMenus()

  // メニュー画像を Storage コピー（Firestore トランザクション前に実行。URL は EventMenu に持たせずパス参照）
  const bucket = getStorage().bucket()
  await Promise.allSettled(
    partnerMenus
      .filter((m) => !m.is_deleted)
      .map(async (m) => {
        const srcPath = getMenuImageStoragePath(partnerId, m.menu_id)
        const destPath = getEventMenuImageStoragePath(communityId, eventId, m.menu_id)
        try {
          await bucket.file(srcPath).copy(destPath)
        } catch (error) {
          logger.error('Failed to copy menu image', {
            menuId: m.menu_id,
            srcPath,
            destPath,
            error,
          })
        }
      }),
  )

  await getFirestore().runTransaction(async (transaction) => {
    const event = await getEvent(eventId, transaction)
    if (event == null) {
      throw new Error(`Event ${eventId} not found`)
    }

    // トランザクション内で再取得して整合性を保つ
    const freshPartnerMenus = await partner.getMenus(transaction)
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
      freshPartnerMenus,
      eventId,
      startDatetime,
      effectiveSelectedMenuIds,
    )

    // 生成したEventMenusを保存
    await Promise.all(eventMenusToSave.map((eventMenu) => event.saveMenu(eventMenu, transaction)))
  })
}

/**
 * 飲食店承認/却下時に、PartnerMenuをEventMenuにスナップショットとして保存
 * 飲食店の承認: applying_reservation → accepting_order
 * 飲食店の却下: applying_reservation → in_draft
 * 上記以外のステータス変更では実行されない（主催者による更新時はCallable Functionを使用）
 */
export const onShopReservationChanged = onDocumentWritten(
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
    if (!partnerId || !communityId || startDatetime == null) {
      logger.warn('Missing required parameters', {
        partnerId,
        communityId,
        eventId,
        startDatetime,
      })
      return
    }

    try {
      await savePartnerMenusToEventMenus(partnerId, eventId, communityId, startDatetime)
    } catch (error) {
      logger.error('Failed to save partner menus to event', {
        communityId,
        eventId,
        error,
      })
      throw error
    }
  },
)
