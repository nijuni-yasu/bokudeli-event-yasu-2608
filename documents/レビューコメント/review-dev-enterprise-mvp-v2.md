# ブランチ dev/enterprise-mvp-v2 レビュー記録

## 評価セッション（2026-07-19 18:05・shokujii-code-review）

- **評価日時**: 2026-07-19 18:05 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: 未作成
- **指摘なし**（チェックリスト照合のみ。stripes 0047 本リポ差分）

**確認要点（👌）**:

- `EventStripe`: `enterprise_id` nullable + `convertToDb` で `?? null` materialize（`EventMemberOrder` 同型）
- `EventStripe.test.ts`: 未設定/null/string の 3 ケース
- `stripeWebhook`: PF 決済で `enterprise_id: enterpriseId ?? null` 明示保存
- doc: 02 §2.3.1 に 0047 節、01 F-1 メモに 0046/0047 整理
- batch 0047 実装は `bokudeli-event-batch` 別リポ（本 diff 外）

---

## 評価セッション（2026-07-19 15:40・shokujii-code-review）

- **評価日時**: 2026-07-19 15:40 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S | 02 §1 共有カート行が旧 `cart.vue` options 空の記述のまま<br>F-1 実装（main.ts default options）に合わせて更新 |

---

**識別子**: RC-1（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/08_エンタープライズ/00_計画/02_developmentマージ.md:24`

**該当コード（レビュー時点の diff）**:

```diff
-| 共有カート | `base/src/components/pages/cart.vue` は token の `enterprise_id` を `buildEventStoreOptions` 経由で `useEventStore` に渡し、PF ユーザー（claims なし）は options 空のまま既存 PF 動線を維持 |
+| 共有カート | `user` / `enterprise` は `main.ts` で `setDefaultEventStoreOptions(buildEventStoreOptions(...))` を注入。`cart.vue` は token から `buildEventStoreOptions` を解決。partner は default `{}`（CG 無フィルタ） |
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄 ドキュメントのみ/S]: §1 共有カート行が F-1 実装前の「PF は options 空」記述のまま。`user/main.ts` の default options 注入と矛盾する → 現行実装に合わせて更新する。

**コメント要約**:

02_developmentマージ §1 の共有カート説明が旧仕様のまま残っていた。
F-1 で `setDefaultEventStoreOptions` を導入したため、ドキュメントを現行動線に同期した。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 実装と計画書の乖離はデプロイ手順の誤解を招く。文言更新のみで一意。

---

## 評価セッション（2026-07-19 15:38・shokujii-code-review）

- **評価日時**: 2026-07-19 15:38 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: 未作成
- **指摘なし**（チェックリスト照合のみ。F-1/F-2 実装差分）

**確認要点（👌）**:

