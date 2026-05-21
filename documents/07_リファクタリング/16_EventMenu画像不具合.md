# EventMenu 画像の整合性リファクタリング

## 概要

EventMenu の Storage 画像（`communities/{communityId}/events/{eventId}/menus/{menuId}/image`）について、現状は以下のチグハグがある。

- **Firestore の EventMenu レコードは「PartnerMenu のスナップショット」として複製している**のに、**Storage 画像だけは下書き中は PartnerMenu パス（`partners/{partnerId}/menus/{menuId}/image`）を直接参照**している。
- **イベントコピー / 繰り返しコピーでは、下書き状態（`in_draft`）で作成されるにもかかわらず Storage 画像コピーが走り**、誰も参照しない画像が Storage に書き込まれる。
- **飲食店承認時（`applying_reservation → accepting_order`）に Storage コピーが行われるが、過去のコピー（イベントコピー由来 / 前店舗由来）の孤児ファイルが残る**ため、店舗変更 → 承認の経路で「以前の画像」と「新しい画像」が混在し、結果的に画像が表示されない事象が発生する。

本ドキュメントでは、EventMenu の Firestore レコードと Storage 画像の対応を **1:1 で常に保つ**方針に統一するリファクタリング内容と、既存イベントへの影響をフロント側の遅延フォールバックで吸収する移行戦略をまとめる。

---

## 1. 現状の挙動

### 1.1 Firestore EventMenu レコードのコピータイミング

| 操作 | 入口 | EventMenu レコード | Storage 画像コピー |
| :-- | :-- | :-- | :-- |
| 主催者「メニュー保存」（`in_draft` / `applying_reservation`） | `updateEventMenus` Callable（`shouldRegenerateFromPartnerMenus` 分岐） | 全削除 → 再生成 | ❌ |
| 主催者「メニュー保存」（`accepting_order`） | `updateEventMenus` Callable（`shouldUpdateExistingMenusOnly` 分岐） | `is_selected` のみ更新 | ❌ |
| 飲食店「承認」 | `onShopReservationChanged` Firestore トリガー | 全削除 → 再生成 | ✅ |
| 飲食店「却下」 | `onShopReservationChanged` Firestore トリガー | 全削除 → 再生成 | ✅ |
| 主催者「イベントコピー」 | `eventCopy` Callable | 新規イベントに生成 | ✅ |
| 主催者「イベント繰り返しコピー」 | `eventCopyRepeat` Callable | 新規イベントに生成 | ✅ |

### 1.2 イベントページの画像表示パス（`getEventMenuImageStoragePath(event, menuId)`）

| `event_status.value` | 表示パス | 実体 |
| :-- | :-- | :-- |
| `in_draft` | `partners/{partnerId}/menus/{menuId}/image` | PartnerMenu の画像 |
| `applying_reservation` | `partners/{partnerId}/menus/{menuId}/image` | PartnerMenu の画像 |
| `applying_to_admin` | `partners/{partnerId}/menus/{menuId}/image` | PartnerMenu の画像 |
| `accepting_order`（および派生の `order_closed` / `full` / `finished`） | `communities/{communityId}/events/{eventId}/menus/{menuId}/image` | EventMenu の画像 |
| `event_canceled` | `partners/{partnerId}/menus/{menuId}/image` | PartnerMenu の画像 |

### 1.3 関連ファイル

- `functions/default/src/eventMenusSnapshot.ts` — `savePartnerMenusToEventMenus` / `onShopReservationChanged`
- `functions/default/src/eventMenusSelection.ts` — `updateEventMenus`
- `functions/default/src/eventCopy.ts` — `copyEventCore` / `eventCopy`
- `functions/default/src/eventCopyRepeat.ts` — `eventCopyRepeat`
- `common/src/utils/storagePaths.ts` — `getEventMenuImageStoragePath` の overload
- `common/src/utils/eventMenuConverter.ts` — `convertPartnerMenusToEventMenus` / `updateEventMenusIsSelected` / `shouldRegenerateFromPartnerMenus` / `shouldUpdateExistingMenusOnly`
- 表示利用箇所
  - `base/src/components/EventMenuImage.vue`（画像表示 + 404 フォールバック）
  - `base/src/components/EventMenuList.vue`
  - `base/src/components/EventCartDialog.vue`
  - `base/src/components/eventcreate/EventMenu.vue`
  - `functions/default/src/stripe.ts`

---

## 2. 課題

