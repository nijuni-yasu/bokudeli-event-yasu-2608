# ブランチ dev/enterprise-mvp-v3 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 3637896931 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | 同一 logo URL 上書き時にヘッダー img が更新されない<br>`logoRenderGeneration` + cache-bust クエリで src を毎 resolve 変化 |
| [x] | RC-2 | 3637896937 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | login_bg.png が 4.7MB で初回ログインが重い<br>1.1MB に圧縮済み（#2213 amend） |
| [x] | RC-3 | 3637896939 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | vertical-nav-header スロット差替えでモバイル閉じるボタン欠落<br>`closeVerticalOverlayNav` + `d-lg-none` close ボタン復元 |
| [x] | RC-4 | 3637896943 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | Phase2 計画の H-2/H-1/H-9 が未完了のまま<br>実装・closes と揃え `[x]` に更新 |
| [x] | RC-5 | 3637896952 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 🔒 セキュリティ | 📄 ドキュメントのみ | S | Storage Rules の「子 match 優先」誤記<br>「いずれか allow が許可すれば read 可」に修正 |
| [x] | RC-6 | なし・エージェントレビュー | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | orders.vue の canLinkToDetail が isPublic のみ参照<br>非公開イベントで本人の詳細リンクが消える → isOwner 相当に修正 |
| [x] | RC-7 | 3643243986 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ, 👤 UX | 🔧 微修正 | S | user /orders が isLoginRequired 外<br>未ログイン直叩きで空画面 → /orders をログイン必須に追加 |
| [x] | RC-8 | 3650196173 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | orders.vue の canLinkToDetail が isPublic \|\| true で常に true<br>`isLinkable ?? true` に簡約 |
| [x] | RC-9 | 3650196180 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🏗️ 設計 | 🔧 微修正 | S | base orders.vue が @/router/utils に依存<br>resolveEventPath / resolveReceiptPath を props 注入 |
| [x] | RC-10 | 3650196186 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | shokujii-code-review の「既存のみ」注記が orders 新規追加と矛盾<br>#2208 例外として表現修正 |
| [x] | RC-11 | 3651873400 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | downloadReceipt の window.open に noopener,noreferrer 未指定 |
| [x] | RC-12 | 3651873404 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | enterprise /orders の fetchEnterpriseUsageTabEligible 未 catch |
| [x] | RC-13 | 3651873409 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | legacy ?tab=usage redirect の fetch 失敗時に空白画面 |
| [x] | RC-14 | 3651873411 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | user /orders の navigateToEventChat に try/catch なし |
| [x] | RC-15 | 3651873413 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | useUserProfileTabSync の route.query スプレッドに as 使用 |
| [x] | RC-16 | 3650210089 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | base の @/router/utils 依存（RC-9 と同一指摘）<br>props 注入済み |
| [x] | RC-17 | 3650210086 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 💾 データ | 🔧 微修正 | S | Enterprise モードで useUserStore が無条件 subscribe<br>autoSubscribe: false で preview 前 Firestore 直読を防止 |
| [x] | RC-18 | 3650210088 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | members/managers 条件に converter なし doc()<br>getUserRef に統一 |
| [x] | RC-19 | 3651896167 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 👤 UX | 🔧 微修正 | S | Checkout 直後 loginUser 未確定で完了ダイアログ表示<br>firebaseUser.uid 確定後に v-if |
| [ ] | RC-20 | 3650210091 | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 📑 仕様書, 🔒 セキュリティ | 📋 仕様追加 | M | /orders が enterpriseId のみでマウント<br>停止メンバーでも注文履歴・キャンセル可能 |
| [ ] | RC-21 | 3650210092 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📑 仕様書 | 🔧 微修正 | S | eligible=false 時 URL が ?tab=usage のまま<br>§4.2.9 に従い router.replace で正規化 |
| [x] | RC-22 | 3649670521 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | 旧 usage URL 失敗時フォールバック（RC-13 と同一）<br>.catch で /orders へ replace 済み |
| [x] | RC-23 | 3650210093 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 旧 usage 非同期 redirect が route 変更後も発火<br>requestPath 一致確認を追加 |
| [ ] | RC-24 | 3649670518 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | logoRenderGeneration が再読込で 0 リセット<br>永続 cache-bust 値（更新日時等）が必要 |
| [ ] | RC-25 | 3650210094 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | RC-24 と同一（再読込後 v=1 再利用）<br>サーバー側更新世代の導入が必要 |
| [ ] | RC-26 | 3651880394 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | RC-24/25 と同一（セッション跨ぎ cache キー）<br>永続値への置換が必要 |
| [x] | RC-27 | 3651880391 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | useNavigateToEventChat 再利用提案<br>RC-14 で try/catch 済み。composable 化は任意 |