- F-1: `EventMemberOrder` nullable materialize、`buildEventStoreOptions` 三値、partner 無フィルタ分離、CG index 追加
- F-2: `authGuards.ts` 公開ルート除外型、`/pass-code` 含む
- デプロイゲート: batch **`0046`**（member_orders backfill）task 追加済み・**実行は CG 本番切替前**（[`bokudeli-event-batch` docs/0046](https://github.com/nijuniinc/bokudeli-event-batch/blob/main/docs/0046_member_orders_enterprise_id_backfill.md)）

---

## 評価セッション（2026-07-19 18:45・review-comments-evaluate）

- **評価日時**: 2026-07-19 18:45 JST
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: #2120
- **REVIEW_REQUEST_SINCE**: 2026-07-19T09:32:07Z
- **partial**: true（Codex limits / connect のみ）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 4（レビュー依頼 5015214142、Codex limits 5015214668、Codex connect 5015235106、Copilot overview のみ 5015234853 冒頭）
- **手順 4a 自動修正**: RC-3 / RC-4 / RC-10（🚨 2件 / 🟡 1件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-3 | 3610307757 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | deleteUserDocuments の allSettled 失敗を reject |
| [x] | RC-4 | 3610307766 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | enterpriseBillInvoicePdf の currentUser 明示チェック |
| [x] | RC-10 | 5015234853 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | useSessionTimeout の unhandled rejection 防止 |
| [x] | RC-2 | 3610307742 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📐 リファクタ | M | userOrderHistoryList storeId の JSON.stringify |
| [x] | RC-5 | 3610307771 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | M | admin ダッシュボード loadDashboard 競合ガード |
| [x] | RC-6 | 3610307781 | 🟡 修正提案 | 📤 #2198 別Issue化 | 📤 スコープ外 | 📑 仕様書 | 📋 仕様追加 | M | PF プロフィール null フィルタと backfill ゲート<br>https://github.com/nijuniinc/bokudeli-event-new/issues/2198 |
| [x] | RC-7 | 3610307784 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | — | 📐 リファクタ | M | materio NavLink onClick 追加の規約違反 |
| [x] | RC-8 | 5015234853 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | — | 📐 リファクタ | M | VerticalNavLink materio 直修正 |
| [x] | RC-9 | 5015234853 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | — | 📐 リファクタ | M | HorizontalNavLink materio 直修正 |
| [x] | RC-11 | 5015234853 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | invoices console.error → reportClientError |

---

## 評価セッション（2026-07-19 18:54・shokujii-code-review）

- **評価日時**: 2026-07-19 18:54 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: #2120
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0
- **対象**: RC-3 / RC-4 / RC-10 自動修正の未コミット差分（review スコープ更新分）

**指摘なし**（チェックリスト照合 + Copilot 自動修正の実装確認）

**確認要点（👌）**:

- RC-3 `deleteUserDocuments`: `Promise.allSettled` の `rejected` を検出し先頭 `reason` を throw。`rollbackCreatedEnterpriseMember` 経由で失敗が握りつぶされなくなる
- RC-4 `getEnterpriseBillInvoicePdf`: `currentUser!` を廃止し `user == null` で `Not authenticated` を throw。呼び出し側で catch 可能
- RC-10 `useSessionTimeout`: `runCheckTimeout` で `void checkTimeout().catch(...)` により interval / visibilitychange からの unhandled rejection を防止
- evaluate セッション追記（review doc）のみの変更は記録用でコード影響なし

---

## 評価セッション（2026-07-19 18:58・shokujii-code-review）

- **評価日時**: 2026-07-19 18:58 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: #2120
- **指摘なし**（RC-2/5/7-9/11 実装 + RC-3/4/10 含む全差分のチェックリスト照合）

**確認要点（👌）**:

- RC-2: `profileListFilter` 型で storeId キー安定化、`user` / `enterprise` ProfilePage から `profileFilter` 指定
- RC-5: `admin/index.vue` に `loadSeq` ガード（`invoices.vue` 同型）
- RC-6: Issue #2198 起票、review doc を別 Issue 化
- RC-7〜9: materio 3 ファイルを `origin/development` へ revert
- RC-11: `invoices/[yearMonth].vue` で `reportClientError` 使用

---

## 評価セッション（2026-07-19 22:16・shokujii-code-review）

- **評価日時**: 2026-07-19 22:16 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: #2120
- **指摘なし**（D-5 認可レイヤ実装差分のチェックリスト照合）

**確認要点（👌）**:

- `assertEnterpriseProfileAccess` が仕様 §5.2.1 の 6 パターンを HttpsError で返却
- PF 版は `isEnterpriseViewer` 分岐で既存ロジック維持、エンプラのみ store / resolver フィルタ
- `UserProfilePage` が Callable 成功前に bio を表示しない RC-44 ゲート
- Vitest（enterpriseProfileAccess / enterpriseFriendVisibility / userFriendsResolver / recountUserProfileCounts）追加済み

---

## 評価セッション（2026-07-19 22:26・shokujii-code-review）

- **評価日時**: 2026-07-19 22:26 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: #2120
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0
- **手順 3a/3b 自動修正**: RC-12 / RC-13

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-12 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | assertEnterpriseProfileAccess のテナント不一致判定が member 取得より後で EP-4 違反 |
| [x] | RC-13 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | profileDisplayUser が Firestore user にフォールバックし RC-44 を弱める |

---

**識別子**: RC-12（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/utils/enterpriseProfileAccess.ts:51`

**該当コード（レビュー時点の diff）**:

```diff
+  const targetMember = await getEnterpriseMember(viewerEnterpriseId, targetUserId)
+  if (targetMember == null || !targetMember.is_active) {
+    throw new HttpsError('not-found', '存在しないユーザーです')
+  }
+
+  if (viewerEnterpriseId !== targetEnterpriseId) {
+    throw new HttpsError('permission-denied', '閲覧権限がありません')
+  }
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `getEnterpriseMember` が null の他社 uid に `not-found` を返し、仕様 §5.2.1 手順 5（EP-4）の `permission-denied` にならない → テナント不一致を member 取得前に判定する

**判断理由**: EP-4 は他社閲覧を `permission-denied` と明記。member 不在を先に `not-found` にすると UI が「存在しないユーザー」になり誤表示。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

---

**識別子**: RC-13（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/components/profile/UserProfilePage.vue:113`

**該当コード（レビュー時点の diff）**:

```diff
+const profileDisplayUser = computed(() => {
+  const profile = previewData.value?.user_profile
+  if (profile != null) {
+    return new User(profile.user_id, profile)
+  }
+  return user.value
+})
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `profileDisplayUser` が Callable 失敗前の Firestore `user` にフォールバックし、RC-44 の情報漏洩防御が弱くなる → Callable の `user_profile` のみを正本にし、未使用の `useUserStore` を削除

**判断理由**: ゲート通過後も computed 経由で Firestore 読み取り結果が表示に使える経路が残る。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**未着手の 🟡（本セッション）**:

- Callable 結合テスト（`getUserProfilePreview` / `getUserFriends` の enterprise 分岐）が計画 §8 にあるが未追加
- `previewError` 時の UI 分岐がなく、ネットワークエラー等で空白画面になりうる
- `classifyEnterpriseFriend` の友人ループ内 `getEnterpriseMember` が N+1（大量友人時のレイテンシ）

---

## 評価セッション（2026-07-20 13:05・review-comments-evaluate）

- **評価日時**: 2026-07-20 13:05 JST
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: #2120
- **REVIEW_REQUEST_SINCE**: 2026-07-19T13:32:10Z（手動 evaluate・当該時刻以降の新規コメント）
- **partial**: true（Codex limits / connect のみ。新規 substantive インラインなし）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 5（レビュー依頼 5015908916、Codex limits 5015906178 / 5015909346、Codex connect 5015941083、5015940812 内 user ProfilePage null フィルタ指摘は RC-6 と重複）
- **手順 4a 自動修正**: RC-14 / RC-16 / RC-17（🚨 2件 / 🟡 1件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-14 | 5015940812 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | M | enterpriseMemberMonthlyUsage が getDoc 直呼び出し<br>base store 経由 + withConverter に修正済み |
| [ ] | RC-15 | 5015940812 | 🟡 修正提案 | 未着手 | 📤 スコープ外 | 💾 データ | 📐 リファクタ | M | dashboard store の CG 全件スキャン<br>期間フィルタ移行は別 PR / Issue 推奨 |
| [x] | RC-16 | 3610651349 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | invoice_files create 失敗 code 6 がマジックナンバー<br>`FIRESTORE_ALREADY_EXISTS_CODE` 定数化 |
| [x] | RC-17 | 3610651329 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | enterpriseMail の空文字 enterprise_id を true 扱い<br>`!== ''` 条件を追加 |

---

**識別子**: RC-14（GitHub id: 5015940812・Copilot トップレベル内指摘）

**レビュワー**: Copilot

**指摘箇所**: `enterprise/src/composable/enterpriseMemberMonthlyUsage.ts:38`

**該当コード（レビュー時点の diff）**:

（インライン指摘なし・トップレベル #5015940812 より）

```diff
+    const [memberSnap, enterpriseSnap] = await Promise.all([
+      getDoc(doc(db, 'enterprises', enterpriseId, 'members', userId)),
+      getDoc(doc(db, 'enterprises', enterpriseId)),
+    ])
```

**レビュワーのコメント（原文）**:

**`enterprise/src/composable/enterpriseMemberMonthlyUsage.ts`** [must]

`getDoc(doc(db, 'enterprises', ...))` を withConverter なしで直接呼んでおり、shokujii-firestore の「DB 操作は必ず store 経由、xxxRef は必ず withConverter 付き」ルールに違反しています。隣の `useEnterpriseAdmin.ts` が `getEnterpriseById()`（base store）を使うのと不整合です。

**コメント要約**:

月次 usage composable が Firestore を withConverter なしで直接読んでいた。
base store に `getEnterpriseMemberById` を追加し、`getEnterpriseById` と併用する形に揃えた。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: AGENTS.md / shokujii-firestore の store 経由・withConverter 必須に反する。Zod バリデーションをバイパスしうる。base に member ref を追加して composable を store 経由に変更するのが一意。

---

**識別子**: RC-15（GitHub id: 5015940812・Copilot トップレベル内指摘）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/stores/dashboard.ts:38`

**該当コード（レビュー時点の diff）**:

（インライン指摘なし・トップレベル #5015940812 より）

**レビュワーのコメント（原文）**:

- **`functions/default/src/stores/dashboard.ts`**: `listOrderedMemberOrdersByEnterprise` / `listStripesByEnterprise` / `listOrderCreateAuditLogs` が期間フィルタなしの collectionGroup 全件スキャンです。データが増えると読み取りコストが線形増加するため、既存インデックス（`enterprise_id` + `updated_at`）を使った `updated_at` 範囲フィルタへの移行を将来的に推奨します。

**コメント要約**:

ダッシュボード集計 store が期間条件なし CG 全件取得のため、データ増加時に読み取りコストが線形増加する。
`updated_at` 範囲フィルタへの移行は本 PR（D-5 認可）のスコープ外。別 PR / Issue で対応推奨。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📤 スコープ外

**ラベル**: 💾 データ

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 指摘は妥当だがパフォーマンス改善であり、本 PR の D-5 認可レイヤとは独立。インデックス・集計仕様の確認が必要なため別 Issue 化が自然。

---

**識別子**: RC-16（GitHub id: 3610651349）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/stores/enterpriseInvoiceFile.ts:45`

**該当コード（レビュー時点の diff）**:

```diff
+    const code = (error as { code?: number }).code
+    if (code === 6) {
+      return 'already_exists'
+    }
```

**レビュワーのコメント（原文）**:

[nits] Firestore の `ref.create()` 失敗時の `code === 6` は意図（ALREADY_EXISTS）が読み取りづらいので、マジックナンバーにならないようコメントか定数化をお願いします。

**コメント要約**:

請求書メタ create の ALREADY_EXISTS 判定が gRPC code `6` のマジックナンバーだった。
`FIRESTORE_ALREADY_EXISTS_CODE` 定数とコメントで意図を明示した。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 可読性改善。定数化で一意に解消可能。

---

**識別子**: RC-17（GitHub id: 3610651329）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/utils/enterpriseMail.ts:9`

**該当コード（レビュー時点の diff）**:

```diff
+export function isEnterpriseUser(user: { enterprise_id?: string | null }): boolean {
+  return user.enterprise_id != null
+}
```

**レビュワーのコメント（原文）**:

[must] `enterprise_id` が空文字（""）のケースでも true になってしまい、PF 扱いしたいデータまでエンプラ判定される可能性があります（他箇所では `enterprise_id != null && enterprise_id !== ''` としているため整合しません）。空文字は未設定として扱う条件に揃えてください。

**コメント要約**:

D-1 メール制御の `isEnterpriseEvent` / `isEnterpriseUser` が空文字 `""` をエンプラ扱いしていた。
`eventDraft.ts` 等と同様 `!== ''` を追加し PF メール skip 誤判定を防止。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 空文字 enterprise_id は materialize 過渡期に存在しうる。エンプラ判定が true だと PF 向けメールが skip され実害になりうる。

---

## 評価セッション（2026-07-20 13:05・shokujii-code-review）

- **評価日時**: 2026-07-20 13:05 JST
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: #2120
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0
- **対象**: RC-14〜17 自動修正差分（evaluate 手順 4a）+ `enterpriseMail.test.ts` 追補
- **手順 3b 自動修正**: RC-18

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-18 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | RC-17 の空文字判定に空文字 false テストが未追加<br>両関数に it を追加済み |

---

**識別子**: RC-18（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/utils/enterpriseMail.test.ts:17`

**該当コード（レビュー時点の diff）**:

```diff
   it('enterprise_id が undefined なら false', () => {
     expect(isEnterpriseEvent({})).toBe(false)
     expect(isEnterpriseEvent({ enterprise_id: undefined })).toBe(false)
   })
 })
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: RC-17 で `isEnterpriseEvent` / `isEnterpriseUser` に空文字除外を追加したが、回帰防止の vitest が null/undefined のみで `''` ケースが無い → 空文字 false の it を両 describe に追加する。

**コメント要約**:

RC-17 修正の回帰テストとして空文字 `''` が false になる it を追加した。
`enterpriseMail.test.ts` 8 件すべて pass。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: テスト方針上、バグ修正に対応する境界値テストは S 工数で追加が妥当。修正方針は一意。

**確認要点（👌）**:

- `base/src/stores/enterprise.ts`: `enterpriseMemberConverter` + `getEnterpriseMemberById` が withConverter 付き ref 経由
- `enterpriseMemberMonthlyUsage.ts`: Firestore 直呼び出し削除、`getEnterpriseById` / `getEnterpriseMemberById` 利用
- `enterpriseInvoiceFile.ts`: `FIRESTORE_ALREADY_EXISTS_CODE` 定数化
- `enterpriseMail.ts`: `!== ''` が `eventDraft.ts` と整合

---
