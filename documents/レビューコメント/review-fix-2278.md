# ブランチ fix/2278 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 3802278952 | 🟡 修正提案 | 📤 #2282 別Issue化 | 📤 スコープ外 | 🔒 セキュリティ | 📋 仕様追加 | L | CG 未認証 read で PF 注文全件列挙可能<br>#2282 で公開 projection / 決済系フィールド除外を検討 |
| [x] | RC-2 | 3802288884 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 📄 ドキュメントのみ | S | PF member_orders は公開前提である旨を Rules コメントに明記<br>将来の機微フィールド混入防止 |
| [x] | RC-3 | 3802288929 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | テストコメントが T2 フィルタ説明と実態不一致<br>Rules 側 deny が主因と明記すべき |

---

## 評価セッション（2026-08-18 17:22・review-comments-evaluate）

- **評価日時**: 2026-08-18 17:22 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` manual）
- **ブランチ名**: fix/2278
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2281
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 4（レビュー依頼定型文×1、Codex 接続案内×1、Copilot トップレベル総評×1［インラインと重複］、Copilot Pull request overview×1［サマリのみ］）
- **自動修正**: ユーザー指示により手順 4a スキップ

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 3802278952 | 🟡 修正提案 | 📤 #2282 別Issue化 | 📤 スコープ外 | 🔒 セキュリティ | 📋 仕様追加 | L | CG 未認証 read で PF 注文全件列挙可能<br>#2282 で公開 projection / 決済系フィールド除外を検討 |
| [x] | RC-2 | 3802288884 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 📄 ドキュメントのみ | S | PF member_orders は公開前提である旨を Rules コメントに明記<br>将来の機微フィールド混入防止 |
| [x] | RC-3 | 3802288929 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | テストコメントが T2 フィルタ説明と実態不一致<br>Rules 側 deny が主因と明記すべき |

---

**識別子**: RC-1（GitHub id: 3802278952）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `firestore.rules:382`

**該当コード（レビュー時点の diff）**:

```diff
@@ -377,11 +377,12 @@ service cloud.firestore {
                             || isSameEnterprise(resource.data);
             }
             match /member_orders/{order} {
-                // collectionGroup はネスト path とは別評価。未認証の CG クエリを拒否し direct path の PF read をネスト側に委ねる
-                allow read: if request.auth != null
-                            && (docEnterpriseId(resource.data) == null
-                                || isSameEnterprise(resource.data)
-                                || request.auth.uid == resource.data.user_id);
+                // collectionGroup はネスト path とは別評価。read 条件はネスト側 member_orders と同一（#2278: PF は未認証 CG も可）
+                allow read: if docEnterpriseId(resource.data) == null
+                            || (request.auth != null && (
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  collectionGroup の認証必須条件を維持してください**

未認証クライアントが `collectionGroup('member_orders').where('enterprise_id', '==', null)` を実行すると、イベント単位の制約なしに全 PF 注文を列挙でき、`user_id`、注文状態、メニュー・価格、Stripe 関連フィールド等が漏えいします。追加されたテストの `event_id` 条件は Rules では要求されておらず防御になりません。また、`documents/08_エンタープライズ/00_計画/02_developmentマージ.md:87` では RC-36 の対策としてこの CG を認証必須と明記しています。ログアウト画面に必要な情報は公開専用 projection またはイベントにスコープした別経路で提供し、共有 `member_orders` CG の認証条件は残してください。

**コメント要約**: 未認証 CG で PF 注文を横断列挙でき、`stripe_id` 等を含む doc 全体が読める。RC-36 方針と矛盾するため認証必須を維持し、公開用 projection 等で #2278 を満たすべき。

**評価**: 🟡 修正提案

**ステータス**: 📤 #2282 別Issue化

**PRスコープ**: 📤 スコープ外

**ラベル**: 🔒 セキュリティ

**変更種別**: 📋 仕様追加

**想定工数**: L

**判断理由**: 指摘のリスク（PF 注文の CG 列挙・決済系フィールド露出）は事実上妥当。ただし本 PR は #2278 として **案 A（ネスト path と CG 条件を揃え未認証でも PF read 可）** を意図的に採用しており、マージ目的と Codex 提案（認証必須維持 + projection）は設計レベルで相反する。RC-36 はエンプラ補助情報の CG 漏洩防止が主眼で、PF 公開 read はネスト path 側で既に許容済み。ハードニング（公開フィールド限定・projection 非正規化・決済系フィールドの read 除外）は **#2282** で検討する。

---

**識別子**: RC-2（GitHub id: 3802288884）

**レビュワー**: Copilot

**指摘箇所**: `firestore.rules:380`

**該当コード（レビュー時点の diff）**:

```diff
@@ -377,11 +377,12 @@ service cloud.firestore {
                             || isSameEnterprise(resource.data);
             }
             match /member_orders/{order} {
-                // collectionGroup はネスト path とは別評価。未認証の CG クエリを拒否し direct path の PF read をネスト側に委ねる
-                allow read: if request.auth != null
-                            && (docEnterpriseId(resource.data) == null
-                                || isSameEnterprise(resource.data)
-                                || request.auth.uid == resource.data.user_id);
+                // collectionGroup はネスト path とは別評価。read 条件はネスト側 member_orders と同一（#2278: PF は未認証 CG も可）
```

**レビュワーのコメント（原文）**:

[ask] collectionGroup の member_orders を未認証で read 可にすると、PF の member_orders に含まれる stripe_id / processing_payment_intent 等（決済関連・一時フィールド）が collectionGroup 経由で列挙可能になります。意図どおりであれば、将来のフィールド追加で機微情報を混入させないためにも「公開される前提である」旨をコメントに明記しておくのが安全です。

**コメント要約**: PF 注文 doc には決済関連フィールドがあり、未認証 CG で列挙可能になる。意図的なら Rules コメントで公開前提を明記すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 指摘は妥当。CG 用 `member_orders` Rules に PF doc 全体が未認証 read 可である旨と `#2282` 参照をコメント追記済み。

---

**識別子**: RC-3（GitHub id: 3802288929）

**レビュワー**: Copilot

**指摘箇所**: `tests/firestore-rules/src/enterprise.test.ts:485`

**該当コード（レビュー時点の diff）**:

```diff
@@ -472,8 +473,17 @@ describe('enterprise firestore rules', () => {
 
     const unauthed = testEnv.unauthenticatedContext()
     const db = unauthed.firestore()
-    await assertFails(db.collectionGroup('member_orders').where('menu_name', '==', 'Enterprise Menu').get())
-    await assertFails(db.collectionGroup('member_orders').where('menu_name', '==', 'PF Menu').get())
+    const pfSnapUnauthed = await assertSucceeds(
+      db
+        .collectionGroup('member_orders')
+        .where('event_id', '==', 'event-pf')
+        .where('enterprise_id', '==', null)
+        .get(),
+    )
+    expect(pfSnapUnauthed.docs.length).toBe(1)
+    expect(pfSnapUnauthed.docs[0].data().menu_name).toBe('PF Menu')
+    // エンプラ member_orders の CG 露出は T2（enterprise_id == null フィルタ）で遮断。未認証 CG は PF doc のみ検証。
```

**レビュワーのコメント（原文）**:

テスト内コメントの「enterprise_id == null フィルタで遮断」は、実際には Rules 側で enterprise_id != null の doc を未認証で deny している点が主因なので、誤解を避けるため表現を修正したいです。

**コメント要約**: テストコメントがクライアント側フィルタで遮断しているように読めるが、実際は per-document Rules 評価が主因。文言修正推奨。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘は正確。テストコメントを Rules per-document deny が主因である旨に修正済み。

---
