import { onCall, HttpsError } from 'firebase-functions/https'
import { getFirestore } from 'firebase-admin/firestore'
import {
  UpdateMenuCountInCartRequest,
  DeleteMenuInCartRequest,
  AddOrderRequest,
  AddOrderResponse,
} from '@shokujii/common/apis/order.js'
import { getOrder, getOrderInCart, saveOrder, deleteOrder, ShokujiiEventOrder } from './stores/order.js'
import { getEvent } from './stores/event.js'
import { EventOrder } from '@shokujii/common/schemas/EventOrder.js'

const db = getFirestore()

/**
 * カートに商品を追加する、またはカート内の商品を更新する Callable Function です。
 *
 * ユーザーが既にそのイベントのカート情報がある場合は、
 * 既存の注文に商品を追加します。カート情報がない場合は新規オーダーを作成します。
 *
 * request.data から以下の値を受け取ります：
 * - community_id: コミュニティID
 * - event_id: イベントID
 * - menus: 追加する商品の配列
 *
 * エラー条件:
 * - unauthenticated: request.auth.uid が存在しない場合
 * - not-found: 指定されたイベントが存在しない場合
 * - invalid-argument: 必須パラメータが不足している場合
 *
 * @param request Firebase Callable Function のリクエストオブジェクト
 * @returns order_id を含むレスポンスオブジェクト
 */
export const addOrder = onCall<AddOrderRequest, Promise<AddOrderResponse>>(async (request) => {
  const uid = request.auth?.uid
  if (uid == null) {
    throw new HttpsError('unauthenticated', '認証が必要です')
  }

  const { community_id, event_id, menus } = request.data

  if (
    community_id == null ||
    community_id === '' ||
    event_id == null ||
    event_id === '' ||
    !Array.isArray(menus) ||
    menus.length === 0
  ) {
    throw new HttpsError('invalid-argument', '必須パラメータが不足しています')
  }

  return db.runTransaction(async (transaction) => {
    const eventData = await getEvent(event_id, transaction)
    if (eventData == null || eventData.community_id !== community_id) {
      throw new HttpsError('not-found', `イベントが見つかりません: ${event_id}`)
    }

    const orderInCart = await getOrderInCart(community_id, event_id, uid, transaction)

    let targetOrder: EventOrder
    if (orderInCart == null) {
      // 既存カートがない場合：新規作成
      targetOrder = new ShokujiiEventOrder(community_id, event_id, null, {
        user_id: uid,
        community_id,
        community_account: eventData.community_account,
        event_id,
        menus,
      })
    } else {
      // 既存カートがある場合：メニューを追加/更新
      const updatedMenus = [...orderInCart.menus]
      for (const newMenu of menus) {
        const existingMenuIndex = updatedMenus.findIndex((m) => m.menu_id === newMenu.menu_id)

        if (existingMenuIndex !== -1) {
          // 既存メニューの個数を増やす
          updatedMenus[existingMenuIndex] = {
            ...updatedMenus[existingMenuIndex],
            count: updatedMenus[existingMenuIndex].count + newMenu.count,
          }
        } else {
          // 新しいメニューを追加
          updatedMenus.push(newMenu)
        }
      }
      orderInCart.menus = updatedMenus

      targetOrder = orderInCart
    }

    await saveOrder(community_id, event_id, targetOrder, transaction)
    return {
      order_id: targetOrder.id,
    }
  })
})

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

export const updateMenuCountInCart = onCall<UpdateMenuCountInCartRequest, Promise<void>>(async (request) => {
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

export const deleteMenuInCart = onCall<DeleteMenuInCartRequest, Promise<void>>(async (request) => {
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

    // 指定されたメニューIDを配列から除外する
    const filteredMenus = order.menus.filter((m) => m.menu_id !== menu_id)

    if (filteredMenus.length === 0) {
      // 全てのメニューが0個になった場合はドキュメントを削除する
      await deleteOrder(community_id, event_id, order_id, transaction)
    } else {
      // メニューを更新
      order.menus = filteredMenus
      await saveOrder(community_id, event_id, order, transaction)
    }
  })
})