---

## 評価セッション（2026-07-23 21:10・review-comments-evaluate）

- **評価日時**: 2026-07-23 21:10 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **REVIEW_REQUEST_SINCE**: 2026-07-23T11:49:02Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 0（Copilot 承知返信・レビュー依頼定型文等は別途 PR 上に存在するが since 以降の RC 対象外）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 3637896931 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | 同一 logo URL 上書き時にヘッダー img が更新されない<br>`logoRenderGeneration` + cache-bust クエリで src を毎 resolve 変化 |
| [x] | RC-2 | 3637896937 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | login_bg.png が 4.7MB で初回ログインが重い<br>1.1MB に圧縮済み（#2213 amend） |
| [x] | RC-3 | 3637896939 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | vertical-nav-header スロット差替えでモバイル閉じるボタン欠落<br>`closeVerticalOverlayNav` + `d-lg-none` close ボタン復元 |
| [x] | RC-4 | 3637896943 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | Phase2 計画の H-2/H-1/H-9 が未完了のまま<br>実装・closes と揃え `[x]` に更新 |
| [x] | RC-5 | 3637896952 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 🔒 セキュリティ | 📄 ドキュメントのみ | S | Storage Rules の「子 match 優先」誤記<br>「いずれか allow が許可すれば read 可」に修正 |

---

**識別子**: RC-1（GitHub id: 3637896931）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/composable/useEnterpriseBranding.ts:20`

**該当コード（レビュー時点の diff）**:

```diff
+  function syncHeaderLogo(enterprise: GetEnterpriseByDomainResponse | null): void {
+    const url = enterprise?.company_logo_url
+    const src = url != null && url !== '' ? url : defaultHeaderLogo
+    const alt = enterprise?.company_name ?? 'shokujii'
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  ロゴ更新時に src を必ず変化させてください**

既存ロゴを上書き保存するケースでは Storage パスが `enterprises/{id}/logo/company-logo.png` で固定のため、保存後に `resolveEnterprise()` しても `company_logo_url` は同じ文字列のままです。この行で同じ `src` を再代入しても Vue は DOM を更新せず、既にヘッダーに表示済みの `<img>` は再取得されないため、管理画面でロゴを変更してもヘッダーだけ古い画像が残ります。アップロード完了時刻などのバージョンをクエリに付けるか、保存直後は新しい object URL / cache-busted URL を反映してください。

**コメント要約**: 同一 Storage URL のロゴ上書き後、ヘッダー img がブラウザキャッシュのまま更新されない。resolve 毎に変化する cache-bust 付き URL が必要。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 実害あり。`logoRenderGeneration` を `resolveEnterprise` 成功毎に increment し、`withEnterpriseLogoCacheBust` で HTTP(S) URL に `?v=` を付与。ヘッダー・ログイン双方の composable に適用。

---

**識別子**: RC-2（GitHub id: 3637896937）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/components/login/LoginBackgroundLayout.vue:2`

**該当コード（レビュー時点の diff）**:

```diff
+import loginBg from '@/assets/images/login/login_bg.png'
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  ログイン背景画像を軽量化してください**

未ログインユーザーが login / pass-code に初回アクセスするたび、この PNG 背景（ローカルで 4,773,289 bytes）を背景画像として読み込むため、モバイル回線やキャッシュ未保持時にログインフォーム表示までの体感速度が大きく悪化します。写真系の背景なら WebP/JPEG への変換や複数サイズ化で大幅に削減できるので、ログイン導線に載せる前に軽量版を参照してください。

**コメント要約**: login_bg.png が約 4.7MB で PWA バンドル・初回表示が重い。圧縮または WebP 等への変換が必要。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。#2213 コミット amend で 1,153,636 bytes（約 1.1MB）に圧縮済み。Workbox 2MiB 制限内に収まり sandbox デプロイも成功。

---

**識別子**: RC-3（GitHub id: 3637896939）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/components/layouts/DefaultLayoutWithVerticalNav.vue:33`

**該当コード（レビュー時点の diff）**:

```diff
+    <template #vertical-nav-header>
+      <EnterpriseVerticalNavHeader />
+    </template>
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-lightgrey?style=flat)</sub></sub>  モバイル用の閉じる操作を復元してください**

この `vertical-nav-header` スロットを渡すと Materio の既定 nav header が丸ごと置き換わり、既定実装にあった `d-lg-none` の閉じるボタンも消えます。`EnterpriseVerticalNavHeader` は pin/unpin だけを再実装しているため、スマホ幅でドロワーを開いた利用者はヘッダーから閉じられず、外側タップに頼る退行になります。スロット化するなら mobile close action も同時に渡せる形で復元してください。

