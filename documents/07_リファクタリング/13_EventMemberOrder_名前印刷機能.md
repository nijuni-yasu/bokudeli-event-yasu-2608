# EventMemberOrder に伴う名前印刷機能（legacy → default 移行）

## 1. 概要

- **目的**: 管理画面の「[お名前]をダウンロード」で生成する名札 PDF を、**EventMemberOrder（`member_orders`）** のデータモデルに対応させる。
- **移行**: **`functions/legacy` の `namesprint` を廃止（またはデプロイ対象から除外）し、`functions/default` に実装を移す**。
- **関連**: データ構造の背景は [07_EventMemberOrderに伴う既存機能の修正.md](./07_EventMemberOrderに伴う既存機能の修正.md) を参照。

## 2. 現状（As-Is）

| 項目 | 内容 |
|------|------|
| 実装 | `functions/legacy/src/namesprint.js` |
| PDF 生成 | `functions/legacy/src/utils/makePdf.js`（`@adobe/pdfservices-node-sdk` 旧系）、テンプレートは **`functions/legacy/template/namesPrint.docx`**（`makePdf` 呼び出しは作業ディレクトリ相対の `template/namesPrint.docx`） |
| 注文取得 | `event.ref.collection('orders').where('status', '==', 'ordered')` |
| 注文の展開 | `order.menus[]` と `menu.count` で「1 メニュー × 個数」分の行を生成 |
| ユーザー取得 | `users` コレクションを `user_id` in（30 件ずつ）で取得 |
| デフォルト画像 | `functions/legacy/src/assets/default_profile.jpeg` / `blank_profile.jpeg` |
| 認証 | `Authorization: JWT <Firebase ID トークン>` |
| クライアント | `base/src/utils/namesPrint.ts` が `.../namesprint/${eventId}` に GET |

**問題**: リファクタ後の注文は **`communities/.../events/.../members/{userId}/member_orders`** に保存される。旧 **`events/{eventId}/orders`** だけを読むと **データが空**になり、Adobe Document Merge がプレースホルダを置換できず **`{{d.name1}}` 等が PDF にそのまま出力される**事象が起きる。また **1 ドキュメント = 1 メニュー**のため、`menus` 配列前提のロジックはそのままでは成立しない。

## 3. あるべき姿（To-Be）

| 項目 | 内容 |
|------|------|
| 実装場所 | `functions/default`（例: `src/namesPrint.ts` など、命名は既存に合わせる） |
| PDF 生成 | 既存の **`PdfGenerator`**（`functions/default/src/utils/PdfGenerator.ts`）の **`executeDocumentMergeForStream`** を利用 |
| テンプレート | **`functions/legacy/template/namesPrint.docx` をそのまま流用**し、**`functions/default/templates/namesPrint.docx`** として配置する（`eventBillInvoice.docx` 等と同様の配置ルール）。Adobe のプレースホルダと JSON の突き合わせは実装・デプロイ後に確認する |
| デフォルト画像 | **`functions/legacy/src/assets`** の **`default_profile.jpeg`** / **`blank_profile.jpeg`** を default に移す。配置先は **`functions/default/assets/namesPrint/`**（例。`templates` と同様 **`src` の外**に置き、`firebase.json` の default functions で `src` が ignore されてもデプロイに含まれるようにする）。実装では `path.join` で関数パッケージルートから解決する |
| Secrets | `PDF_SERVICES_CLIENT_ID` / `PDF_SERVICES_CLIENT_SECRET`（他の PDF 生成と共通） |
| 注文取得 | **`getEvent(eventId)` で `ShokujiiEvent` を取得したうえで `event.getOrders('ordered', transaction?)` を呼ぶ**（`functions/default/src/stores/event.ts` の `ShokujiiEvent`）。内部で `community_id` / `event_id` が `memberOrder` store に渡され、`status === 'ordered'` の **`EventMemberOrder[]`** が返る。`getOrders(communityId, eventId, ...)` を直接呼ぶ場合も **`communityId` は `event.community_id` から導出する**（`getOrders` は `communityId` が必須のため） |
| 行の意味 | **1 ドキュメント = 名札 1 行**（オーダー詳細の 1 行に相当）。参加者は **`EventMemberOrder.user_id`** で紐づける。同一メニューのドキュメントが複数あれば、その分だけ行が増える |
| 並び順 | **パートナー向けオーダー詳細画面（例: `/order/{eventId}`）の注文テーブルと同一**にする。実装参照: `admin/src/pages/order/[eventId].vue` の `confirmedOrders` に対する **`sort`**。**メニュー名（`menu_name`）でまとまるように並べる**仕様: まず **`menu_name` の文字列比較で昇順**、同一メニュー内は **`ordered_at` 昇順**（`ordered_at` が無い場合は `0` 扱い）。※小計テーブルで `menu_id` ごとに件数をまとめる `getSubtotalsOfOrders` は別用途；**名札の行順は明細テーブル行と同じソート**とする |
| ユーザー・画像 | ユーザー名・画像 URL の取得方針は現状と同様。画像のリサイズ・`gs://` / `https://` 取得は legacy の処理を TypeScript 化して移植。**DB 読み取りは store 経由**（プロジェクトルール）。**注意**: `functions/default/src/stores/user.ts` には **`where('user_id', 'in', chunk)` による一括取得関数がない**。旧実装と同等にするには **`getUsersByUserIds` のような store 関数の新設**、または **`getUser` をユーザー ID ごとに呼ぶ**（N+1）かを実装時に決める |

