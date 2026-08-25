# ブランチ fix/2304 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 15秒タイムアウトでローダーが先に消え isReady 未完了時に白画面が再発する<br>タイムアウトは replace フォールバックのみに変更 |
| [x] | RC-2 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | cleanup 失敗時に /login へ戻るが alert が無い<br>login_fail_generic を表示するよう統一 |
| [x] | RC-3 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | getResolvedConfig タイムアウト時にメンテ判定がスキップされる<br>可用性優先の意図的トレードオフとして許容 |
| [x] | RC-4 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | getIdTokenResult 失敗時にエンプラ PF ブロックをスキップ<br>白画面回避の fail-open として妥当 |
| [ ] | RC-5 | なし | 🟡 修正提案 | 未着手 | 📤 スコープ外 | — | 📐 リファクタ | M | router.onError の matched.length === 0 判定は一部失敗を救済しきれない<br>初回ナビゲーション失敗の検知を強化する余地あり |
| [x] | RC-6 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | CommunityCardMini で computed を auto-import 任せにしている<br>`import { computed } from 'vue'` を明示 |
| [x] | RC-7 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | CommunityCardMini が community store 購読をやめて Storage パス直指定になった<br>アイコン URL は community_id 由来でテナント差分なし。キャッシュバストは一覧では不要 |
| [x] | RC-8 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | enterprise コミュニティ一覧の totalCount watch に immediate が無い<br>store 再利用時に作成ダイアログが開かない。immediate: true を追加済み |
| [x] | RC-9 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | enterprise イベント一覧のコミュニティメニューが 1 回の open で 1 ページしか追加しない<br>メニュー開放中は useAutoLoadWhenEmpty で全件読み込み |
| [x] | RC-10 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | user コミュニティ一覧の totalCount watch に immediate が無い<br>store 再利用時に作成ダイアログが開かない。immediate: true を追加済み |
| [x] | RC-11 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | user イベント一覧のコミュニティメニューが 1 回の open で 1 ページしか追加しない<br>メニュー開放中は useAutoLoadWhenEmpty で全件読み込み |
| [x] | RC-12 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | manage トップのクライアント側 isManager フィルタを削除している<br>クエリが managers array-contains 済みのため権限は維持される |

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

---

## 評価セッション（2026-08-25 16:23・shokujii-code-review）

- **評価日時**: 2026-08-25 16:23 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: fix/2304
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **レビュー対象**: #2306 マネージャー画面読み込み改善（communityList lightweight / manage 一覧 / CommunityCardMini）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-6 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | CommunityCardMini で computed を auto-import 任せにしている<br>`import { computed } from 'vue'` を明示 |

---

**識別子**: RC-6（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/CommunityCardMini.vue:10`

**該当コード（レビュー時点の diff）**:

```diff
+const iconUrl = computed(() => convertStoragePathToURL(getCommunityIconStoragePath(props.community.community_id)))
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `base` 配下の Vue コンポーネントでは `computed` を auto-import 任せにせず `import { computed } from 'vue'` を明示する（`build:types` / 他 app との整合）

**コメント要約**:
CommunityCardMini で computed を auto-import 任せにしている。
`import { computed } from 'vue'` を明示。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: プロジェクト規約（base コンポーネントの Vue API 明示 import）に沿った修正。同一セッション内で対応済み。

---

## 評価セッション（2026-08-25 16:35・shokujii-code-review）

- **評価日時**: 2026-08-25 16:35 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: fix/2304
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2307
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **レビュー対象**: 未コミットのマネージャー画面 lightweight 化（communityList / manage 一覧 / CommunityCardMini）。既存機能の回帰確認を含む
- **手順 3b 自動修正**: RC-8 / RC-10（🟡 2件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-7 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | CommunityCardMini が community store 購読をやめて Storage パス直指定になった<br>アイコン URL は community_id 由来でテナント差分なし。キャッシュバストは一覧では不要 |
| [x] | RC-8 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | enterprise コミュニティ一覧の totalCount watch に immediate が無い<br>store 再利用時に作成ダイアログが開かない。immediate: true を追加済み |
| [x] | RC-9 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | enterprise イベント一覧のコミュニティメニューが 1 回の open で 1 ページしか追加しない<br>メニュー開放中は useAutoLoadWhenEmpty で全件読み込み |
| [x] | RC-10 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | user コミュニティ一覧の totalCount watch に immediate が無い<br>store 再利用時に作成ダイアログが開かない。immediate: true を追加済み |
| [x] | RC-11 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | user イベント一覧のコミュニティメニューが 1 回の open で 1 ページしか追加しない<br>メニュー開放中は useAutoLoadWhenEmpty で全件読み込み |
| [x] | RC-12 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | manage トップのクライアント側 isManager フィルタを削除している<br>クエリが managers array-contains 済みのため権限は維持される |