1. **「Firestore はスナップショット、Storage 画像は PartnerMenu 直参照」の二重基準**
   - EventMenu レコードは PartnerMenu からスナップショットコピーされているのに、画像だけ PartnerMenu パスを直参照しているのは整合性がない。
   - PartnerMenu 側の画像差し替えが、下書きイベントには即時反映されるが承認後は反映されない（=ステータス境界で挙動が変わる）。

2. **イベントコピー / 繰り返しコピー時の画像コピーが仕様矛盾**
   - 生成されるイベントは `in_draft`。現仕様だと表示は PartnerMenu パスを見るため、コピーされた EventMenu 画像は誰も参照しない。
   - 無駄な Storage I/O とゴミファイルの発生源になっている。

3. **承認時のコピー処理の孤児ファイル**
   - `savePartnerMenusToEventMenus` は既存 EventMenu の Firestore レコードを削除するが、Storage 画像は削除しない。
   - イベントコピー由来の画像や、店舗変更前の画像が Storage に残り、`bucket.file(src).copy(dest)` は dest を上書きするものの、**店舗変更で `menu_id` 自体が変わる**ケースでは古い画像が孤児となり、新画像が PartnerMenu 側にコピー元として存在しない場合は新パスに何も置かれず 404 となる。

4. **失敗を握りつぶしている**
   - `Promise.allSettled` + `try/catch` でコピー失敗をログに出すのみ。コピー元が存在しないケースなどでも EventMenu レコード生成は成功するため、画像だけ抜け落ちた状態が表面化しにくい。

---

## 3. 対応方針

### 方針 A: EventMenu レコードと Storage 画像を常に 1:1 で同期する

- 不変条件: **EventMenu のサブコレクションにドキュメントが存在するなら、対応する Storage パス（`communities/{communityId}/events/{eventId}/menus/{menuId}/image`）にも画像が存在する**。
- 例外: PartnerMenu 側に画像がそもそもアップロードされていない場合は、EventMenu Storage パスにも画像が無い。フロントは 404 を許容する（現状と同じ挙動）。

### 方針 B: 下書きでも EventMenu 画像を見るように表示パスを一本化

- `getEventMenuImageStoragePath(event, menuId)` の 2 引数版に存在する `event_status.value === 'accepting_order'` 分岐を撤廃し、**ステータスに関わらず常に `communities/{communityId}/events/{eventId}/menus/{menuId}/image` を返す**。
- PartnerMenu パスへのフォールバックは行わない。
- これにより、`#1872` で導入したスナップショット固定の思想がステータスを問わず一貫する。

### 方針 C: `updateEventMenus` の再生成分岐でも Storage 画像をコピーする

- `shouldRegenerateFromPartnerMenus` 分岐（`in_draft` / `applying_reservation`）で `savePartnerMenusToEventMenus` を呼び出すように変更。
- `shouldUpdateExistingMenusOnly` 分岐（`accepting_order`）は現状維持（`is_selected` のみ更新、Storage は触らない）。

### 方針 D: イベントコピー時の画像コピーは現状維持

- `eventCopy` / `eventCopyRepeat` でも EventMenu 画像が必要になる（方針 B により下書きでも EventMenu パスを参照するため）。
- 既存の `copyEventCore` → `savePartnerMenusToEventMenus` の呼び出しはそのまま。

### 方針 E: 再生成時は古い Storage 画像を全削除してから新規コピー

- `savePartnerMenusToEventMenus` の冒頭で、`communities/{communityId}/events/{eventId}/menus/` 配下のオブジェクトを `bucket.deleteFiles({ prefix })` で**全削除**してから、PartnerMenu の画像をコピーする。
- これにより、店舗変更などで `menu_id` が変わっても孤児ファイルが残らない。
- prefix の組み立てミスで他パスを巻き込まないよう、`common/src/utils/storagePaths.ts` に **`getEventMenuImagesPrefix(communityId, eventId)` を新設**して利用する（末尾スラッシュ込みで返す）。

### 方針 F: コピー対象を EventMenu レコードと一致させる

- 現状は `partnerMenus.filter((m) => !m.is_deleted)` で全 PartnerMenu の画像をコピーしているが、`convertPartnerMenusToEventMenus` 側では `is_sold_out` や期間外メニューを除外している。
- 不変条件「EventMenu レコード = Storage 画像 1:1」を厳密に守るため、**`convertPartnerMenusToEventMenus` が返した `eventMenusToSave` の `menu_id` だけを画像コピー対象**にする。

### 方針 G: 失敗ログの強化

