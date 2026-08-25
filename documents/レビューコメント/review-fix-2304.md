# ブランチ fix/2304 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 15秒タイムアウトでローダーが先に消え isReady 未完了時に白画面が再発する<br>タイムアウトは replace フォールバックのみに変更 |
| [x] | RC-2 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | cleanup 失敗時に /login へ戻るが alert が無い<br>login_fail_generic を表示するよう統一 |
| [x] | RC-3 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | getResolvedConfig タイムアウト時にメンテ判定がスキップされる<br>可用性優先の意図的トレードオフとして許容 |
| [x] | RC-4 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | getIdTokenResult 失敗時にエンプラ PF ブロックをスキップ<br>白画面回避の fail-open として妥当 |
| [ ] | RC-5 | なし | 🟡 修正提案 | 未着手 | 📤 スコープ外 | — | 📐 リファクタ | M | router.onError の matched.length === 0 判定は一部失敗を救済しきれない<br>初回ナビゲーション失敗の検知を強化する余地あり |

---

## 評価セッション（2026-08-25 15:56・shokujii-code-review）

- **評価日時**: 2026-08-25 15:56 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: fix/2304
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 15秒タイムアウトでローダーが先に消え isReady 未完了時に白画面が再発する<br>タイムアウトは replace フォールバックのみに変更 |
| [x] | RC-2 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | cleanup 失敗時に /login へ戻るが alert が無い<br>login_fail_generic を表示するよう統一 |
| [x] | RC-3 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | getResolvedConfig タイムアウト時にメンテ判定がスキップされる<br>可用性優先の意図的トレードオフとして許容 |
| [x] | RC-4 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | getIdTokenResult 失敗時にエンプラ PF ブロックをスキップ<br>白画面回避の fail-open として妥当 |
| [ ] | RC-5 | なし | 🟡 修正提案 | 未着手 | 📤 スコープ外 | — | 📐 リファクタ | M | router.onError の matched.length === 0 判定は一部失敗を救済しきれない<br>初回ナビゲーション失敗の検知を強化する余地あり |

---

**識別子**: RC-1（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `user/src/main.ts:50`

**該当コード（レビュー時点の diff）**:

```diff
+  const loaderTimeout = window.setTimeout(hideInitialLoader, 15000)
+  void routerMod.router
+    .isReady()
+    .catch(() => routerMod.router.replace('/').catch(() => undefined))
+    .finally(() => {
+      window.clearTimeout(loaderTimeout)
+      hideInitialLoader()
+    })
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 15秒タイムアウトで `hideInitialLoader` を直接呼ぶと、`router.isReady()` が未完了の間（OAuth 復帰 + Cloud Functions が遅い場合）にローダーだけ消えて再び白画面になる → タイムアウトは `/` への replace フォールバックのみに使い、ローダー除去は `finally` に限定する

**コメント要約**:
15秒タイムアウトでローダーが先に消え isReady 未完了時に白画面が再発する。
タイムアウトは replace フォールバックのみに変更。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 本 Issue の主目的（復帰中の白画面）と矛盾する挙動のため修正。タイムアウト時のナビゲーション救済は維持しつつ、表示は isReady 完了まで継続するのが正しい。

---

**識別子**: RC-2（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `user/src/router/authEntryGuards.ts:93`

**該当コード（レビュー時点の diff）**:

```diff
   } catch (err) {
     console.error(err)
     await signOutBestEffort()
-    return false
+    return { path: '/login', query }
   }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: cleanup 失敗時に `/login` へリダイレクトするが、他経路と異なり alert が無くユーザーに理由が伝わらない → `login.login_fail_generic` を表示する

**コメント要約**:
cleanup 失敗時に /login へ戻るが alert が無い。
login_fail_generic を表示するよう統一。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 白画面回避後も無言でログイン画面に戻ると混乱する。同一関数内の他失敗経路と UX を揃える。

---

**識別子**: RC-3（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/config.ts:48`

**該当コード（レビュー時点の diff）**:

```diff
+        const timeoutId = setTimeout(() => {
+          finish(undefined)
+        }, CONFIG_RESOLVE_TIMEOUT_MS)
```

**レビュワーのコメント（原文）**:

👌 **修正不要**: `getResolvedConfig` タイムアウト時は `undefined` を返しメンテナンス判定がスキップされる。メンテ中に Firestore が遅い rare case では一時的に PF が見える可能性があるが、永久 pending による白画面より可用性を優先するトレードオフとして妥当

**コメント要約**:
getResolvedConfig タイムアウト時にメンテ判定がスキップされる。
可用性優先の意図的トレードオフとして許容。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: Issue #2304 のスコープ外。タイムアウト自体が白画面回避のための変更。

---

**識別子**: RC-4（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `user/src/router/index.ts:394`

**該当コード（レビュー時点の diff）**:

```diff
+    try {
+      const token = await user.getIdTokenResult()
+      ...
+    } catch (err) {
+      console.error('Failed to resolve enterprise claims; allowing navigation:', err)
+    }
```

**レビュワーのコメント（原文）**:

👌 **修正不要**: `getIdTokenResult` 失敗時にエンプラ PF ブロックをスキップする fail-open。エンプラユーザーが一時的に PF を見える可能性はあるが、暫定ガードであり白画面より優先度が低い

**コメント要約**:
getIdTokenResult 失敗時にエンプラ PF ブロックをスキップ。
白画面回避の fail-open として妥当。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: コメントどおり暫定ガード。本 PR の主目的に沿った判断。

---

**識別子**: RC-5（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/utils/setupGlobalErrorHandling.ts:58`

**該当コード（レビュー時点の diff）**:

```diff
+    if (router.currentRoute.value.matched.length === 0) {
+      void router.replace('/').catch(() => undefined)
+    }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/M]: `router.onError` の `matched.length === 0` だけでは、初回ナビゲーション失敗の一部ケースを救済できない（currentRoute が部分マッチしたまま残る等）→ 初回ナビゲーション失敗専用フラグや isReady 連携で検知を強化する余地あり

**コメント要約**:
router.onError の matched.length === 0 判定は一部失敗を救済しきれない。
初回ナビゲーション失敗の検知を強化する余地あり。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📤 スコープ外

**ラベル**: —

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 本 PR の最小修正（案 A + C）の範囲を超える。現状でも main.ts の isReady フォールバックで主要経路はカバーされるため別 Issue 化を推奨。
