# ブランチ fix/2306 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 3851047205 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 48時間化後に期限超過イベントが自動却下されない<br>reject 判定を期限超過分すべてに変更 |
| [x] | RC-2 | 3851082932 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | RC-1 と同一（Codex P1）<br>移行漏れ。RC-1 と同修正で解消 |
| [x] | RC-3 | 3851082944 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | §3.2 174行目の 1/2 日後表記が実装と矛盾<br>1 日後に修正 |
| [x] | RC-4 | 3851082960 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 48時間要件が定数自己参照のみで検証弱い<br>定数=2 と 48h リテラル期待値を追加 |
| [ ] | RC-5 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | 却下の catch-up 挙動が仕様書に未記載<br>48時間超過分を次回ポーリングで一括却下する旨を追記 |
| [x] | RC-6 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 判定変更で `start` 引数が未使用のまま残存<br>`deadlineMillis` 1 引数に整理 |
| [ ] | RC-7 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🐛 実害 | 📐 リファクタ | M | 期限超過分を無制限並列で却下・メール失敗時に復旧不可<br>件数上限／並列度制限を検討 |
| [x] | RC-8 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 中核のバグ修正（判定変更）にテストなし<br>`rejectOrderMail.test.ts` を追加 |
| [x] | RC-9 | 3851567012 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | PartnerShop を値 import している<br>`import type` に変更 |
| [x] | RC-10 | 3862241886 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 空白のみ shop_email_sub1 がテンプレで truthy 表示<br>`resolveReplyToEmail` で正規化 |
| [x] | RC-11 | 3862251127 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 自動却下メールに Reply-To 未設定<br>主催者メールを replyTo に追加 |
| [x] | RC-12 | 5424574358 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | リマインドで replyTo 欠落時 warn なし<br>console.warn を追加 |
| [ ] | RC-13 | 3862482320 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | 承認・却下の CC 表記が実装（個別 to 送信）と不一致<br>SendGrid テンプレ doc を実装に合わせる |
| [x] | RC-14 | 3862482331 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 不正 shop_email_sub1 が Reply-To に使われる<br>isValidEmail で sub1 検証後フォールバック |
| [x] | RC-15 | 3862483393 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | orderRemindMail の console.warn<br>createModuleLogger に統一 |

---

## 評価セッション（2026-08-25 17:45・review-comments-evaluate）

- **評価日時**: 2026-08-25 17:45 JST
- **ブランチ名**: fix/2306
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2308
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（レビュー依頼 id:5407677621、Codex 接続案内 id:5407701363、Copilot トップレベル id:5407698434 は RC-1 と同一論点）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 3851047205 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 48時間化後に期限超過イベントが自動却下されない<br>reject 判定を期限超過分すべてに変更 |
| [x] | RC-2 | 3851082932 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | RC-1 と同一（Codex P1）<br>移行漏れ。RC-1 と同修正で解消 |
| [x] | RC-3 | 3851082944 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | §3.2 174行目の 1/2 日後表記が実装と矛盾<br>1 日後に修正 |
| [x] | RC-4 | 3851082960 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 48時間要件が定数自己参照のみで検証弱い<br>定数=2 と 48h リテラル期待値を追加 |

### RC-1