- `Promise.allSettled` の rejected を集計し、`logger.warn` で件数と `menu_id` を必ず残す。
- コピー元 `partners/{partnerId}/menus/{menuId}/image` が存在しないケースは `logger.info` レベルで「PartnerMenu image not found」として区別する（運用上、画像未登録のメニューは正常ケース）。

---

## 4. 実装ステップ

> 実装順は下から上に依存している。原則この順で進める。

### Step 1: `common/src/utils/storagePaths.ts`

- `getEventMenuImagesPrefix(communityId: string, eventId: string): string` を新設。
  - 戻り値: `` `communities/${communityId}/events/${eventId}/menus/` ``（末尾スラッシュ付き）
- `getEventMenuImageStoragePath` の 2 引数 overload を**撤廃**し、3 引数版のみにする。
  - 既存の 2 引数 overload 呼び出し箇所（`base/src/components/EventMenuList.vue`、`EventCartDialog.vue`、`eventcreate/EventMenu.vue`）は、`event.community_id` / `event.event_id` / `menuId` を渡す形に書き換える。

### Step 2: `functions/default/src/eventMenusSnapshot.ts`

`savePartnerMenusToEventMenus` を以下の流れに変更する。

1. **トランザクション外**で実行:
   1. `bucket.deleteFiles({ prefix: getEventMenuImagesPrefix(communityId, eventId) })` で **既存 EventMenu Storage 画像を全削除**。
   2. PartnerMenu を取得し、`convertPartnerMenusToEventMenus` で `eventMenusToSave` を先に算出。
   3. `eventMenusToSave` の `menu_id` についてのみ `bucket.file(src).copy(dest)` を実行。
   4. コピーは `Promise.allSettled` で受ける。src 不在は info のみで続行。copy が rejected の場合は failed menu_id を error ログに出して throw し、Firestore 再生成は行わない（呼び出し元のリトライで回復）。
2. **トランザクション内**で実行（現状どおり）:
   1. 既存 EventMenu レコードを全削除。
   2. `eventMenusToSave` を保存。

`onShopReservationChanged` の本体は変更不要。

### Step 3: `functions/default/src/eventMenusSelection.ts`

`updateEventMenus` の `shouldRegenerateFromPartnerMenus` 分岐を、`savePartnerMenusToEventMenus` の呼び出しに**置き換える**。

- 既存のトランザクション内 Firestore 操作は `savePartnerMenusToEventMenus` に集約される。
- `shouldUpdateExistingMenusOnly` 分岐（`accepting_order`）は現状維持。

### Step 4: `functions/default/src/eventCopy.ts` / `eventCopyRepeat.ts`

- 変更なし。既存の `savePartnerMenusToEventMenus` 呼び出しが、新仕様（孤児削除 → コピー）として正しく機能する。
- 新規イベント側では `getEventMenuImagesPrefix` 配下が 0 件なので、削除は no-op。

### Step 5: `base/src/components/EventMenuImage.vue` の新設

共通コンポーネントとして `<v-img>` をラップし、EventMenu パスを初期表示とし、404 時に PartnerMenu パスへフォールバックする。

- props: `event`, `menu`, `alt?`, `cover?`, `aspectRatio?`
- `event.event_id` / `menu.menu_id` の変化を `watch` し、`src` を再計算してフォールバック状態をリセット
- `defineOptions({ inheritAttrs: false })` で `$attrs` を `<v-img>` にフォワード（`class` 等）
- 撤去判断は 7.6 参照。コンポーネント先頭コメントに TODO を明示

### Step 6: フロント呼び出しを `<EventMenuImage>` に置換

Step 1 の overload 撤廃に伴い、以下の `<v-img>` を `<EventMenuImage :event="..." :menu="..." />` に置換する。

- `base/src/components/EventMenuList.vue`
- `base/src/components/EventCartDialog.vue`
- `base/src/components/eventcreate/EventMenu.vue`

既存の `getMenuImageURL` ヘルパや `convertStoragePathToURL(getEventMenuImageStoragePath(event, ...))` の直接呼び出しは削除する。

### Step 7: ドキュメント整備

- 本ドキュメントを最終化。
- `documents/02_主催者獲得と継続/10_イベント作成時のメニュー選択機能.md` の「メニュー画像の参照先」「メニュー保存時の挙動」の節を更新（PartnerMenu パス参照の記述を削除、EventMenu パスに一本化したことを明記。フロント側フォールバックの暫定実装にも触れる）。
- `documents/03_参加者獲得/12_イベントページのメニュー表示.md` の表示パスの記述を更新。

