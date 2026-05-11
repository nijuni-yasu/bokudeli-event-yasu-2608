import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { createModuleLogger } from './utils/logger.js'
import { getEvent } from './stores/event.js'
import { getCommunity } from './stores/community.js'
import { getPartner } from './stores/partner.js'
import { getConfigGlobal } from './stores/config.js'
import { UpdateEventMenusRequest } from '@shokujii/common/apis/eventMenu.js'
import {
  convertPartnerMenusToEventMenus,
  updateEventMenusIsSelected,
  shouldRegenerateFromPartnerMenus,
  shouldUpdateExistingMenusOnly,
} from '@shokujii/common/utils/eventMenuConverter.js'

const logger = createModuleLogger('eventMenusSelection')

/**
 * イベントのメニューを更新するCallable Function
 * 主催者がイベント保存時に、selectedMenuIdsを受け取り、
 * event_statusによって処理を分岐:
 * - accepting_order状態: 既存EventMenuのis_selectedのみ更新（満席・締切時も同様）
 * - finished状態: 更新不可（エラー）
 * - それ以外: 最新のPartnerMenuから全EventMenuを生成して保存（is_selectedフラグで選択状態を管理）
 *
 * 重要:
 * - 全てのPartnerMenuがEventMenuとして保存され、is_selectedフラグで選択状態を管理
 * - メニューの有効期間チェックが実行され、期間外のメニューは自動的に除外される
 * - メニュー内容の固定判定にはevent_status.valueを使用（満席や締切でも承認後は固定）
 * - 編集禁止判定にはcalculatedEventStatusを使用（イベント終了時刻を過ぎていれば自動的にfinished判定）
 *
 * @param request.data.eventId - イベントID
 * @param request.data.communityId - コミュニティID
 * @param request.data.selectedMenuIds - 選択されたmenu_idの配列
 *
 * @throws {HttpsError} unauthenticated - 認証されていない場合
 * @throws {HttpsError} invalid-argument - 必須パラメータが不足している場合
 * @throws {HttpsError} permission-denied - ユーザーに編集権限がない場合
 * @throws {HttpsError} not-found - イベントまたはPartnerが見つからない場合
 * @throws {HttpsError} failed-precondition - イベントがfinished状態の場合
 * @throws {HttpsError} internal - その他のエラー
 */
export const updateEventMenus = onCall<UpdateEventMenusRequest>({ region: 'asia-northeast1' }, async (request) => {
  // 認証チェック
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated')
  }

  const { eventId, communityId, selectedMenuIds } = request.data

  // パラメータバリデーション
  if (!eventId || !communityId || !Array.isArray(selectedMenuIds)) {
    throw new HttpsError('invalid-argument', 'eventId, communityId, and selectedMenuIds (array) are required')
  }

  if (selectedMenuIds.length === 0) {
    throw new HttpsError('invalid-argument', 'At least one menu must be selected')
  }

  // 認可チェック: コミュニティのマネージャーまたはサポートユーザーである必要がある
  const community = await getCommunity(communityId)
  if (!community) {
    throw new HttpsError('not-found', `Community ${communityId} not found`)
  }
  const userId = request.auth.uid
  const isManager = await community.hasRole(userId, 'manager')
  const config = await getConfigGlobal()
  const isSupport = config?.isSupport(userId) ?? false
  if (!isManager && !isSupport) {
    throw new HttpsError('permission-denied', 'User does not have permission to update this event')
  }

  try {
    await getFirestore().runTransaction(async (transaction) => {
      // イベント情報を取得
      const event = await getEvent(eventId, transaction)
      if (event == null) {
        throw new HttpsError('not-found', `Event ${eventId} not found`)
      }

      const eventStatus = event.event_status.value
      const calculatedStatus = event.calculatedEventStatus

      // finished または event_canceled 状態の場合は更新不可
      if (calculatedStatus === 'finished' || calculatedStatus === 'event_canceled') {
        throw new HttpsError('failed-precondition', 'Cannot update menus after event is finished or canceled.')
      }

      if (shouldUpdateExistingMenusOnly(eventStatus)) {
        const existingEventMenus = await event.getMenus(transaction)
        const { changedMenus } = updateEventMenusIsSelected(existingEventMenus, selectedMenuIds)

        // 変更されたメニューのみ保存
        await Promise.all(
          changedMenus.map(async (menu) => {
            await event.saveMenu(menu, transaction)
          }),
        )

        logger.info('Updated is_selected flags in accepting_order status', {
          eventId,
          communityId,
          status: eventStatus,
          selectedMenusCount: selectedMenuIds.length,
          changedMenusCount: changedMenus.length,
        })
      } else if (shouldRegenerateFromPartnerMenus(eventStatus)) {
        const partner = await getPartner(event.partner_id)
        if (!partner) {
          throw new HttpsError('not-found', `Partner not found for event ${eventId}`)
        }

        const partnerMenus = await partner.getMenus(transaction)

        // 最新のPartnerMenusから全EventMenusを生成（is_selectedフラグで管理）
        // 期間チェックも実行され、期間外のメニューは除外
        const eventMenusToSave = convertPartnerMenusToEventMenus(
          partnerMenus,
          eventId,
          event.event_start_datetime,
          selectedMenuIds,
        )

        // 既存のEventMenusを取得し削除
        const existingEventMenus = await event.getMenus(transaction)
        await Promise.all(
          existingEventMenus.map(async (menu) => {
            await event.deleteMenu(menu, transaction)
          }),
        )

        // 生成したEventMenusを保存
        await Promise.all(
          eventMenusToSave.map(async (eventMenu) => {
            await event.saveMenu(eventMenu, transaction)
          }),
        )

        logger.info('Updated all menus from latest PartnerMenus with is_selected flag', {
          eventId,
          communityId,
          status: eventStatus,
          selectedMenusCount: selectedMenuIds.length,
          totalSavedMenusCount: eventMenusToSave.length,
          selectedSavedMenusCount: eventMenusToSave.filter((m) => m.is_selected).length,
        })
      } else {
        throw new HttpsError('failed-precondition', `Unexpected event status: ${eventStatus}`)
      }
    })

    return { success: true }
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error
    }
    logger.error('Failed to update event menus', {
      eventId,
      communityId,
      selectedMenuIds,
      error,
    })
    throw new HttpsError('internal', 'Failed to update event menus')
  }
})