**識別子**: RC-1（GitHub id: 3851047205）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/pollingTask.ts:61`

**該当コード（レビュー時点の diff）**:

```diff
+      sendRejectOrderMailToShop(
+        start - SHOP_RESERVATION_APPROVAL_DEADLINE_DAYS * ONE_DAY_MILLIS,
+        end - SHOP_RESERVATION_APPROVAL_DEADLINE_DAYS * ONE_DAY_MILLIS,
+      ), // 48 時間（2 日）後却下通知
```

**レビュワーのコメント（原文）**:

[must] 承認期限を 48 時間に短縮した後、デプロイ時点で既に申請から 48〜72 時間経過している applying_reservation がある場合、この呼び出し形だと「48時間ちょうど前の 1 分間」のみが対象になり、それ以外は自動却下されずに残り続けます（start/end が 1 分幅で、reject 側も updatedAt を (start, end] で判定しているため）。48時間ルールを厳密に適用したいなら、reject 側の判定を「updatedAt <= end（= now-48h）」のように“期限を過ぎたもの全部”にする／もしくは移行期間の catch-up 方針（即却下を避けるなら 72h まで猶予する等）を実装で明示してください。

**コメント要約**: 1 分窓判定のため、デプロイ時点で 48 時間超過済みの申請が自動却下されない。<br>reject 側を期限超過分すべて対象にする必要がある。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘は妥当。`rejectOrderMail.ts` の判定を `updatedAt > end`（end = 現在時刻 − 48 時間）のみに変更し、移行漏れと継続運用の両方を解消した。

---

### RC-2

**識別子**: RC-2（GitHub id: 3851082932）

**レビュワー**: Codex

**指摘箇所**: `functions/default/src/pollingTask.ts:60`

**該当コード（レビュー時点の diff）**:

```diff
+      sendRejectOrderMailToShop(
+        start - SHOP_RESERVATION_APPROVAL_DEADLINE_DAYS * ONE_DAY_MILLIS,
+        end - SHOP_RESERVATION_APPROVAL_DEADLINE_DAYS * ONE_DAY_MILLIS,
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  既存の予約申請を新しい承認期限へ移行する**

デプロイ時点で申請から48時間を超えている `applying_reservation` イベントは、この1分間の検索窓を既に通過している一方、従来の3日後処理も削除されるため、自動却下されず申請中のまま残ります。特に48〜72時間経過した申請はPR説明にある「即却下」にはならないので、`bokudeli-event-batch` で既存対象を移行するか、移行期間だけ期限超過分を取得できる処理を用意してください。

**コメント要約**: RC-1 と同一論点。48 時間超過済み申請が申請中のまま残る。<br>batch または期限超過取得ロジックが必要。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-1 と同根。batch ではなく reject 判定の変更で対応（RC-1 参照）。

---

### RC-3

**識別子**: RC-3（GitHub id: 3851082944）

**レビュワー**: Codex

**指摘箇所**: `documents/08_エンタープライズ/10_仕様/04_詳細_メール配信.md:174`

**該当コード（レビュー時点の diff）**:

（インライン指摘なし — 174 行目の表記）

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  古い2日後リマインドの記述を削除する**

ここでは店舗向けリマインドを1日後のみに更新していますが、同じ仕様書の174行目には依然として「#15 は予約申請中（1/2日後）の未回答催促」と記載されています。実装の `SHOP_RESERVATION_REMIND_DAY_OFFSETS = [1]` と矛盾し、運用担当者が2日後にも送信されると誤認するため、同じ変更で174行目も1日後のみに揃えてください。

**コメント要約**: §3.2 174 行目が 1/2 日後のまま残り実装と矛盾。<br>1 日後表記に揃える。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 指摘妥当。174 行目を「1 日後」に修正済み。

---

### RC-4

**識別子**: RC-4（GitHub id: 3851082960）

**レビュワー**: Codex

**指摘箇所**: `common/src/constants/eventReservation.test.ts:12`

**該当コード（レビュー時点の diff）**:

```diff
+    expect(getShopReservationApprovalDeadlineMillis(updatedAt)).toBe(
+      updatedAt + SHOP_RESERVATION_APPROVAL_DEADLINE_DAYS * 24 * 60 * 60 * 1000,
+    )
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  48時間という固定要件をテストで直接検証する**

期待値を実装側と同じ `SHOP_RESERVATION_APPROVAL_DEADLINE_DAYS` から計算しているため、この定数が誤って1日や3日に変更されても、テスト名の「48時間」に反してテストは成功します。今回のビジネス要件を回帰から守れるよう、定数が2であること、または結果が固定の48時間分だけ増えることを独立したリテラル期待値で検証してください。

**コメント要約**: テストが定数自己参照のみで 48 時間要件を検証していない。<br>定数=2 と 48h リテラル期待値を追加すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`SHOP_RESERVATION_APPROVAL_DEADLINE_DAYS === 2` と `48 * 60 * 60 * 1000` リテラル期待値を追加済み。

---

## 評価セッション（2026-08-25 18:06・shokujii-code-review）

- **評価日時**: 2026-08-25 18:06 JST
- **ブランチ名**: fix/2306
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2308
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **自動修正**: RC-6・RC-8（🚨 0 件 / 🟡 2 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-5 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | 却下の catch-up 挙動が仕様書に未記載<br>48時間超過分を次回ポーリングで一括却下する旨を追記 |
| [x] | RC-6 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 判定変更で `start` 引数が未使用のまま残存<br>`deadlineMillis` 1 引数に整理 |
| [ ] | RC-7 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🐛 実害 | 📐 リファクタ | M | 期限超過分を無制限並列で却下・メール失敗時に復旧不可<br>件数上限／並列度制限を検討 |
| [x] | RC-8 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 中核のバグ修正（判定変更）にテストなし<br>`rejectOrderMail.test.ts` を追加 |

### RC-5

**識別子**: RC-5（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/06_メール通知/メール既存仕様.md:222`

**該当コード（レビュー時点の diff）**:

```diff
 #### 4.1.3 予約申請自動却下通知
-- **タイミング**: 予約申請から3日後（未回答の場合）
+- **タイミング**: 予約申請から2日後（48時間・未回答の場合）
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: 却下タイミングを「予約申請から2日後（48時間・未回答の場合）」に更新したが、実装は「48 時間を超えた未回答分を次回ポーリングで一括却下（catch-up）」で、48 時間ちょうどの 1 分窓ではない → 移行時に 48〜72 時間経過分が即却下される点を含めて仕様書に明記する。

**コメント要約**: 仕様書が「2日後」表記のみで、期限超過分を一括却下する catch-up 挙動が読み取れない。<br>移行直後に 48〜72 時間経過分が即却下される点も含め明記すべき。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: RC-1 / RC-2 の対応で挙動が「期限超過分すべて」に変わったため、仕様書の記述だけでは運用担当者が「48 時間ちょうどに 1 通」と誤解しうる。ただし移行時の即却下を仕様として明文化するかは仕様判断を含み、ラベルが 📑 仕様書のため [auto-fix-policy](../../.agents/skills/review-comments-evaluate/references/auto-fix-policy.md) の 🟡 自動修正対象外。ユーザー判断を待つ。

---

### RC-6

**識別子**: RC-6（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/rejectOrderMail.ts:68`

**該当コード（レビュー時点の diff）**:

```diff
 export async function sendRejectOrderMailToShop(start: number, end: number): Promise<void[]> {
-        if (updatedAt == null || updatedAt <= start || updatedAt > end) {
+        // 申請から承認期限を過ぎた applying_reservation を却下（1 分窓ではなく期限超過分すべて）
+        if (updatedAt == null || updatedAt > end) {
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 判定を `updatedAt > end` のみに変更した結果、`start` 引数が未使用のまま残っている。呼び出し側（`pollingTask.ts:58-61`）は `start - 2日` を計算して渡しているが判定に一切使われず、「1 分窓で判定している」という誤読を招く → `sendRejectOrderMailToShop(deadlineMillis: number)` の 1 引数に変更し、JSDoc と呼び出し側コメントに「期限超過分すべてが対象」であることを明記する。

**コメント要約**: 判定変更で `start` が未使用になり、呼び出し側の 1 分窓計算が無意味に残った。<br>`deadlineMillis` 1 引数へ整理し JSDoc で catch-up 前提を明記。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 「不要な変数への代入を中継していないか」「誤ったコメントを書いていないか」に該当。呼び出し元は `pollingTask.ts` のみで方針が一意のため自動修正した。

---

### RC-7

**識別子**: RC-7（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/rejectOrderMail.ts:76`

**該当コード（レビュー時点の diff）**:

```diff
-        if (updatedAt == null || updatedAt <= start || updatedAt > end) {
+        // 申請から承認期限を過ぎた applying_reservation を却下（1 分窓ではなく期限超過分すべて）
+        if (updatedAt == null || updatedAt > end) {
           return
         }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/M]: 対象が「期限超過分すべて」になったため、デプロイ直後は滞留していた申請が 1 回のポーリングで `Promise.all` により無制限並列で却下される（Firestore write + SendGrid 送信が同時多発）。加えて `updateEvent` 成功後にメール送信が失敗しても `catch` でログのみのため、店舗に通知されないまま `in_draft` に戻る → 1 回あたりの処理件数上限か並列度制限の導入を検討。

**コメント要約**: catch-up 化で 1 回のポーリングに集まる却下件数が増え、無制限並列と非復旧な失敗処理のリスクが上がった。<br>件数上限・並列度制限の導入を検討。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 並列度制限・ステータス更新とメール送信の順序見直しはいずれも既存構造の変更を伴い、方針が複数ある（バッチ件数制限 / SendGrid personalizations 化 / 送信成功後にステータス確定）。工数 M・📐 リファクタのため自動修正対象外。実際の滞留件数が小さければ現状維持でも運用可。

---

### RC-8

**識別子**: RC-8（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/rejectOrderMail.ts:85`

**該当コード（レビュー時点の diff）**:

```diff
-        if (updatedAt == null || updatedAt <= start || updatedAt > end) {
+        // 申請から承認期限を過ぎた applying_reservation を却下（1 分窓ではなく期限超過分すべて）
+        if (updatedAt == null || updatedAt > end) {
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 今回の中核であるバグ修正（RC-1 / RC-2 対応の判定変更）に vitest がなく、`documents/テスト方針・テスト項目書/テスト方針.md` の「バグ修正は再発防止テストを追加」に該当する → `orderRemindMail.test.ts` のモック方式を流用し、期限超過・期限内・ログ無しの 3 ケースを追加する。

**コメント要約**: 承認期限判定の変更が回帰テストで守られていない。<br>テスト方針 §「いつ Vitest を書くか」3 に該当。3 ケースを追加。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `common` 側には定数テストがあるが、実際の却下判定は `rejectOrderMail.ts` にあり未検証だった。既存 `orderRemindMail.test.ts` のモック方式で 1 ファイル追加のみのため自動修正した。

---

## 評価セッション（2026-08-25 21:28・review-comments-evaluate auto）

- **評価日時**: 2026-08-25 21:28 JST
- **ブランチ名**: fix/2306
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2308
- **REVIEW_REQUEST_SINCE**: 2026-08-25T09:25:49Z
- **partial**: true（Codex は no_issues のみ。Copilot 再レビューで substantive 指摘あり）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 4（依頼コメント id:5408309172、Codex 接続案内 id:5408331652、Codex no_issues id:5408363118、RC-5/RC-7 と同一論点の重複指摘）
- **手順 4a 自動修正**: RC-9（🚨 0 件 / 🟡 1 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-9 | 3851567012 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | PartnerShop を値 import している<br>`import type` に変更 |

### RC-9

**識別子**: RC-9（GitHub id: 3851567012）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/eventStatusChangeMail.ts:11`

**該当コード（レビュー時点の diff）**:

```diff
+import { PartnerShop } from '@shokujii/common/schemas/PartnerShop.js'
```

**レビュワーのコメント（原文）**:

[nits] `PartnerShop` は型注釈でしか使っていないため、値 import だと不要なランタイム依存（bundle 増加・循環依存リスク）になります。`import type` に変更してください。

**コメント要約**: PartnerShop は型のみ使用。値 import は不要なランタイム依存。<br>`import type` に変更すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。型注釈のみの利用のため `import type` に変更済み。

---

## 評価セッション（2026-08-26 20:30 JST・review-comments-evaluate・auto）

- **評価日時**: 2026-08-26 20:30 JST
- **ブランチ名**: fix/2306
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2308
- **REVIEW_REQUEST_SINCE**: 2026-08-26T11:20:37Z
- **partial**: false
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（レビュー依頼 id:5424542076、Codex 接続案内 id:5424576276）
- **持ち越し言及**: Copilot トップレベル id:5424574358 の `Promise.all` 指摘は RC-7 と同一（新規 RC なし）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-10 | 3862241886 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 空白のみ shop_email_sub1 がテンプレで truthy 表示<br>`resolveReplyToEmail` で正規化 |
| [x] | RC-11 | 3862251127 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 自動却下メールに Reply-To 未設定<br>主催者メールを replyTo に追加 |
| [x] | RC-12 | 5424574358 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | リマインドで replyTo 欠落時 warn なし<br>console.warn を追加 |

### RC-10

**識別子**: RC-10（GitHub id: 3862241886）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/eventStatusChangeMail.ts:114`

**該当コード（レビュー時点の diff）**:

```diff
+    shop_email_sub1: shop.shop_email_sub1 ?? '',
```

**レビュワーのコメント（原文）**:

[must] `shop_email_sub1` が空白のみ（例: `'   '`）の場合でもそのままテンプレに渡されるため、SendGrid 側の `{{#if shop_email_sub1}}` 判定が truthy になり、空行が表示される可能性があります。テンプレ表示用は trim して空なら `''` に正規化した方が安全です。

**コメント要約**: 空白のみ sub1 が Handlebars で truthy になり空行表示されうる。<br>trim 後空なら `''` に正規化すべき。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`createShopTemplateDataForOrganizerMail` で `resolveReplyToEmail` を使い空白 sub1 を `''` に正規化。

### RC-11

**識別子**: RC-11（GitHub id: 3862251127）

**レビュワー**: Codex

**指摘箇所**: `functions/default/src/rejectOrderMail.ts:71`

**該当コード（レビュー時点の diff）**:

```diff
         await sgMail.send({
           to: shopData.getEmails(),
           from: DEFAULT_FROM,
           cc: SUPPORT_MAIL,
           templateId: REJECT_ORDER_TEMPLATE_ID,
           dynamicTemplateData,
         })
```

**レビュワーのコメント（原文）**:

自動却下メールにも主催者の Reply-To を設定する。この PR では店舗向けの予約申請メールとリマインドに `getOrganizerReplyTo(event)` を設定していますが、この関数が店舗へ送る48時間経過後の自動却下通知には `replyTo` がありません。そのため、店舗が自動却下通知へ返信した場合だけ主催者ではなく既定の差出人へ届き、同じ予約申請フロー内で返信先が不整合になります。ここでも申請メールと同様に主催者メールを `replyTo` に渡してください。

**コメント要約**: 店舗向け自動却下通知にも主催者 Reply-To が必要。<br>申請・リマインドと返信先を揃える。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。#2321 の店舗向けメール群と整合するため `rejectOrderMail.ts` に `getOrganizerReplyTo` を追加。

### RC-12

**識別子**: RC-12（GitHub id: 5424574358・nits 部分）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/orderRemindMail.ts:131`

**該当コード（レビュー時点の diff）**:

```diff
+          const replyTo = getOrganizerReplyTo(event)
+
           await sgMail.send({
```

**レビュワーのコメント（原文）**:

[nits] `getOrganizerReplyTo` が `undefined` を返す場合に警告ログを出していません。`eventStatusChangeMail.ts` の `sendApplyingOrderMailToShop`（L193-195）では同様の状況で `logger.warn` を呼んでいるため、挙動に一貫性を持たせるなら warn を追加するか、ログ不要であれば `eventStatusChangeMail.ts` 側の warn も削除して揃えてください。

**コメント要約**: リマインド送信で organizer replyTo 欠落時の warn が無い。<br>申請メールとログ挙動を揃える。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`orderRemindMail.ts` に `console.warn` を追加（当ファイルの既存 warn スタイルに合わせる）。

---

## 評価セッション（2026-08-26 21:02・review-comments-evaluate auto）

- **評価日時**: 2026-08-26 21:02 JST
- **ブランチ名**: fix/2306
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2308
- **REVIEW_REQUEST_SINCE**: 2026-08-26T11:53:49Z
- **partial**: false
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 1（依頼コメント id:5424884440）
- **手順 4a 自動修正**: RC-14（🚨 1件）/ RC-15（🟡 1件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-13 | 3862482320 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | 承認・却下の CC 表記が実装と不一致<br>doc を個別 to 送信に修正 |
| [x] | RC-14 | 3862482331 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 不正 sub1 が Reply-To に使われる<br>isValidEmail でフォールバック |
| [x] | RC-15 | 3862483393 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | console.warn を logger に統一 |

### RC-13

**識別子**: RC-13（GitHub id: 3862482320）

**レビュワー**: Codex

**指摘箇所**: `documents/sendgridテンプレ/03_event_status_accepting_order.md:21`

**レビュワーのコメント（原文）**:

**P2** サポート宛の配信方式を実装に合わせて記載する — 表では承認・却下通知が `CC: SUPPORT_MAIL` とあるが、`eventStatusChangeMail.ts:140-152` では `SUPPORT_MAIL` を宛先配列へ追加し各宛先へ個別 `to` 送信しており `cc` は設定されない。

**コメント要約**: SendGrid テンプレ doc の CC 表記が実装（サポートへ個別 to）と矛盾する。<br>doc を実装に合わせるか CC 実装に揃える。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 指摘妥当。実装は個別 to 送信が正。doc 修正方針が明確だが 📑 仕様書ラベルのため自動修正対象外。

### RC-14

**識別子**: RC-14（GitHub id: 3862482331）

**レビュワー**: Codex

**指摘箇所**: `functions/default/src/utils/mail.ts:26-28`

**レビュワーのコメント（原文）**:

**P2** 不正なサブメールでは主メールへフォールバックする — `shop_email_sub1` に非メール形式が入ると Reply-To に設定され SendGrid 拒否の恐れ。有効な場合のみ sub1 を採用し `shop_email` へフォールバックすべき。

**コメント要約**: DB の sub1 が形式不正でも Reply-To に使われる。<br>メール形式検証後に shop_email へフォールバックが必要。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`getShopReplyTo` で `isValidEmail` 検証を追加しテスト拡充。

### RC-15

**識別子**: RC-15（GitHub id: 3862483393）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/orderRemindMail.ts:134`

**レビュワーのコメント（原文）**:

[imo] Functions 側のログは `createModuleLogger` へ寄せる方針のファイルが多いので、ここで追加した `console.warn` も logger 経由に揃えると運用ログの一貫性が上がります。

**コメント要約**: orderRemindMail の warn を createModuleLogger に統一すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘妥当。`createModuleLogger('orderRemindMail')` を導入し当ファイルの warn を logger に統一。

---