**コメント要約**: カスタム vertical-nav-header で Materio 既定のモバイル close ボタンが消えた。スロット差替え時に close 操作を復元すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: UX 退行の指摘は妥当。`useVerticalOverlayNavClose` で navbar スロットの toggle を登録し、`EnterpriseVerticalNavHeader` に `layoutConfig.icons.close` + `d-lg-none` を追加。

---

**識別子**: RC-4（GitHub id: 3637896943）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `documents/08_エンタープライズ/00_計画/04_Phase2機能拡張計画.md:49`

**該当コード（レビュー時点の diff）**:

```diff
-| - [ ] | H-2 | **RC-20 確定** — 未ログイン時ロゴ URL 方針（Storage 公開 read / signed URL） |
-| - [ ] | H-1 | ヘッダー常時表示に `company_logo_url` を反映 |
-| - [ ] | H-9 | login / pass-code を背景画像 + 中央 v-card レイアウト化 |
+| - [x] | H-2 | ...
+| - [x] | H-1 | ...
+| - [x] | H-9 | ...
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-lightgrey?style=flat)</sub></sub>  WS-H の完了状態を実装内容と揃えてください**

この新規計画書では H-2/H-1/H-9 が未完了のままですが、この同じ変更で未ログイン時ロゴ URL 方針、ヘッダーロゴ反映、login/pass-code レイアウト刷新を追加し、コミットも #2205/#2206/#2213 を closes しています。進捗表を参照する後続作業者が完了済みタスクを再着手対象と誤認するので、完了済みなら ✅ に揃え、未完了なら実装/close 側を分けてください。

**コメント要約**: Phase2 計画表の WS-H タスク（H-2/H-1/H-9）が実装・Issue closes と不一致。完了済みならチェックを付けるべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 指摘妥当。本 PR で実装・closes 済みの 3 タスクを `- [x]` に更新。

---

**識別子**: RC-5（GitHub id: 3637896952）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `documents/08_エンタープライズ/10_仕様/02_アーキテクチャ.md:833`

**該当コード（レビュー時点の diff）**:

```diff
-// より具体的な match が親 match /enterprises/{enterpriseId}/{allPaths=**} より優先される
+// 同一パスに複数 match が一致した場合、いずれかの allow が許可すれば read 可（logo 側の `allow read: if true` が未認証 read を許可）
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-lightgrey?style=flat)</sub></sub>  Storage Rules の一致判定を正しく記述してください**

Firebase Storage Rules は「より具体的な match が親より優先」されるのではなく、同じパスに一致した `allow` のいずれかが許可すればアクセス可になります。この説明のままだと、将来 `/enterprises/{enterpriseId}/{allPaths=**}` 側の条件を変更した時に子 match が親を上書きすると誤解して、公開 read / tenant 限定 read の境界を誤設計するリスクがあります。ここは優先順位ではなく「両方一致し、ロゴ側の `allow read: if true` が許可を与える」と書き換えてください。

**コメント要約**: Storage Rules の match 優先順位の説明が Firebase 仕様と異なる。OR 評価（いずれか allow が許可すれば可）に修正すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書, 🔒 セキュリティ

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 指摘妥当。誤解を招く「優先」表現を削除し、複数 match の OR 許可モデルに書き換え済み。

---

## 評価セッション（2026-07-23 22:55・shokujii-code-review）

- **評価日時**: 2026-07-23 22:55 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **対象**: H-5/H-6/H-3/H-5d 未コミット差分（`/orders` 専用画面・リダイレクト・enterprise プロフィール UI 同期・ドキュメント）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-6 | なし・エージェントレビュー | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | orders.vue の canLinkToDetail が isPublic のみ参照<br>非公開イベントで本人の詳細リンクが消える → isOwner 相当に修正 |

---

**識別子**: RC-6（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/pages/orders.vue:68`

**該当コード（レビュー時点）**:

```typescript
const canLinkToDetail = (isPublic: boolean, isLinkable?: boolean): boolean => isLinkable ?? isPublic
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `orders.vue` の `canLinkToDetail` が `isLinkable ?? isPublic` のみで、UserProfilePage の `isLinkable ?? (isOwner || isPublic)` と異なる。注文履歴は本人専用ページのため `is_linkable` 未指定かつ `is_public === false` の非公開イベントでイベント詳細リンクが表示されなくなる → `isLinkable ?? (isPublic || true)`（本人常時 true）に修正する。

**コメント要約**: 非公開イベントの注文履歴で本人向けイベント詳細リンクが欠落する regression。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: UserProfilePage から orders タブを切り出す際に isOwner 相当の分岐が落ちていた。本人専用ページとして `isLinkable ?? (isPublic || true)` に修正済み。

