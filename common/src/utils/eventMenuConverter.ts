import { PartnerMenu } from '../schemas/PartnerMenu.js'
import { EventMenu } from '../schemas/EventMenu.js'

/**
 * 選択メニューIDにデフォルト選択を適用
 * 空配列または店舗変更時は、全メニューが選択されたものとして全menu_idを返す
 *
 * @param selectedMenuIds - ユーザーが選択したmenu_idの配列
 * @param partnerMenus - 現在の店舗のPartnerMenu配列
 * @returns デフォルト選択を適用したmenu_id配列
 */
function applyDefaultSelectedMenuIds(selectedMenuIds: string[], partnerMenus: PartnerMenu[]): string[] {
  // 空配列の場合は全menu_idを返す（新規作成時、デフォルトで全選択）
  if (selectedMenuIds.length === 0) {
    return partnerMenus.map((pm) => pm.menu_id)
  }

  // 店舗変更判定: 共通のmenu_idがない場合は全menu_idを返す
  const partnerMenuIds = partnerMenus.map((pm) => pm.menu_id)
  const hasCommonMenuId = selectedMenuIds.some((id) => partnerMenuIds.includes(id))

  return hasCommonMenuId ? selectedMenuIds : partnerMenuIds
}

/**
 * PartnerMenuをEventMenuに変換
 * @param partnerMenu - 変換元のPartnerMenu
 * @param eventId - イベントID
 * @param eventStartDatetime - イベント開始日時（期間チェック用）
 * @param selectedMenuIds - 選択されたmenu_idの配列
 * @returns 変換されたEventMenu、または売り切れ・期間外の場合はnull
 */
export function convertFromPartnerMenuToEventMenu(
  partnerMenu: PartnerMenu,
  eventId: string,
  eventStartDatetime: number | null,
  selectedMenuIds: string[],
): EventMenu | null {
  // 売り切れチェック：売り切れメニューはEventMenuに含めない
  if (partnerMenu.is_sold_out) {
    return null
  }

  // 期間チェック：イベント開始日時がメニューの有効期間内かチェック
  if (eventStartDatetime != null && partnerMenu.menu_date_start != null && partnerMenu.menu_date_end != null) {
    // 期間外のメニューは変換しない
    if (partnerMenu.menu_date_start > eventStartDatetime || eventStartDatetime > partnerMenu.menu_date_end) {
      return null
    }
  }

  // EventMenuに変換（期間情報は含めない）
  return new EventMenu(eventId, partnerMenu.menu_id, {
    menu_name: partnerMenu.menu_name,
    menu_description: partnerMenu.menu_description,
    menu_image_url: partnerMenu.menu_image_url,
    menu_price: partnerMenu.menu_price,
    is_sold_out: partnerMenu.is_sold_out,
    menu_sort_number: partnerMenu.menu_sort_number,
    is_selected: selectedMenuIds.includes(partnerMenu.menu_id),
  })
}

/**
 * PartnerMenuの配列をEventMenuの配列に変換
 * @param partnerMenus - 変換元のPartnerMenu配列
 * @param eventId - イベントID
 * @param eventStartDatetime - イベント開始日時（期間チェック用）
 * @param selectedMenuIds - 選択されたmenu_idの配列（空配列の場合はデフォルトで全選択）
 * @returns 変換されたEventMenu配列（売り切れ・期間外のメニューは除外）
 */
export function convertPartnerMenusToEventMenus(
  partnerMenus: PartnerMenu[],
  eventId: string,
  eventStartDatetime: number | null,
  selectedMenuIds: string[] = [],
): EventMenu[] {
  // デフォルト選択を適用: 空配列または店舗変更時は全menu_idに展開
  const effectiveSelectedMenuIds = applyDefaultSelectedMenuIds(selectedMenuIds, partnerMenus)

  return partnerMenus
    .map((menu) => convertFromPartnerMenuToEventMenu(menu, eventId, eventStartDatetime, effectiveSelectedMenuIds))
    .filter((menu): menu is EventMenu => menu !== null)
}

/**
 * EventMenusのis_selectedフラグのみを更新する
 * accepting_order状態でメニュー内容を変更せずに選択状態だけを更新する際に使用
 *
 * @param eventMenus - 既存のEventMenu配列
 * @param selectedMenuIds - 選択されたmenu_idの配列
 * @returns is_selectedが更新されたEventMenu配列と、変更されたメニューのリスト
 */
export function updateEventMenusIsSelected(
  eventMenus: EventMenu[],
  selectedMenuIds: string[],
): { updatedMenus: EventMenu[]; changedMenus: EventMenu[] } {
  const selectedMenuIdsSet = new Set(selectedMenuIds)
  const changedMenus: EventMenu[] = []

  const updatedMenus = eventMenus.map((menu) => {
    const newIsSelected = selectedMenuIdsSet.has(menu.menu_id)
    if (menu.is_selected !== newIsSelected) {
      const updatedMenu = new EventMenu(menu.event_id, menu.menu_id, { ...menu, is_selected: newIsSelected })
      changedMenus.push(updatedMenu)
      return updatedMenu
    }
    return menu
  })

  return { updatedMenus, changedMenus }
}
