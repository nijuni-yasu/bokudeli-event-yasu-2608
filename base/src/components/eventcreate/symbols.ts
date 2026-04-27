import type { InjectionKey, Ref } from 'vue'

/**
 * EventEditStepNav が描画されているホスト画面（イベント編集タブ等）が
 * 現在ユーザーから見えているかを伝えるための injection key。
 *
 * 提供されない場合は常に true 扱い（newevent.vue のような単独画面で透過的に動作させるため）。
 *
 * 用途:
 * - user の `[eventId]/[tab].vue` がアクティブタブを provide し、
 *   `EventEditStepNav` 側で `visible && hostActive` を合成して
 *   タブ非アクティブ時に Teleport された body 直下のステップナビを非表示にする。
 */
export const injectionKeyEventEditHostActive: InjectionKey<Ref<boolean>> = Symbol('eventEditHostActive')
