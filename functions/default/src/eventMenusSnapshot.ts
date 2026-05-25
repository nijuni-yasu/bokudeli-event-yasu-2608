import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { createModuleLogger } from './utils/logger.js'
import { getPartner } from './stores/partner.js'
import { getEventInCommunity } from './stores/event.js'
import { convertPartnerMenusToEventMenus } from '@shokujii/common/utils/eventMenuConverter.js'
import {
  getMenuImageStoragePath,
  getEventMenuImageStoragePath,
  getEventMenuImagesPrefix,
} from '@shokujii/common/utils/storagePaths.js'

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
  const partner = await getPartner(partnerId)
  if (partner == null) {
    throw new Error(`Partner ${partnerId} not found`)
  }

  const eventForSelection = await getEventInCommunity(communityId, eventId)
  if (eventForSelection == null) {
    throw new Error(`Event ${eventId} not found`)
  }
  const existingEventMenusForSelection = await eventForSelection.getMenus()
  const effectiveSelectedMenuIds =
    selectedMenuIds ?? existingEventMenusForSelection.filter((m) => m.is_selected).map((m) => m.menu_id)

  const partnerMenus = await partner.getMenus()
  const eventMenusToSave = convertPartnerMenusToEventMenus(
    partnerMenus,
    eventId,
    startDatetime,
    effectiveSelectedMenuIds,
  )

  const bucket = getStorage().bucket()
  await bucket.deleteFiles({ prefix: getEventMenuImagesPrefix(communityId, eventId) })

  const copyResults = await Promise.allSettled(
    eventMenusToSave.map(async (eventMenu) => {
      const srcPath = getMenuImageStoragePath(partnerId, eventMenu.menu_id)
      const destPath = getEventMenuImageStoragePath(communityId, eventId, eventMenu.menu_id)
      const [srcExists] = await bucket.file(srcPath).exists()
      if (!srcExists) {
        logger.info('PartnerMenu image not found', {
          menuId: eventMenu.menu_id,
          srcPath,
          destPath,
        })
        return
      }
      try {
        await bucket.file(srcPath).copy(destPath)
      } catch (error) {
        logger.error('Failed to copy menu image', {
          menuId: eventMenu.menu_id,
          srcPath,
          destPath,
          error,
        })
        throw error
      }
    }),
  )

  const failedMenuIds: string[] = []
  for (let i = 0; i < copyResults.length; i++) {
    if (copyResults[i].status === 'rejected') {
      failedMenuIds.push(eventMenusToSave[i].menu_id)
    }
  }
  if (failedMenuIds.length > 0) {
    logger.error('Menu image copy failed; aborting Firestore snapshot', {
      communityId,
      eventId,
      failedMenuIds,
      failedCount: failedMenuIds.length,
      totalCount: eventMenusToSave.length,
    })
    throw new Error(`Menu image copy failed: ${failedMenuIds.join(', ')}`)
  }

  await getFirestore().runTransaction(async (transaction) => {
    const event = await getEventInCommunity(communityId, eventId, transaction)
    if (event == null) {
      throw new Error(`Event ${eventId} not found`)
    }

    const freshPartnerMenus = await partner.getMenus(transaction)
    const existingEventMenus = await event.getMenus(transaction)

    await Promise.all(
      existingEventMenus.map(async (menu) => {
        await event.deleteMenu(menu, transaction)
      }),
    )

    const eventMenusToSaveInTx = convertPartnerMenusToEventMenus(
      freshPartnerMenus,
      eventId,
      startDatetime,
      effectiveSelectedMenuIds,
    )

    await Promise.all(eventMenusToSaveInTx.map((eventMenu) => event.saveMenu(eventMenu, transaction)))
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
    // v2 トリガーの幽霊状態（Firestore → Eventarc publish 断）を検知するための invocation log
    // 詳細: documents/07_リファクタリング/17_onDocumentWritten不具合.md
    logger.info('onShopReservationChanged invoked', {
      communityId: change.params.communityId,
      eventId: change.params.eventId,
      hasBefore: change.data?.before.exists ?? false,
      hasAfter: change.data?.after.exists ?? false,
    })

    if (!change.data) {
      logger.warn('Change data is undefined')
      return
    }

    const before = change.data.before
    const after = change.data.after

    if (!after?.exists) {
      logger.info('Event document deleted; skip', {
        eventId: change.params.eventId,
      })
      return
    }

    const beforeStatus = before?.get('event_status')?.value
    const afterStatus = after.get('event_status')?.value

    // 飲食店による承認または却下の場合のみ実行
    const isShopApproval = beforeStatus === 'applying_reservation' && afterStatus === 'accepting_order'
    const isShopRejection = beforeStatus === 'applying_reservation' && afterStatus === 'in_draft'

    if (!isShopApproval && !isShopRejection) {
      logger.info('Not a shop approval/rejection transition; skip', {
        eventId: change.params.eventId,
        beforeStatus,
        afterStatus,
      })
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

    logger.info('Executing menu snapshot', {
      partnerId,
      communityId,
      eventId,
      isShopApproval,
      isShopRejection,
      startDatetime,
    })

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