## 4. データフロー（概念）

1. リクエストから `eventId` を取得する。
2. **`getEvent(eventId)`**（`stores/event.ts`）で **`ShokujiiEvent` を取得**する。見つからなければ 404。
3. **`event.getOrders('ordered')`**（必要なら `transaction` を渡す）で **`EventMemberOrder[]`** を取得する。各ドキュメントは **`user_id`・`menu_name`・`ordered_at` 等**を持つ。
4. **セクション 3 の並び順**（オーダー詳細と同じ `sort`）で並べ替えたうえで、各 `EventMemberOrder` を 1 行として扱う。
5. **`user_id` の重複排除集合**をチャンク化（30 件ずつ）し、**store 経由で `users` を取得**して表示名・画像 URL を解決（一括取得 store の有無に依存）。
6. 4 名分を 1 グループにまとめた **`{ d: [ { name1, menu1, photo1, ... }, ... ] }`** 形式（現行ロジックと同じ形）を Adobe 用 JSON に渡す。
7. **`PdfGenerator`** で PDF をストリーム出力。

## 5. HTTP 関数仕様

- **URL**: 既存クライアント互換のため、デプロイ後の関数名を **`namesprint`** のままにする（`base/src/utils/namesPrint.ts` の URL を変えない）。その場合、**legacy 側の同名関数をデプロイ対象から外す**必要がある。
- **メソッド**: `GET`（現状踏襲）。
- **パス**: `eventId` をパスから取得（`functions/default/src/eventBillInvoice.ts` と同様の `req.path.split('/')` パターン）。
- **認証**: `Authorization: JWT <idToken>`（現状踏襲）。
- **認可**: **案 A で確定** — **JWT の正当性のみ**（Firebase ID トークンの検証）。**`partner_id` との照合やロールチェックは行わない**（legacy と同じ前提）。※クライアント側では `admin/src/pages/order/[eventId].vue` で `event.partner_id` を確認しているが、HTTP 関数側では追加しない。
- **CORS**: legacy は `defineList('CORS')`、default の他 HTTP では `process.env.CORS` を JSON パースしている例がある。**どちらに揃えるか**はデプロイ環境と合わせて決定。
- **リソース**: 画像処理と Adobe API があるため **timeout 延長**・**メモリ増**（legacy は `1GiB`）を検討。

## 6. Word テンプレートとマージ JSON

- テンプレートファイルは **`functions/legacy/template/namesPrint.docx`** を流用し、**`functions/default/templates/namesPrint.docx`** に置く。
- 現行コードは **`d` を「1 行（最大 4 名分）」のオブジェクトの配列**として渡している。
- PDF に **`{{d.name1}}` が字面のまま残る**原因は、(1) **マージ用データが空**、(2) **テンプレートのタグと JSON のパスが Adobe Document Merge の解釈と一致していない** の両方があり得る。
- **受け入れ条件**に「サンドボックス等で実 PDF を開き、名前・メニュー・画像が埋まること」を含める。必要なら **テンプレートのプレースホルダ表記を Adobe の推奨に合わせて修正**する。

## 7. 移行・デプロイ手順（案）