---

## 評価セッション（2026-07-24 15:07・review-comments-evaluate auto）

- **評価日時**: 2026-07-24 15:07 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **REVIEW_REQUEST_SINCE**: 2026-07-24T05:47:03Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 1（手順 12 の Copilot/Codex 依頼コメント）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-7 | 3643243986 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ, 👤 UX | 🔧 微修正 | S | user /orders が isLoginRequired 外<br>未ログイン直叩きで空画面 → /orders をログイン必須に追加 |

---

**識別子**: RC-7（GitHub id: 3643243986）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `user/src/pages/orders.vue:31`

**該当コード（レビュー時点の diff）**:

```diff
+<template>
+  <Orders :profile-filter="{ kind: 'pf-null' }" :navigate-to-event-chat="navigateToEventChat" />
+</template>
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  /orders をログイン必須にしてください**

user 側の新しい `/orders` は個人の注文履歴画面ですが、確認した `user/src/router/index.ts` の `isLoginRequired` は `/profile`・`/manage`・`/chat` 等だけを対象にしており、この追加ページは未認証でもそのまま表示されます。仕様上も `/orders` は「ログイン必須。PF / エンプラ共通の専用画面」（`documents/08_エンタープライズ/10_仕様/04_詳細_マイページ・友人.md:151`）なので、ログアウト状態で直接 `/orders` や決済後URLを開いた場合にログインへリダイレクトされず、空の注文履歴画面になって戻り先も保持されません。user ルーターのログイン必須判定に `/orders` を追加してください。

**コメント要約**: user 側 /orders がログインガード対象外で、未ログイン直叩き時に login へ redirect されない。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ, 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`user/src/router/index.ts` の `isLoginRequired` に `/orders` を追加。enterprise 側は `authGuards` で public 以外がログイン必須のため追加不要。

---

## 評価セッション（2026-07-25 22:05・review-comments-evaluate）

- **評価日時**: 2026-07-25 22:05 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **REVIEW_REQUEST_SINCE**: 2026-07-25T12:52:08Z
- **partial**: true（Codex 未レビューまたは limits/connect のみ）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 1（Copilot Pull request overview のみ・具体指摘なし）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-8 | 3650196173 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | canLinkToDetail の `isPublic \|\| true` を `isLinkable ?? true` に簡約 |
| [x] | RC-9 | 3650196180 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🏗️ 設計 | 🔧 微修正 | S | base orders.vue の `@/router/utils` 依存を props 注入に変更 |
| [x] | RC-10 | 3650196186 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | shokujii-code-review の orders「既存のみ」注記を #2208 例外表現に修正 |

**付記（自動修正）**: sandbox デプロイ失敗原因の `UserProfileFriendsPreviewCard.vue` の `withDefaults` ローカル変数参照も同セッションで修正（`() => true` に変更）。

---

**識別子**: RC-8（GitHub id: 3650196173）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/pages/orders.vue:70`

**レビュワーのコメント（原文）**:

[must] `canLinkToDetail` の実装が `isPublic || true` になっていて常に `true` になるため、意図が読み取りづらいです（結果として `is_linkable` 未指定時は常にリンク可、指定時のみ従う、という挙動）。意図どおりなら式を簡約して誤読余地をなくしてください。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。本人のみ閲覧のため `isLinkable ?? true` に簡約。

---

**識別子**: RC-9（GitHub id: 3650196180）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/pages/orders.vue:17`

**レビュワーのコメント（原文）**:

[must] `base` 側の共通コンポーネントで `@/router/utils` に依存すると、各 app のルーティング差分/責務分離（path resolver を props 注入する方針）から外れます。`getEventPath` / `getReceiptPath` は `profilePathResolvers.ts` の型に揃えて props で受け取り、user/enterprise の wrapper から注入する形に寄せてください。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🏗️ 設計

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`ResolveEventPathFn` / `ResolveReceiptPathFn` を追加し user/enterprise wrapper から注入。

---

**識別子**: RC-10（GitHub id: 3650196186）

**レビュワー**: Copilot

**指摘箇所**: `.agents/skills/shokujii-code-review/SKILL.md:153`

**レビュワーのコメント（原文）**:

`base/src/components/pages/orders.vue` をこの PR で新規追加しているため、「参照: … は既存のみ」という注記が事実と矛盾しています。今後のレビュー基準として誤解を招くので、表現を修正してください。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 指摘妥当。#2208 時点の例外として SKILL.md / shokujii-code-review.md を修正。

---

## 評価セッション（2026-07-26 14:52・review-comments-evaluate）

- **評価日時**: 2026-07-26 14:52 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **REVIEW_REQUEST_SINCE**: 2026-07-26T05:44:59Z
- **partial**: true（Codex 未レビュー・connect 案内のみ）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（手順 12 依頼コメント・Codex connect 案内・RC-13 と重複のトップレベルサマリ）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-11 | 3651873400 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | window.open に noopener,noreferrer を追加 |
| [x] | RC-12 | 3651873404 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | fetchEnterpriseUsageTabEligible 失敗時 showUsage=false |
| [x] | RC-13 | 3651873409 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | legacy usage redirect 失敗時 /orders へフォールバック |
| [x] | RC-14 | 3651873411 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | navigateToEventChat を try/catch 化 |
| [x] | RC-15 | 3651873413 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | route.query スプレッドを型注釈で受ける |

**付記（自動修正）**: 上記 RC-11〜15 を同一セッションでコード修正済み。

---

**識別子**: RC-11（GitHub id: 3651873400）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/pages/orders.vue:123`