---

**識別子**: RC-7（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/CommunityCardMini.vue:11`

**該当コード（レビュー時点の diff）**:

```diff
-import { useAppCommunityStore } from '@shokujii/base/composable/useAppCommunityStore.js'
+import { computed } from 'vue'
+import { getCommunityIconStoragePath } from '@shokujii/common/utils/storagePaths.js'
+import { convertStoragePathToURL } from '../utils/storage'
 import { type BokudeliCommunity } from '../stores/community'
 
 const props = defineProps<{
   community: BokudeliCommunity
 }>()
-const communityStore = useAppCommunityStore(props.community)
+
+const iconUrl = computed(() => convertStoragePathToURL(getCommunityIconStoragePath(props.community.community_id)))
 </script>
 
 <template>
   <v-card class="mx-2" color="text-center" elevation="3">
     <v-row>
       <v-col class="pa-0">
-        <v-img :src="communityStore.iconImageUrl" style="border-radius: 5px 5px 5px 5px" aspect-ratio="1" cover />
+        <v-img :src="iconUrl" style="border-radius: 5px 5px 5px 5px" aspect-ratio="1" cover />
```

**レビュワーのコメント（原文）**:

👌 **修正不要**: CommunityCardMini が `useAppCommunityStore` をやめて Storage パス直指定になった。アイコン URL は `community_id` 由来でテナント差分はなく、store のキャッシュバストはアップロード直後の同一セッション向け。一覧カードでは community ドキュメントの id で十分

**コメント要約**:
CommunityCardMini が community store 購読をやめて Storage パス直指定になった。
アイコン URL は community_id 由来でテナント差分なし。キャッシュバストは一覧では不要。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: 一覧の N 件分の community store + members 購読を避けるのが lightweight 化の目的。表示に必要なのは community_id / community_name のみで、既存の CommunityCard も同じ Storage パス直指定。

---

**識別子**: RC-8（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/pages/manage/community/index.vue:40`

**該当コード（レビュー時点の diff）**:

```diff
+watch(
+  () => communityListStore.value.totalCount,
+  (count) => {
+    if (count === 0) {
+      isOpenNewCommunityDialog.value = true
+    }
+  },
+  { immediate: true },
+)
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `totalCount` の watch に `immediate: true` が無く、同一 Pinia store（manage トップと pageSize/filters が同じ）を再利用した直後は作成ダイアログが開かない → `{ immediate: true }` を付ける

**コメント要約**:
enterprise コミュニティ一覧の totalCount watch に immediate が無い。
store 再利用時に作成ダイアログが開かない。immediate: true を追加済み。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 規約「初期値の時点で既に条件を満たしうる watch に immediate: true」。同一セッション内で自動修正済み。

---

**識別子**: RC-9（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/pages/manage/event/index.vue:52`

**該当コード（レビュー時点の diff）**:

