import { onCall, HttpsError } from 'firebase-functions/https'
import { getFirestore } from 'firebase-admin/firestore'
import { UpdateOrderMenuCountRequest, DeleteOrderMenuRequest } from '@shokujii/common/apis/order.js'
import { getOrder, saveOrder, deleteOrder } from './stores/order.js'

const db = getFirestore()

/**
 * 注文中（カート内）のメニューの個数を更新する Callable Function です。
 *
 * `request.data` から以下の値を受け取り、指定された注文ドキュメント内の該当メニューの `count` を更新します。
 * - `community_id`: コミュニティID
 * - `event_id`: イベントID
 * - `order_id`: 注文ID
 * - `menu_id`: メニューID
 * - `count`: 設定する個数（1以上の整数）
 *
 * 更新後、メニューの個数が 0 以下になったメニューは削除され、全メニューが削除された場合は注文自体を削除します。
 *
 * エラー条件:
 * - `unauthenticated`: `request.auth.uid` が存在しない場合（未認証ユーザーによる呼び出し）
 * - `invalid-argument`:
 *   - `count` が指定されていない、整数でない、または 1 未満の場合
 *   - 対象の注文のステータスが `in_cart` ではない場合
 * - `not-found`:
 *   - 指定された注文が存在しない場合
 *   - 注文内に指定されたメニューが存在しない場合
 * - `permission-denied`: 注文の `user_id` と `request.auth.uid` が一致せず、他人の注文を操作しようとした場合
 *
 * @param request Firebase Callable Function のリクエストオブジェクト
 * @returns メニュー個数の更新または注文削除が完了したら解決される Promise
 */

export const updateOrderMenuCount = onCall<UpdateOrderMenuCountRequest, Promise<void>>(async (request) => {
  // 認証チェック
  const uid = request.auth?.uid
  if (uid == null) {
    throw new HttpsError('unauthenticated', '認証が必要です')
  }

  // 引数の取得
  const { community_id, event_id, order_id, menu_id, count } = request.data

  // 基本的なバリデーション
  if (count == null || !Number.isInteger(count) || count < 1) {
    throw new HttpsError('invalid-argument', 'count は1以上の整数である必要があります')
  }

  return db.runTransaction(async (transaction) => {
    // stores を使用して注文を取得
    const order = await getOrder(community_id, event_id, order_id, transaction)

    // 注文存在チェック
    if (order == null) {
      throw new HttpsError('not-found', '注文が見つかりません')
    }

    // 権限チェック
    if (order.user_id !== uid) {
      throw new HttpsError('permission-denied', `権限がありません: ${uid}`)
    }

    // ステータスチェック
    if (order.status !== 'in_cart') {
      throw new HttpsError('invalid-argument', 'カート内の注文ではありません')
    }

    const menuIndex = order.menus.findIndex((m) => m.menu_id === menu_id)

    // メニュー存在チェック
    if (menuIndex === -1) {
      throw new HttpsError('not-found', `メニューが見つかりません: ${menu_id}`)
    }

    // 個数更新
    const updatedMenus = [...order.menus]
    updatedMenus[menuIndex] = {
      ...updatedMenus[menuIndex],
      count: count,
    }

    // 個数が0になった場合はメニューを削除
    const filteredMenus = updatedMenus.filter((m) => m.count > 0)

    // メニューを更新
    order.menus = filteredMenus
    await saveOrder(community_id, event_id, order, transaction)
  })
})

/**
 * 注文中（カート内）のメニューを削除する Callable Function です。
 *
 * `request.data` から以下の値を受け取り、指定された注文ドキュメント内の該当メニューを削除します。
 * - `community_id`: コミュニティID
 * - `event_id`: イベントID
 * - `order_id`: 注文ID
 * - `menu_id`: 削除するメニューID
 *
 * 削除後、全てのメニューが削除された場合は注文自体も削除します。
 *
 * エラー条件:
 * - `unauthenticated`: `request.auth.uid` が存在しない場合（未認証ユーザーによる呼び出し）
 * - `invalid-argument`: 対象の注文のステータスが `in_cart` ではない場合
 * - `not-found`: 指定された注文が存在しない場合
 * - `permission-denied`: 注文の `user_id` と `request.auth.uid` が一致せず、他人の注文を操作しようとした場合
 *
 * @param request Firebase Callable Function のリクエストオブジェクト
 * @returns メニュー削除または注文削除が完了したら解決される Promise
 */

export const deleteOrderMenu = onCall<DeleteOrderMenuRequest, Promise<void>>(async (request) => {
  // 認証チェック
  const uid = request.auth?.uid
  if (uid == null) {
    throw new HttpsError('unauthenticated', '認証が必要です')
  }

  // 引数の取得
  const { community_id, event_id, order_id, menu_id } = request.data

  return db.runTransaction(async (transaction) => {
    // stores を使用して注文を取得
    const order = await getOrder(community_id, event_id, order_id, transaction)

    // 注文存在チェック
    if (order == null) {
      throw new HttpsError('not-found', '注文が見つかりません')
    }

    // 権限チェック
    if (order.user_id !== uid) {
      throw new HttpsError('permission-denied', `権限がありません: ${uid}`)
    }

    // ステータスチェック
    if (order.status !== 'in_cart') {
      throw new HttpsError('invalid-argument', 'カート内の注文ではありません')
    }

    // 個数が0になった場合はメニューを削除
    const filteredMenus = order.menus.filter((m) => m.menu_id !== menu_id)

    if (filteredMenus.length === 0) {
      // 全てのメニューが0個になった場合は注文を削除
      await deleteOrder(community_id, event_id, order_id, transaction)
    } else {
      // メニューを更新
      order.menus = filteredMenus
      await saveOrder(community_id, event_id, order, transaction)
    }
  })
})