**レビュワーのコメント（原文）**:

[must] `window.open(..., '_blank')` は `opener` 経由のタブ乗っ取りリスクがあるため、`noopener,noreferrer` を付けて `opener` を切ってください。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。第3引数に `noopener,noreferrer` を追加。

---

**識別子**: RC-12（GitHub id: 3651873404）

**レビュワー**: Copilot

**指摘箇所**: `enterprise/src/pages/orders.vue:28`

**レビュワーのコメント（原文）**:

[must] `fetchEnterpriseUsageTabEligible` の Promise を `catch` していないため、API 失敗時に unhandled rejection になり得ます（`showUsage` も前回値のまま残ります）。失敗時は `showUsage=false` にフォールバックしてください。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`.catch(() => { showUsage.value = false })` を追加。

---

**識別子**: RC-13（GitHub id: 3651873409）

**レビュワー**: Copilot

**指摘箇所**: `enterprise/src/pages/u/[userId].vue:31`

**レビュワーのコメント（原文）**:

[must] `fetchEnterpriseUsageTabEligible` の失敗時に `catch` していないため、unhandled rejection になり得ます。失敗時は安全側で `/orders`（usage なし）へリダイレクトしてください。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`.catch` で `getOrdersPath()` へ replace。

---

**識別子**: RC-14（GitHub id: 3651873411）

**レビュワー**: Copilot

**指摘箇所**: `user/src/pages/orders.vue:27`

**レビュワーのコメント（原文）**:

[must] `waitForEventChatMembership` / `router.push` が例外を投げると `Promise<boolean>` が reject して呼び出し側が想定外になります（エラートーストも出ません）。既存の `useNavigateToEventChat` と同様に `try/catch` で `false` を返し、失敗時メッセージを出してください。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`useNavigateToEventChat` と同様に try/catch + `chat.error.open_failed`。

---

**識別子**: RC-15（GitHub id: 3651873413）

**レビュワー**: Copilot

**指摘箇所**: `base/src/composable/useUserProfileTabSync.ts:45`

**レビュワーのコメント（原文）**:

[nits] `as` キャストは避けたいので、ここは型注釈で受けてください（`as` を残すと型安全性が下がります）。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。変数に型注釈を付け `as` を削除。

---

## 評価セッション（2026-07-29 16:19・review-comments-evaluate）

- **評価日時**: 2026-07-29 16:19 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` manual）
- **ブランチ名**: `dev/enterprise-mvp-v3`
- **PR**: [#2223](https://github.com/nijuniinc/bokudeli-event-new/pull/2223)
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 5（レビュー依頼定型文×3・Codex connect 案内×1・Copilot トップレベル RC-13 重複×1）
- **手順 4a 自動修正**: RC-17〜19・RC-23（🚨 2件 / 🟡 2件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-16 | 3650210089 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | RC-9 と同一（router utils props 注入）<br>評価時点で対応済み |
| [x] | RC-17 | 3650210086 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 💾 データ | 🔧 微修正 | S | Enterprise で useUserStore 無条件 subscribe<br>autoSubscribe: false で回避 |
| [x] | RC-18 | 3650210088 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | members/managers に getUserRef 未使用<br>withConverter 付き ref に統一 |
| [x] | RC-19 | 3651896167 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害, 👤 UX | 🔧 微修正 | S | Checkout 直後 UID 空で完了ダイアログ<br>firebaseUser.uid + v-if で待機 |
| [ ] | RC-20 | 3650210091 | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 📑 仕様書, 🔒 セキュリティ | 📋 仕様追加 | M | 停止メンバーが /orders を利用可能<br>preview ゲート後に Orders マウント |
| [ ] | RC-21 | 3650210092 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📑 仕様書 | 🔧 微修正 | S | eligible=false 時 ?tab=usage 残存<br>router.replace で /orders 正規化 |
| [x] | RC-22 | 3649670521 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | RC-13 と同一（legacy usage 失敗時）<br>.catch で /orders へ replace 済み |
| [x] | RC-23 | 3650210093 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 非同期 redirect の route 競合<br>requestPath 一致確認を追加 |
| [ ] | RC-24 | 3649670518 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | logoRenderGeneration が再読込でリセット<br>永続 cache-bust 値が必要 |
| [ ] | RC-25 | 3650210094 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | RC-24 と同一（v=1 再利用問題） |
| [ ] | RC-26 | 3651880394 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 📋 仕様追加 | M | RC-24/25 と同一（セッション跨ぎ） |
| [x] | RC-27 | 3651880391 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | useNavigateToEventChat 再利用提案<br>RC-14 で try/catch 済み |

---

**識別子**: RC-16（GitHub id: 3650210089）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `base/src/components/pages/orders.vue:16`

**該当コード（レビュー時点の diff）**:

```diff
+import { getEventPath, getReceiptPath } from '@/router/utils'
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  base から app の router util を参照しないでください**