```diff
-const communityList = computed(() => {
-  if (communityListStore.value.communityStores == null) {
-    return null
+const communityList = computed(() => communityListStore.value.communities ?? [])
+
+const loadMoreCommunitiesForMenu = (isOpen: boolean) => {
+  if (!isOpen) {
+    return
   }
-  if (communityListStore.value.communityStores.length !== communityListStore.value.totalCount) {
+  const loaded = communityListStore.value.communities?.length ?? 0
+  const total = communityListStore.value.totalCount
+  if (total != null && loaded < total) {
     communityListStore.value.next()
   }
-  return communityListStore.value.communityStores.flatMap((communityStore) => communityStore.community ?? [])
-})
+}
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: コミュニティ切替メニューの追読みが open 1 回につき 1 ページ（5 件）だけ。旧実装は computed 内で `next()` を繰り返し全件ロードしていた → メニュー開放中は `loaded < total` の間 `next()` し続ける（watch または開放フラグ）

**コメント要約**:
enterprise イベント一覧のコミュニティメニューが 1 回の open で 1 ページしか追加しない。
旧実装は全件ロード。メニュー開放中は残件がなくなるまで next する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: computed 副作用の除去自体は正しい。`useAutoLoadWhenEmpty` でメニュー開放中のみ `loaded < total` の間 `next()` を連鎖し、1回の open で全件そろう挙動を復元。

---

**識別子**: RC-10（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `user/src/pages/manage/community/index.vue:33`

**該当コード（レビュー時点の diff）**:

```diff
+watch(
+  () => communityListStore.totalCount,
+  (count) => {
+    if (count === 0) {
+      isOpenNewCommunityDialog.value = true
+    }
+  },
+  { immediate: true },
+)
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `totalCount` の watch に `immediate: true` が無く、同一 Pinia store（manage トップと pageSize/filters が同じ）を再利用した直後は作成ダイアログが開かない → `{ immediate: true }` を付ける

**コメント要約**:
user コミュニティ一覧の totalCount watch に immediate が無い。
store 再利用時に作成ダイアログが開かない。immediate: true を追加済み。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-8 と同趣旨。同一セッション内で自動修正済み。

---

**識別子**: RC-11（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `user/src/pages/manage/event/index.vue:44`

**該当コード（レビュー時点の diff）**:

```diff
-const communityList = computed(() => {
-  if (communityListStore.communityStores == null) {
-    return null
+const communityList = computed(() => communityListStore.communities ?? [])
+
+const loadMoreCommunitiesForMenu = (isOpen: boolean) => {
+  if (!isOpen) {
+    return
   }
-  if (communityListStore.communityStores.length !== communityListStore.totalCount) {
+  const loaded = communityListStore.communities?.length ?? 0
+  const total = communityListStore.totalCount
+  if (total != null && loaded < total) {
     communityListStore.next()
   }
-  return communityListStore.communityStores.flatMap((communityStore) => communityStore.community ?? [])
-})
+}
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: コミュニティ切替メニューの追読みが open 1 回につき 1 ページ（5 件）だけ。旧実装は computed 内で `next()` を繰り返し全件ロードしていた → メニュー開放中は `loaded < total` の間 `next()` し続ける（watch または開放フラグ）

**コメント要約**:
user イベント一覧のコミュニティメニューが 1 回の open で 1 ページしか追加しない。
旧実装は全件ロード。メニュー開放中は残件がなくなるまで next する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-9 と同趣旨。`useAutoLoadWhenEmpty` でメニュー開放中のみ全件読み込み。

---

**識別子**: RC-12（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `user/src/pages/manage/index.vue:50`

**該当コード（レビュー時点の diff）**:

```diff
-const communities = computed(() => {
-  return (
-    communityListStore.communityStores?.flatMap((communityStore) => {
-      const community = communityStore.community
-      if (community == null || communityStore.members == null) {
-        return []
-      }
-      const isManager = community.managers?.some((managerRef) => managerRef.id === userId) ?? false
-      return isManager ? [community] : []
-    }) ?? []
-  )
-})
+const communities = computed(() => communityListStore.communities ?? [])
```

**レビュワーのコメント（原文）**:

👌 **修正不要**: クライアント側の `isManager` / `members` 待ちを外しても、クエリが `managers` array-contains 済みなので管理コミュニティ以外は出ない。members 未ロード待ちは CommunityCard / Mini に members を渡していなかったため表示内容も変わらない

**コメント要約**:
manage トップのクライアント側 isManager フィルタを削除している。
クエリが managers array-contains 済みのため権限は維持される。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: 既存機能（管理者のみ表示）は Firestore クエリ側で担保されている。enterprise 側も `enterprise_id` + `managers` 条件を維持。