---

## 5. 移行方針（既存イベントの扱い）

### 採用方針: フロント側の遅延フォールバックで対応（案 1）

- 新仕様デプロイ時点で、既存の `in_draft` / `applying_reservation` イベントは Storage に EventMenu 画像が存在しないため、表示パスを EventMenu パスに一本化すると主催者の編集画面で画像が一斉に 404 になる。
- これを防ぐため、Step 6 の通り **フロント側で「EventMenu パスが 404 → PartnerMenu パスにフォールバック」** を入れる。
- バックフィル Function は実装しない。代わりに、以下のいずれかの操作が行われた時点で EventMenu Storage 画像が用意され、フォールバックなしで表示されるようになる（=自然移行）。
  - 主催者がメニュー保存 → `updateEventMenus` 経由で `savePartnerMenusToEventMenus` が走る
  - 飲食店が予約承認 / 却下 → `onShopReservationChanged` 経由で同上
  - 主催者がイベントをコピー → `eventCopy` / `eventCopyRepeat` 経由で同上
- すでに `accepting_order` まで進んでいるイベントは現仕様で Storage 画像が存在するため、新仕様デプロイで挙動は変わらない（フォールバックも発火しない）。

### バックフィル Function を実装しない理由

- 影響範囲（下書きイベント）は参加者にほぼ閲覧されない。
- 主催者がメニュー保存・承認・コピーのいずれかを行えば、自動で正常化する。
- フォールバック実装があれば、移行期間中も画像が正しく表示されるため運用上の混乱が出ない。
- バックフィルは実装・実行・モニタリングのコストに見合わないと判断する。

### フォールバック許容のスコープ

- フォールバックは「EventMenu パスに画像が無い」全ケースで発火するため、`#1872` のスナップショット固定の思想が一部緩む。
- 具体的には、`accepting_order` 後に `onShopReservationChanged` のコピーが失敗していた場合や、PartnerMenu 側に画像が無い場合にも PartnerMenu 表示にフォールバックする。
- これは新仕様デプロイ後の運用上「コピー失敗時の見え方の保険」としても機能する。
- 長期的にはフォールバックを撤去する想定だが、撤去判断は 7.6 を参照。

---

## 6. テスト観点

- **新規 in_draft 作成 → メニュー保存**: PartnerMenu 画像が EventMenu Storage パスにコピーされる。
- **PartnerMenu に画像が無いメニュー**: コピーは rejected ではなく info ログのみ。EventMenu レコードは生成される。
- **Storage copy が rejected**: Firestore 再生成は行わずエラーで中断。メニュー保存や承認フローを再実行すると孤児削除から再コピーされる。
- **店舗 A → B に変更 → メニュー保存**: A 由来の EventMenu Storage 画像が全削除され、B 由来の画像のみ残る。
- **`applying_reservation → accepting_order` 承認**: 既存 EventMenu Storage 画像が削除 → PartnerMenu の最新画像が再コピーされる。
- **`applying_reservation → in_draft` 却下**: 同上（フロー上はあまり画像差し替えは起きないが、挙動として等価）。
- **イベントコピー**: 新イベント側で Storage が空状態から PartnerMenu 画像がコピーされる。
- **イベント繰り返しコピー（最大 12 件）**: 並列実行で各イベントの Storage に正しくコピーされる。
- **`accepting_order` 中の主催者メニュー保存**: `is_selected` のみ更新され、Storage は触らない（既存挙動と同じ）。
- **PartnerMenu 側の画像差し替え後、下書き状態のイベントを表示**: 主催者がメニュー保存し直すまでは古い画像が表示される（=スナップショット固定の意図通り。フォールバックで PartnerMenu の新画像を見せない）。
- **既存の `in_draft` イベントを新仕様デプロイ直後に開く**: EventMenu パスは 404 → `@error` ハンドラで PartnerMenu パスに切り替わり、PartnerMenu 画像が表示される。
- **`partner_id` が空の下書きを開く**: EventMenu パス・PartnerMenu パスのどちらも構築不可 → フォールバックも発火せず、Vuetify 標準のプレースホルダが表示される。
- **`useEventMenuImageUrl` の再描画**: `menu_id` が変わったときに `src` も再計算され、フォールバック状態がリセットされる。

---

## 7. 注意点

### 7.1 Storage 操作と Firestore トランザクションの境界