共有 `base` コンポーネントが `@/router/utils` を import すると、`@` が利用側アプリの alias として解決され、各 consumer が `getEventPath` と `getReceiptPath` を同じ形で実装していることに依存します。base 単体や別アプリで利用した場合に解決不能または誤ったルートになるため、他の path resolver と同様に app shell から props で注入してください。

**コメント要約**: base 共有コンポーネントが `@/router/utils` に依存している。RC-9（Copilot id: 3650196180）と同一指摘で、props 注入に修正済み。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: RC-9 対応済み。`ResolveEventPathFn` / `ResolveReceiptPathFn` を props で受け取る実装に置換済み。重複指摘のため新規対応不要。

---

**識別子**: RC-17（GitHub id: 3650210086）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `base/src/composable/useUserProfileAuthState.ts:38`

**該当コード（レビュー時点の diff）**:

```diff
+  const { user, exists } = storeToRefs(useUserStore(profileUserId))
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  Enterprise モードでは user store を生成しないでください**

Enterprise の `/u/:userId` でもこの行が無条件に `useUserStore` を生成するため、`getUserProfilePreview` の認可ゲートが完了する前に公開 Firestore の `users/{uid}` へ `onSnapshot` が開始されます。`useUserStore` の購読はページ離脱時にも解除されず、閲覧した UID ごとに不要なリスナーと課金 read が蓄積するうえ、`documents/08_エンタープライズ/10_仕様/04_詳細_マイページ・友人.md:361` の「preview 成功前の Firestore 直読を防ぐ」という方針にも反します。`pf-firestore` モードのときだけ store を生成してください。

**コメント要約**: enterprise-callable-gate でも useUserStore が onSnapshot を開始し、preview 前 Firestore 直読・リスナー蓄積が発生する。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書, 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。§5.2.1 RC-44 に反する。`useUserStore` に `autoSubscribe` オプションを追加し、enterprise モードでは `autoSubscribe: false` で subscribe を抑止。

---

**識別子**: RC-18（GitHub id: 3650210088）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `base/src/composable/useUserProfileCommunityLists.ts:23`

**該当コード（レビュー時点の diff）**:

```diff
+        where('members', 'array-contains', doc(db, 'users', options.profileUserId)),
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  ユーザー参照には getUserRef を使用してください**

コミュニティの `members` 条件に converter のない `doc(db, 'users', ...)` を渡しており、同じファイルの `managers` 条件にも同じ参照が複製されています。`base/src/stores/user.ts` が array-contains 用にも `getUserRef` を使うよう明記しているため、参照生成をそちらへ統一し、DocumentReference の converter 保証を維持してください。

**コメント要約**: array-contains 用 DocumentReference が withConverter なし `doc()`。AGENTS.md の xxxRef 規約違反。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`members` / `managers` 両方を `getUserRef` に置換。

---

**識別子**: RC-19（GitHub id: 3651896167）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `base/src/components/pages/orders.vue:42`

**該当コード（レビュー時点の diff）**:

```diff
+const userId = computed(() => loginUser.value?.user_id ?? '')
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  Auth UID の確定後に決済完了ダイアログを表示してください**

Stripe Checkout からコールドリダイレクトされた場合、Firebase Auth が復元済みでも `users/{uid}` の snapshot が返るまでは `loginUser` が `null` のため、ここでは一時的に空の UID が渡されます。`UserSuccessJoinEventDialog` は空 UID の場合に注文読込中・`processing` 判定を無効化するため、PayPay などの処理中決済でも通常の完了表示やシェア誘導を先に表示し得ます。ログイン必須ルートで既に確定している `firebaseUser.uid` を使用するか、UID が非空になるまでダイアログを生成しないでください。

**コメント要約**: Checkout 直後は loginUser 未ロードで UID 空。完了ダイアログが processing 判定をスキップし誤表示しうる。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害, 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`firebaseUser.uid` をフォールバックに追加し、`userId !== ''` まで `UserSuccessJoinEventDialog` を v-if で抑止。

---

**識別子**: RC-20（GitHub id: 3650210091）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/pages/orders.vue:52`