1. **`functions/legacy/template/namesPrint.docx`** を **`functions/default/templates/namesPrint.docx`** にコピーする。
2. **`functions/legacy/src/assets/default_profile.jpeg`** / **`blank_profile.jpeg`** を **`functions/default/assets/namesPrint/`**（など `src` 外の固定パス）にコピーする。ビルドで `dist` にコピーする場合は `package.json` の `build` を調整する。
3. `functions/default` に実装・`index.ts` から export。
4. シークレット・リージョン・CORS を既存 PDF 系と揃えてデプロイ。
5. 管理画面から名前 PDF を取得し、表示を確認。**並び順がオーダー詳細の明細テーブルと一致する**ことも確認する。
6. 問題なければ **`functions/legacy` から `namesprint` を削除**、または `firebase.json` / デプロイ CI で legacy の当該関数のみ除外。
7. [01_legacy_to_default移行.md](./01_legacy_to_default移行.md) 等の一覧表を更新。

## 8. テスト観点

- **`member_orders` のみ**のイベントで、名前・メニュー・画像が期待どおり埋まる。
- **並び順**が **`admin/src/pages/order/[eventId].vue` の明細テーブル**（`menu_name` 昇順 → 同一メニュー内 `ordered_at` 昇順）と一致する。
- **注文 0 件**のとき（空の `d`、エラー、メッセージ）の仕様を決めておく。
- 画像: `https` / `gs://` / 取得失敗時のフォールバック（**移設した default / blank 画像**）。
- **`users` の in クエリ**は 30 件チャンクのまま正しく動く（一括取得 store を追加する場合）。
- **`ordered_at` が欠損したドキュメント**が混ざる場合のソート結果（`0` 扱い）。
- **匿名化済みユーザー**（`is_deleted: true`、表示名が `'-'` 等）が含まれるイベントでの表示が許容か。
- **`user_image_url` が空**のユーザー（スキーマ上は `nullable` → 空文字に正規化）でのデフォルト画像表示。
- パフォーマンス: 注文数・ユーザー数が多いイベントでのタイムアウト。

## 9. 未決事項チェックリスト

- [ ] 移行期間中、旧 **`events/{eventId}/orders`** も読むか（二重読み・マージ方針）。
- [ ] **`users` 一括取得**: store に **`getUsersByUserIds`（または同等）を追加するか**、`getUser` の繰り返しでよいか。
- [ ] `namesPrint.docx` のプレースホルダと JSON の最終整合（Adobe の仕様確認）。
- [ ] 画像の HTTP(S) 取得: **`functions/default` に `axios` を増やさず**、**グローバル `fetch`** および **`firebase-admin` の Storage（`gs://`）** で統一する方針を推奨（依存を増やさない）。
- [ ] 関数名・URL を **完全に変える場合**は `base/src/utils/namesPrint.ts` とデプロイドキュメントを更新。

## 10. 参考ファイル一覧

| パス | 用途 |
|------|------|
| `functions/legacy/src/namesprint.js` | （削除済み）移行時の参照用に履歴に残す |
| `functions/default/src/namesPrint.ts` | HTTP 関数（実装） |
| `functions/default/src/utils/namesPrintPdf.ts` | 画像処理・マージ JSON（実装） |
| `functions/legacy/template/namesPrint.docx` | 名札テンプレート（流用元） |
| `functions/legacy/src/assets/default_profile.jpeg` / `blank_profile.jpeg` | デフォルト画像（流用元） |
| `functions/default/src/utils/PdfGenerator.ts` | PDF マージ（default 標準） |
| `functions/default/src/eventBillInvoice.ts` | `onRequest` + JWT + ストリーム PDF の参考 |
| `functions/default/src/stores/memberOrder.ts` | `getOrders` / `collectionGroup('member_orders')` |
| `functions/default/src/stores/event.ts` | `getEvent`、`ShokujiiEvent`、`getOrders` ラッパー |
| `functions/default/src/stores/user.ts` | `getUser`（一括取得は要検討） |
| `functions/default/src/utils/image.ts` | `sharp` によるリサイズ（既存。流用・拡張の検討） |
| `base/src/utils/namesPrint.ts` | 管理画面からの呼び出し |
| `admin/src/pages/order/[eventId].vue` | 呼び出し元 UI・**並び順（`confirmedOrders` の `sort`）の参照** |
| `base/src/utils/orders.ts` | `getSubtotalsOfOrders`（小計のまとめ。名札の行順は明細テーブル側の sort に合わせる） |
| `common/src/schemas/EventMemberOrder.ts` | スキーマ（`user_id`、`menu_name`、`ordered_at` 等） |