- Storage 削除・コピーは**トランザクション外**で実行する（現状の `savePartnerMenusToEventMenus` と同じ）。
- Firestore トランザクションが失敗してリトライされた場合、Storage 操作が二重に走り得る。Storage 削除・コピーは idempotent（削除は no-op、コピーは上書き）なので破壊はしないが、無駄な I/O は発生する。
- Firestore トランザクションだけが最終的に失敗した場合、Storage は新画像、Firestore は古い EventMenu のままになる。
  - 不変条件「EventMenu レコードがあるなら Storage に画像がある」は保たれる（一時的に Storage 側が先行するだけ）。
  - 次回スナップショット時に「孤児削除 → 再コピー」されるため自然回復する。

### 7.2 `accepting_order` 中の `shouldUpdateExistingMenusOnly` 分岐

- 本リファクタリングでは触らない。
- `accepting_order` 中に Storage を触ると参加者向けの画像が一瞬消える事故が起きるため、固定する。
- `accepting_order` 後に PartnerMenu 側で画像が差し替えられても EventMenu Storage 画像は古いまま（=スナップショット固定の意図通り）。

### 7.3 `prefix` 指定ミスの予防

- `bucket.deleteFiles({ prefix })` は prefix が誤ると他パスを巻き込むため、必ず `getEventMenuImagesPrefix(communityId, eventId)` を介して取得する。
- 末尾スラッシュを必ず付ける（`menus/` と `menus_xxx` を区別するため）。

### 7.4 ブラウザキャッシュ

- `convertStoragePathToURL` は token を含まない URL（`?alt=media` のみ）を組み立てるため、同じ `menu_id` の画像が差し替えられた場合にブラウザキャッシュで古い画像が表示される可能性がある。
- 必要性が顕在化したタイミングで、`?t={updated_at}` 形式のキャッシュバスター付与を別途検討する。本リファクタリングのスコープ外とする。

### 7.5 Functions のタイムアウト

- `updateEventMenus` Callable に Storage 削除・コピーが加わるため、メニュー数が多い場合に応答が遅くなる。
- Callable のデフォルトタイムアウト（60 秒）は通常のメニュー数（〜数十件）であれば十分。
- `eventCopyRepeat`（最大 12 件並列）はもともと 540 秒のタイムアウトを設定しているため影響は小さい。

### 7.6 フォールバックの撤去判断

- Step 6 で追加するフロント側フォールバックは、`#1872` のスナップショット固定設計を一部緩めるための**暫定実装**。撤去を前提とする。
- 撤去前提とはいえ、以下の理由で**短期間で機械的に外すべきではない**。
  - 新仕様デプロイ後に長期間放置されている既存 `in_draft` / `applying_reservation` イベントがいつ正常化されるか保証できない。
  - `onShopReservationChanged` のコピー失敗時にも安全網として機能する。
- 撤去するなら、最低でも以下が満たされたタイミングで判断する。
  - 既存 `in_draft` / `applying_reservation` イベントがほぼ存在しないことを Firestore 上で確認できる、もしくは古い下書きを運営で棚卸し・削除する運用が整っている。
  - `onShopReservationChanged` のコピー失敗ログ（方針 G）が一定期間ゼロであることを Cloud Logging で確認できる。
- 撤去時は `base/src/components/EventMenuImage.vue` を削除し、各 `.vue` を `<v-img>` + 3 引数版 `getEventMenuImageStoragePath` に戻せば良い（変更点が局所化される）。

---

## 8. 関連ドキュメント

- [02_主催者獲得と継続/10_イベント作成時のメニュー選択機能.md](../02_主催者獲得と継続/10_イベント作成時のメニュー選択機能.md): メニュー選択 UI / `updateEventMenus` Callable の仕様
- [02_主催者獲得と継続/05_イベント繰り返し作成.md](../02_主催者獲得と継続/05_イベント繰り返し作成.md): イベント繰り返しコピー
- [02_主催者獲得と継続/15_予約申請時のバリデーション.md](../02_主催者獲得と継続/15_予約申請時のバリデーション.md): `applying_reservation → accepting_order` の遷移
- [03_参加者獲得/12_イベントページのメニュー表示.md](../03_参加者獲得/12_イベントページのメニュー表示.md): 参加者向け表示の仕様
- 関連 PR / Issue:
  - `#1872`（`shop_image_url` / `menu_image_url` 削除と Storage パス直参照への移行）
  - `#1888`（イベント生成 & コピー時のメニュー画像 Storage コピー導入）
  - `#1692`（イベント繰り返し作成）