**該当コード（レビュー時点の diff）**:

```diff
+  <Orders v-if="enterpriseId != null" :profile-filter="profileFilter" hide-share-sns>
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  /orders を有効な EnterpriseMember でゲートしてください**

Enterprise 版ではこの条件だけで注文画面をマウントするため、`disableEnterpriseMember` 後も有効期限内の ID トークンを持つ停止ユーザーが注文履歴を取得し、期限前注文のキャンセルまで実行できます。従来のプロフィール内注文タブは `getUserProfilePreview` 成功後の `isPreviewAccessGranted` を条件に `reload()` していましたが、新画面は即座に collectionGroup を読み、Rules と `cancelOrders` も本人・テナント一致のみで `is_active` を検証しません。既存の EnterpriseMember active 判定を通過するまで `<Orders>` を生成しないでください。

**コメント要約**: 停止メンバーが /orders で注文履歴取得・キャンセル可能。preview / active 判定ゲートが欠落。

**評価**: 🚨 必須修正

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書, 🔒 セキュリティ

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: 指摘妥当。§5.2.1 EP-5（is_active==false → not-found）と RC-44 の preview ゲート方針に整合させ、`getUserProfilePreview` 成功（または同等 active 判定）まで Orders をマウントしない実装が必要。セキュリティ影響ありのため自動修正対象外。

---

**識別子**: RC-21（GitHub id: 3650210092）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/pages/orders.vue:27`

**該当コード（レビュー時点の diff）**:

```diff
+    void fetchEnterpriseUsageTabEligible(uid).then((eligible) => {
+      showUsage.value = eligible
+    })
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  利用対象外では usage クエリを取り除いてください**

`/orders?tab=usage` を直接開いたユーザーが月額上限未設定の場合、この callback は `showUsage` を false にするだけなので URL が `/orders?tab=usage` のまま残ります。仕様では対象外時は `/orders` に正規化すると定義されており、現在の実装では存在しないセクションへの深リンクをブックマーク・共有できてしまいます。`eligible === false` のときは `tab` を除去する `router.replace` も行ってください。

**コメント要約**: 上限未設定時も URL が `?tab=usage` のまま。§4.2.9 の `/orders` 正規化未実装。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`documents/08_エンタープライズ/10_仕様/04_詳細_マイページ・友人.md` §4.2.9「上限未設定時は `/orders`」に従い `eligible === false` かつ `tab=usage` 時に `router.replace` が必要。📑 ラベルのため自動修正対象外。

---

**識別子**: RC-22（GitHub id: 3649670521）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/pages/u/[userId].vue:29`

**該当コード（レビュー時点の diff）**:

```diff
+    void fetchEnterpriseUsageTabEligible(uid).then((eligible) => {
+      void router.replace(getOrdersPath(eligible ? 'usage' : undefined))
+    })
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  旧利用状況URLの判定失敗時にも遷移を完了してください**

本人が旧ブックマーク `/u/:userId?tab=usage` を開いた際、Callable が一時的なネットワーク障害や Functions エラーで reject すると、この Promise には成功ハンドラしかないため遷移が実行されません。一方で関数は直後に `true` を返して `shouldShowProfile` を `false` にするので、利用者は旧 URL 上の空白画面に取り残され、未処理の Promise rejection も発生します。失敗時は `/orders` へフォールバックするかプロフィール表示を復元してください。

**コメント要約**: RC-13（Copilot id: 3651873409）と同一。legacy usage redirect の fetch 失敗時フォールバック。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: RC-13 対応済み。`.catch(() => router.replace(getOrdersPath()))` が評価時点のコードに存在。

---

**識別子**: RC-23（GitHub id: 3650210093）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/pages/u/[userId].vue:29`

**該当コード（レビュー時点の diff）**:

```diff
+    void fetchEnterpriseUsageTabEligible(uid).then((eligible) => {
+      void router.replace(getOrdersPath(eligible ? 'usage' : undefined))
+    })
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  旧 usage URL の非同期リダイレクトを失効させてください**

旧 `/u/:userId?tab=usage` を開いた直後にユーザーが戻る操作や別ページへの遷移を行っても、この非同期判定はキャンセルされず、完了時に現在のルートを `/orders` へ `replace` します。判定には ID token と Firestore の複数 read が含まれるため競合時間があり、後からユーザーの正常な遷移を上書きできます。開始時の route を記録して完了時に一致を確認するか、watch の cleanup で古いリダイレクトを無効化してください。

**コメント要約**: 非同期 redirect が route 変更後も発火し、ユーザーの後続遷移を上書きしうる。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`requestPath = route.fullPath` を記録し、then/catch 完了時に一致確認してから replace。

---

**識別子**: RC-24（GitHub id: 3649670518）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/stores/enterprise.ts:12`

**該当コード（レビュー時点の diff）**:

```diff
+  const logoRenderGeneration = ref(0)
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  ロゴのキャッシュ版をページ再読込後も一意にしてください**

管理画面で固定 Storage パスのロゴを上書きした後、この世代番号はページ再読込のたびに `0` へ戻り、最初の解決で再び `v=1` になります。そのため、更新前に `...?v=1` がブラウザへキャッシュされ、更新直後は `v=2` で新画像を表示できても、次回の再読込では再利用された `v=1` から古いロゴが復活し得ます。既存指摘後に世代番号が追加されたことが新しい根拠ですが、セッション内でしか単調増加しないため、アップロード日時やオブジェクト世代など永続的に変化する値を使用してください。

**コメント要約**: RC-1 の logoRenderGeneration はセッション内のみ有効。再読込後 v=1 再利用で古いロゴが復活しうる。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: 指摘は技術的に妥当。永続 cache-bust（Storage metadata 更新日時・Enterprise スキーマへの logo 更新 epoch 等）の設計が必要。RC-1 対応の延長で工数 M。

---

**識別子**: RC-25（GitHub id: 3650210094）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/stores/enterprise.ts:24`

**該当コード（レビュー時点の diff）**:

```diff
+      logoRenderGeneration.value += 1
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  ロゴの cache-bust 値をページ再読込後も再利用しないでください**

`logoRenderGeneration` はメモリ上で 0 から始まり、最初の企業解決で毎回 1 になるため、固定 Storage URL は各ページロードで同じ `?v=1` に戻ります。旧ロゴを `?v=1` でキャッシュしたブラウザでは、管理画面で同一パスへ新ロゴを上書きして一度 `?v=2` を表示できても、ページ再読込後に再びキャッシュ済みの旧画像へ戻ります。サーバー側の更新時刻・保存済みバージョンなど、再起動をまたいでロゴ更新ごとに変わる値を使用してください。

**コメント要約**: RC-24 と同一論点。メモリ世代では再読込後 cache キーがリセットされる。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: RC-24 と同根。サーバー側永続値への置換が必要。

---

**識別子**: RC-26（GitHub id: 3651880394）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `enterprise/src/stores/enterprise.ts:24`

**該当コード（レビュー時点の diff）**:

```diff
+      logoRenderGeneration.value += 1
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  ロゴのキャッシュキーをセッションをまたいで更新してください**

`logoRenderGeneration` はページを読み直すたびに 0 へ戻り、初回の `resolveEnterprise()` で常に 1 になります。そのため、同じ Storage URL のロゴを上書きしたセッションでは一時的に `?v=2` で更新できても、その後の再読み込みでは過去にも使った `?v=1` に戻り、ブラウザが上書き前のロゴをキャッシュから再表示し得ます。ロゴの更新日時や保存世代など、サーバー側で更新のたびに変わり再読み込み後も維持される値をキャッシュキーに使用してください。

**コメント要約**: RC-24/25 と同一。セッション跨ぎで cache キーが単調増加しない。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: RC-24 と同根。👤 UX ラベルのため自動修正対象外。

---

**識別子**: RC-27（GitHub id: 3651880391）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `user/src/pages/orders.vue:20`

**該当コード（レビュー時点の diff）**:

```diff
+  const roomId = await waitForEventChatMembership(userId, params.communityId, params.eventId)
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  既存のチャット遷移 composable を再利用してください**

注文完了ダイアログからチャットを開く際、`router.push` などが例外を返すと、この関数の Promise がそのまま reject されます。呼び出し元の `UserSuccessJoinEventDialog` は `finally` しか持たないため、ユーザーには失敗通知が出ずダイアログに留まります。既存の `useNavigateToEventChat` は同じ処理を `try/catch` で包み、`chat.error.open_failed` を表示して `false` を返すので、ここでもその composable を利用してください。

**コメント要約**: RC-14 と同趣旨。composable 再利用を推奨するが try/catch 自体は RC-14 で対応済み。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: RC-14 で try/catch + `chat.error.open_failed` を実装済み。composable 化は 📐 リファクタ相当で必須ではない。
